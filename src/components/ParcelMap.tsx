import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Query from "@arcgis/core/rest/support/Query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import debounce from "lodash/debounce";
import { useParcelStore } from "../store/parcelStore";
import { getResponsiveStyles } from "./ParcelMapStyles";
import {type SxProps,type Theme } from "@mui/material";

interface PopulationData {
  id: number;
  location: string;
  region: string;
  coordinates: string;
  users: number;
  status: string;
  lastUpdated: string;
  OBJECTID?: number;
}

interface ParcelMapProps {
  selectedId: number | null;
  onSelectFromMap: (id: number) => void;
  onMapViewReady?: (view: MapView) => void;
  filter?: string | null;
  data: PopulationData[];
}

interface ParcelMapRef {
  updateFilter: (region: string | null) => void;
}

const featureLayerUrl =
  "https://infomapapp.com/ksaarcgis/rest/services/Hosted/AbuDhabi_Boundary/FeatureServer/2";

const ParcelMap = forwardRef<ParcelMapRef, ParcelMapProps>(
  ({ selectedId, onMapViewReady, filter, data }, ref) => {
    const mapDiv = useRef<HTMLDivElement>(null);
    const viewRef = useRef<MapView | null>(null);
    const webMapRef = useRef<WebMap | null>(null);
    const layerRef = useRef<FeatureLayer | null>(null);
    const populationLayerRef = useRef<FeatureLayer | null>(null);
    const sketchLayerRef = useRef<GraphicsLayer | null>(null);
    const markersLayerRef = useRef<GraphicsLayer | null>(null);
    const highlightRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { t, i18n } = useTranslation();
    const isMounted = useRef(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isMapReady, setIsMapReady] = useState(false);
    const [layerVisibility, setLayerVisibility] = useState({
      parcels: true,
      population: true,
      markers: true,
    });
    const [hasZoomed, setHasZoomed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [sketchVM, setSketchVM] = useState<SketchViewModel | null>(null);
    const [selectedGraphic, setSelectedGraphic] = useState<Graphic | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    // Media query for screen width between 900px and 1100px
    const isMidRange = useMediaQuery("(min-width:900px) and (max-width:1100px)");

    // Get styles with isMidRange as parameter
    const responsiveStyles = getResponsiveStyles({ isMidRange });

    const stableT = useCallback((key: string) => t(key), [t]);

    const debouncedGoTo = useCallback(
      debounce((view: MapView, options: any) => {
        if (isMounted.current && view) {
          view
            .when(() => {
              view.goTo(options).catch((err) => {
                console.error("Error in debounced goTo:", err);
              });
            })
            .catch((err) => {
              console.warn("View not ready yet:", err);
            });
        }
      }, 300),
      []
    );

    const memoizedData = useMemo(() => data, [data]);
    const lastFilteredData = useRef<PopulationData[]>([]);

    const defaultMarkerSymbol = useMemo(
      () =>
        new SimpleMarkerSymbol({
          color: [226, 119, 40],
          outline: {
            color: [255, 255, 255],
            width: 1,
          },
          size: "8px",
        }),
      []
    );

    const highlightedMarkerSymbol = useMemo(
      () =>
        new SimpleMarkerSymbol({
          color: [255, 193, 7],
          outline: {
            color: [255, 255, 255],
            width: 2,
          },
          size: "12px",
          style: "circle",
        }),
      []
    );

    useImperativeHandle(ref, () => ({
      updateFilter: (region: string | null) => {
        if (!viewRef.current || !isMounted.current) return;

        const filteredData = region
          ? memoizedData.filter((item) => item.region === region)
          : memoizedData;

        if (filteredData.length === 0) {
          debouncedGoTo(viewRef.current, {
            center: [54.37, 24.47],
            zoom: 10,
          });
          return;
        }

        const markersLayer =
          markersLayerRef.current || new GraphicsLayer({ id: "markers-layer" });
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLon = Infinity;
        let maxLon = -Infinity;
        const graphics: Graphic[] = [];

        filteredData.forEach((item) => {
          try {
            const [lon, lat] = item.coordinates
              .trim()
              .split(/[, -]+/)
              .map((coord) => parseFloat(coord));

            if (isNaN(lat) || isNaN(lon)) {
              console.warn("Invalid coordinates for item:", item);
              return;
            }

            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);

            const point = new Point({
              longitude: lon,
              latitude: lat,
            });

            const marker = region
              ? highlightedMarkerSymbol
              : defaultMarkerSymbol;

            const graphic = new Graphic({
              geometry: point,
              symbol: marker,
              attributes: {
                id: item.id,
                location: item.location,
                region: item.region,
                users: item.users,
                status: item.status,
                lastUpdated: item.lastUpdated,
              },
            });

            graphics.push(graphic);
          } catch (error) {
            console.error(
              "Error parsing coordinates:",
              item.coordinates,
              error
            );
          }
        });

        if (graphics.length > 0 && viewRef.current) {
          if (markersLayerRef.current) {
            markersLayerRef.current.removeAll();
            markersLayerRef.current.addMany(graphics);
          } else {
            markersLayer.addMany(graphics);
            viewRef.current.map.add(markersLayer);
            markersLayerRef.current = markersLayer;
          }

          const centerLat = (minLat + maxLat) / 2;
          const centerLon = (minLon + maxLon) / 2;
          const latDiff = maxLat - minLat;
          const lonDiff = maxLon - minLon;
          const maxDiff = Math.max(latDiff, lonDiff);
          let zoomLevel = 10;
          if (maxDiff > 0.5) zoomLevel = 8;
          else if (maxDiff > 0.1) zoomLevel = 9;
          else if (maxDiff > 0.01) zoomLevel = 11;

          debouncedGoTo(viewRef.current, {
            center: [centerLon, centerLat],
            zoom: zoomLevel,
          });

          setHasZoomed(true);
        }
      },
    }));

    const checkLayerUrl = async (url: string): Promise<boolean> => {
      if (!isMounted.current) return false;
      try {
        console.log("Checking layer URL:", url); // Add logging
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${url}?f=json`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Layer URL is valid");
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("URL check aborted:", err.message);
        } else {
          console.error("Error checking layer URL:", err);
        }
        return false;
      }
    };

    const loadSavedParcels = useCallback(() => {
      const savedParcels = useParcelStore.getState().parcels;
      savedParcels.forEach((parcel) => {
        try {
          const graphic = Graphic.fromJSON({
            geometry: parcel.geometry,
            attributes: parcel.attributes,
          });
          sketchLayerRef.current?.add(graphic);
        } catch (error) {
          console.error("Failed to load graphic:", error);
        }
      });
    }, []);

    const deleteSelectedGraphic = useCallback(() => {
      setDeleteDialogOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
      if (selectedGraphic && sketchLayerRef.current) {
        sketchLayerRef.current.remove(selectedGraphic);
        useParcelStore.getState().removeParcel(selectedGraphic.attributes.id);
        setSelectedGraphic(null);
        setDeleteDialogOpen(false);
        setOpenSnackbar(true);
      }
    }, [selectedGraphic]);

    const cancelDelete = useCallback(() => {
      setDeleteDialogOpen(false);
    }, []);

    useEffect(() => {
      isMounted.current = true;

      const initializeMap = async () => {
        console.log("Starting map initialization"); // Add logging
        const isUrlValid = await checkLayerUrl(featureLayerUrl);
        if (!isMounted.current) {
          console.log("Component unmounted, aborting map initialization");
          return;
        }

        if (!isUrlValid) {
          setError("فشل تحميل الخريطة: رابط الطبقة غير صالح أو غير متاح");
          setIsLoading(false);
          console.error("Invalid layer URL, map initialization failed");
          return;
        }

        if (!webMapRef.current) {
          console.log("Creating new WebMap and MapView"); // Add logging
          webMapRef.current = new WebMap({ basemap: "streets-vector" });
          viewRef.current = new MapView({
            container: mapDiv.current as HTMLDivElement,
            map: webMapRef.current,
            center: [54.37, 24.47],
            zoom: 10,
            ui: { components: ["zoom", "attribution"] },
            constraints: { snapToZoom: false },
          });

          onMapViewReady?.(viewRef.current);

          console.log("Adding parcel layer"); // Add logging
          const parcelLayer = new FeatureLayer({ url: featureLayerUrl });
          webMapRef.current.add(parcelLayer);
          layerRef.current = parcelLayer;

          console.log("Adding population layer"); // Add logging
          const populationLayer = new FeatureLayer({
            url: featureLayerUrl,
            outFields: ["*"],
          });
          webMapRef.current.add(populationLayer);
          populationLayerRef.current = populationLayer;

          console.log("Adding sketch layer"); // Add logging
          const sketchLayer = new GraphicsLayer({ id: "sketch-layer" });
          webMapRef.current.add(sketchLayer);
          sketchLayerRef.current = sketchLayer;

          parcelLayer.visible = layerVisibility.parcels;
          populationLayer.visible = layerVisibility.population;

          console.log("Initializing SketchViewModel"); // Add logging
          const sketchVM = new SketchViewModel({
            view: viewRef.current,
            layer: sketchLayer,
            defaultCreateOptions: { mode: "click" },
            defaultUpdateOptions: {
              tool: "reshape",
              enableRotation: true,
              enableScaling: true,
            },
            polygonSymbol: {
              type: "simple-fill",
              color: [227, 139, 79, 0.8],
              outline: {
                color: [255, 255, 255],
                width: 1,
              },
            },
          });

          const handleCreate = (event: any) => {
            if (event.state === "complete") {
              const newGraphic = event.graphic;
              newGraphic.attributes = {
                id: Date.now(),
                status: "Active",
                lastUpdated: new Date().toISOString(),
              };

              useParcelStore.getState().addParcel({
                id: newGraphic.attributes.id,
                geometry: newGraphic.geometry.toJSON(),
                attributes: newGraphic.attributes,
              });
              setSelectedGraphic(newGraphic);
              setOpenSnackbar(true);
            }
          };

          sketchVM.on("create", handleCreate);
          setSketchVM(sketchVM);

          loadSavedParcels();

          console.log("Setting up click handler"); // Add logging
          viewRef.current.on("click", async (event) => {
            if (!viewRef.current || !isMounted.current) return;

            const hitTestResult = await viewRef.current.hitTest(event);
            const sketchGraphic = hitTestResult.results.find(
              (result): result is __esri.MapViewGraphicHit =>
                'graphic' in result && result.graphic.layer === sketchLayerRef.current
            )?.graphic;

            if (sketchGraphic) {
              setSelectedGraphic(sketchGraphic);
              sketchVM.update(sketchGraphic, { tool: "reshape" });
              return;
            } else {
              setSelectedGraphic(null);
            }

            const parcelLayer = layerRef.current;
            if (!parcelLayer) return;
            const query = parcelLayer.createQuery();
            query.geometry = event.mapPoint;
            query.distance = 5;
            query.units = "meters";
            query.spatialRelationship = "intersects";
            query.returnGeometry = true;
            query.outFields = ["*"];
            try {
              const { features } = await parcelLayer.queryFeatures(query);
              if (features.length > 0 && viewRef.current && isMounted.current) {
                const feature = features[0];
                debouncedGoTo(viewRef.current, {
                  target: feature.geometry,
                  scale: 150000,
                });
              }
            } catch (err) {
              console.error("Error querying features:", err);
            }
          });

          console.log("Waiting for map and layers to load"); // Add logging
          try {
            await Promise.all([
              viewRef.current.when(),
              parcelLayer.when(),
              populationLayer.when(),
            ]);
            if (isMounted.current) {
              setIsMapReady(true);
              setIsLoading(false);
              console.log("Map and layers are ready");
            }
          } catch (error: any) {
            if (error.name === "AbortError") {
              console.warn("Map loading aborted");
            } else {
              console.error("Error initializing map or layers:", error);
              setError("فشل تحميل الخريطة: حاول مرة أخرى");
            }
            if (isMounted.current) {
              setIsMapReady(true);
              setIsLoading(false);
            }
          }

          return () => {
            console.log("Cleaning up SketchViewModel"); // Add logging
            sketchVM.destroy();
          };
        }
      };

      initializeMap();

      return () => {
        isMounted.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        if (viewRef.current) {
          console.log("Destroying MapView"); // Add logging
          viewRef.current.destroy();
          viewRef.current = null;
          webMapRef.current = null;
        }
        if (highlightRef.current) highlightRef.current.remove();
      };
    }, [loadSavedParcels]);

    useEffect(() => {
      if (
        !viewRef.current ||
        !viewRef.current.map ||
        !isMapReady ||
        !memoizedData ||
        memoizedData.length === 0 ||
        !isMounted.current
      )
        return;

      const view = viewRef.current;
      const filteredData = filter
        ? memoizedData.filter((item) => item.region === filter)
        : memoizedData;

      if (
        JSON.stringify(filteredData) ===
        JSON.stringify(lastFilteredData.current)
      )
        return;

      lastFilteredData.current = filteredData;

      if (filteredData.length === 0) {
        debouncedGoTo(view, { center: [54.37, 24.47], zoom: 10 });
        return;
      }

      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLon = Infinity;
      let maxLon = -Infinity;
      const graphics: Graphic[] = [];

      filteredData.forEach((item) => {
        try {
          const [lon, lat] = item.coordinates
            .trim()
            .split(/[, -]+/)
            .map((coord) => parseFloat(coord));
          if (isNaN(lat) || isNaN(lon)) {
            console.warn("Invalid coordinates for item:", item);
            return;
          }
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);

          const point = new Point({ longitude: lon, latitude: lat });
          const marker = filter ? highlightedMarkerSymbol : defaultMarkerSymbol;
          const graphic = new Graphic({
            geometry: point,
            symbol: marker,
            attributes: {
              id: item.id,
              location: item.location,
              region: item.region,
              users: item.users,
              status: item.status,
              lastUpdated: item.lastUpdated,
            },
          });
          graphics.push(graphic);
        } catch (error) {
          console.error("Error parsing coordinates:", item.coordinates, error);
        }
      });

      if (graphics.length > 0 && markersLayerRef.current) {
        markersLayerRef.current.removeAll();
        markersLayerRef.current.addMany(graphics);
        markersLayerRef.current.visible = layerVisibility.markers;

        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        let zoomLevel = 10;
        if (maxDiff > 0.5) zoomLevel = 8;
        else if (maxDiff > 0.1) zoomLevel = 9;
        else if (maxDiff > 0.01) zoomLevel = 11;

        debouncedGoTo(view, {
          center: [centerLon, centerLat],
          zoom: zoomLevel,
        });
        setHasZoomed(true);
      }
    }, [
      filter,
      memoizedData,
      isMapReady,
      stableT,
      debouncedGoTo,
      hasZoomed,
      defaultMarkerSymbol,
      highlightedMarkerSymbol,
    ]);

    useEffect(() => {
      if (!viewRef.current || !layerRef.current || !isMounted.current) return;
      if (selectedId === null) {
        if (viewRef.current) viewRef.current.graphics.removeAll();
        return;
      }
      const query = new Query({
        where: `OBJECTID = ${selectedId}`,
        returnGeometry: true,
        outFields: ["*"],
      });
      layerRef.current
        .queryFeatures(query)
        .then((result) => {
          if (
            result.features.length > 0 &&
            isMounted.current &&
            viewRef.current
          ) {
            const feature = result.features[0];
            debouncedGoTo(viewRef.current, {
              target: feature.geometry,
              scale: 150000,
            });
          }
        })
        .catch((err) => console.error("Error querying selected feature:", err));
    }, [selectedId, debouncedGoTo]);

    useEffect(() => {
      const parcelLayer = layerRef.current;
      const populationLayer = populationLayerRef.current;
      const markersLayer = markersLayerRef.current;
      if (parcelLayer) parcelLayer.visible = layerVisibility.parcels;
      if (populationLayer) populationLayer.visible = layerVisibility.population;
      if (markersLayer) markersLayer.visible = layerVisibility.markers;
    }, [layerVisibility]);

    const handleToggleFullscreen = () => {
      const view = viewRef.current;
      if (view && view.container) {
        if (!document.fullscreenElement) view.container.requestFullscreen();
        else document.exitFullscreen();
      }
    };

    const handleLayersClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const toggleLayerVisibility = (layerName: string) => {
      setLayerVisibility((prev) => ({
        ...prev,
        [layerName as keyof typeof layerVisibility]:
          !prev[layerName as keyof typeof layerVisibility],
      }));
    };

    return (
      <Box sx={responsiveStyles.container}>
        <Box sx={responsiveStyles.mapHeader}>
          <Typography sx={responsiveStyles.mapTitle}>
            {i18n.language === "en" ? "Interactive Map" : "خريطة الأراضي"}
          </Typography>
          <Box sx={responsiveStyles.buttonContainer}>
            <Button
              sx={responsiveStyles.button as SxProps<Theme>}
              onClick={handleLayersClick}
              startIcon={<span style={{ fontSize: "1rem" }}>⋮⋮</span>}
            >
              {i18n.language === "en" ? "Layers" : "الطبقات"}
            </Button>
            <Button
              sx={responsiveStyles.button as SxProps<Theme>}
              onClick={handleToggleFullscreen}
              startIcon={<span style={{ fontSize: "1rem" }}>⟐</span>}
            >
              {i18n.language === "en" ? "Fullscreen" : "ملء الشاشة"}
            </Button>
            <Button
              sx={[responsiveStyles.button, responsiveStyles.drawDeleteButton] as SxProps<Theme>}
              onClick={() => sketchVM?.create("polygon")}
              startIcon={<span style={{ fontSize: "1rem" }}>✏️</span>}
            >
              {i18n.language === "en" ? "Draw Parcel" : "رسم مخطط"}
            </Button>
            <Button
              sx={[responsiveStyles.button, responsiveStyles.drawDeleteButton] as SxProps<Theme>}
              onClick={deleteSelectedGraphic}
              disabled={!selectedGraphic}
              startIcon={<span style={{ fontSize: "1rem" }}>🗑️</span>}
            >
              {i18n.language === "en" ? "Delete Drawing" : "حذف الرسمة"}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleLayersClick}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              MenuListProps={{ onMouseLeave: handleLayersClick }}
            >
              <MenuItem onClick={() => toggleLayerVisibility("parcels")}>
                {`Parcels Layer ${layerVisibility.parcels ? "👁️" : "👁️‍🗨️"}`}
              </MenuItem>
              <MenuItem onClick={() => toggleLayerVisibility("population")}>
                {`Population Layer ${layerVisibility.population ? "👁️" : "👁️‍🗨️"}`}
              </MenuItem>
              <MenuItem onClick={() => toggleLayerVisibility("markers")}>
                {`Markers Layer ${layerVisibility.markers ? "👁️" : "👁️‍🗨️"}`}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        <Box sx={responsiveStyles.mapDiv} ref={mapDiv}>
          <Backdrop
            open={isLoading}
            sx={responsiveStyles.backdrop}
          >
            <CircularProgress color="inherit" size={40} thickness={4} />
            <Typography
              variant="h6"
              sx={responsiveStyles.backdropTypography}
            >
              {error ||
                (i18n.language === "en"
                  ? "Loading Map..."
                  : "جارٍ تحميل الخريطة...")}
            </Typography>
          </Backdrop>
        </Box>
        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDelete}
          maxWidth="sm"
          fullWidth
          sx={responsiveStyles.dialog}
        >
          <DialogTitle sx={responsiveStyles.dialogTitle}>
            {t("confirmDelete") || "تأكيد الحذف"}
          </DialogTitle>
          <DialogContent sx={responsiveStyles.dialogContent}>
            <DialogContentText
              sx={responsiveStyles.dialogContentText}
            >
              {t("areYouSure") || "هل أنت متأكد من حذف الرسمة؟"}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={responsiveStyles.dialogActions}>
            <Button onClick={cancelDelete} variant="outlined" color="primary">
              {t("cancel") || "إلغاء"}
            </Button>
            <Button onClick={confirmDelete} variant="contained" color="error">
              {t("delete") || "حذف"}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
               open={openSnackbar}
               autoHideDuration={3000}
               onClose={() => setOpenSnackbar(false)}
               anchorOrigin={{ vertical: "top", horizontal: "center" }}
               sx={{
                 width: { xs: "80%", sm: "auto" },
                 maxWidth: { xs: "350px", sm: "600px" },
                 margin: "auto",
                 display: "flex",
                 justifyContent: "center",
                 alignItems: "center",
                 "& .MuiSnackbarContent-root": {
                   fontSize: { xs: "0.75rem", sm: "0.875rem" },
                   padding: { xs: "8px 16px", sm: "12px 24px" },
                 },
               }}
             >
               <Alert
                 onClose={() => setOpenSnackbar(false)}
                 severity="success"
                 sx={{
                   width: "90%",
                   fontSize: { xs: "0.75rem", sm: "0.875rem" },
                   display: "flex",
                   justifyContent: "center",
                   textAlign: "center",
                 }}
               >
                 {t("operationSuccess")}
               </Alert>
             </Snackbar>
      </Box>
    );
  }
);

export default ParcelMap;