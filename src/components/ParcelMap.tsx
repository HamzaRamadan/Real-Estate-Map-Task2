import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
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
} from "@mui/material";
import Expand from "@arcgis/core/widgets/Expand";
import LayerList from "@arcgis/core/widgets/LayerList";
import Sketch from "@arcgis/core/widgets/Sketch";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import debounce from "lodash/debounce";

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
    const layerListRef = useRef<LayerList | null>(null);
    const sketchRef = useRef<Sketch | null>(null);
    const expandRef = useRef<Expand | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { t, i18n } = useTranslation();
    const isMounted = useRef(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isMapReady, setIsMapReady] = useState(false);
    const [layerVisibility] = useState({
      parcels: true,
      population: true,
      markers: true,
    });
    const [hasZoomed, setHasZoomed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stableT = useCallback((key: string) => t(key), [t]);

    const debouncedGoTo = useCallback(
      debounce((view: MapView, options: any) => {
        if (isMounted.current && view) {
          view.when(() => {
            view.goTo(options).catch((err) => {
              console.error("Error in debounced goTo:", err);
            });
          }).catch((err) => {
            console.warn("View not ready yet:", err);
          });
        }
      }, 300),
      []
    );

    const memoizedData = useMemo(() => data, [data]);
    const lastFilteredData = useRef<PopulationData[]>([]);

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

        const markersLayer = markersLayerRef.current || new GraphicsLayer({ id: "markers-layer" });
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

            const marker = new SimpleMarkerSymbol({
              color: [226, 119, 40],
              outline: {
                color: [255, 255, 255],
                width: 1,
              },
            });

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

        // console.log("Calculated bounds:", { minLat, maxLat, minLon, maxLon });

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

          console.log("Zooming to:", {
            center: [centerLon, centerLat],
            zoom: zoomLevel,
          });

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
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${url}?f=json`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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

    useEffect(() => {
      isMounted.current = true;

      const initializeMap = async () => {
        const isUrlValid = await checkLayerUrl(featureLayerUrl);
        if (!isMounted.current) return;

        if (!isUrlValid) {
          setError("فشل تحميل الخريطة: رابط الطبقة غير صالح أو غير متاح");
          setIsLoading(false);
          return;
        }

        if (!webMapRef.current) {
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

          const parcelLayer = new FeatureLayer({ url: featureLayerUrl });
          webMapRef.current.add(parcelLayer);
          layerRef.current = parcelLayer;

          const populationLayer = new FeatureLayer({
            url: featureLayerUrl,
            outFields: ["*"],
          });
          webMapRef.current.add(populationLayer);
          populationLayerRef.current = populationLayer;

          const sketchLayer = new GraphicsLayer({ id: "sketch-layer" });
          webMapRef.current.add(sketchLayer);
          sketchLayerRef.current = sketchLayer;

          parcelLayer.visible = layerVisibility.parcels;
          populationLayer.visible = layerVisibility.population;

          const layerList = new LayerList({
            view: viewRef.current,
            listItemCreatedFunction: (event) => {
              const item = event.item;
              if (item.layer === parcelLayer) item.title = "Parcels Layer";
              else if (item.layer === populationLayer) item.title = "Population Layer";
              else if (item.layer === sketchLayerRef.current) item.title = "Sketch Layer";
              else if (item.layer === markersLayerRef.current) {
                item.title = "Markers Layer";
                item.actionsSections = [
                  [
                    {
                      title: "Toggle Visibility",
                      className: "esri-icon-visible",
                      id: "toggle-visibility",
                    },
                  ],
                ];
              }
              item.panel = {
                content: "legend",
                open: true,
              };
            },
          });

          layerList.on("trigger-action", (event) => {
            const id = event.action.id;
            if (id === "toggle-visibility" && markersLayerRef.current) {
              markersLayerRef.current.visible = !markersLayerRef.current.visible;
              viewRef.current?.map.reorder(markersLayerRef.current, viewRef.current.map.layers.length - 1);
            }
          });

          const expand = new Expand({
            content: layerList,
            view: viewRef.current,
            expandIcon: "layers",
            expanded: false,
            group: "top-right",
          });
          viewRef.current.ui.add(expand, "top-right");
          expandRef.current = expand;
          layerListRef.current = layerList;

          const sketch = new Sketch({
            view: viewRef.current,
            layer: sketchLayer,
            creationMode: "update",
            defaultUpdateOptions: { tool: "reshape" },
            visibleElements: {
              createTools: {
                point: false,
                polyline: false,
                polygon: false,
                rectangle: false,
                circle: true,
              },
            },
            container: "sketch-container",
          });
          sketchRef.current = sketch;

          viewRef.current.on("click", async (event) => {
            const parcelLayer = layerRef.current;
            if (!parcelLayer || !viewRef.current || !isMounted.current) return;

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
          viewRef.current.destroy();
          viewRef.current = null;
          webMapRef.current = null;
        }
        if (highlightRef.current) highlightRef.current.remove();
        if (layerListRef.current) layerListRef.current.destroy();
        if (sketchRef.current) sketchRef.current.destroy();
        if (expandRef.current) expandRef.current.destroy();
      };
    }, []);

    useEffect(() => {
      if (
        !viewRef.current ||
        !viewRef.current.map ||
        !isMapReady ||
        !memoizedData ||
        memoizedData.length === 0 ||
        !isMounted.current
      ) {
        return;
      }

      const view = viewRef.current;

      const filteredData = filter
        ? memoizedData.filter((item) => item.region === filter)
        : memoizedData;

      if (
        JSON.stringify(filteredData) === JSON.stringify(lastFilteredData.current)
      ) {
        return;
      }

      lastFilteredData.current = filteredData;

      if (filteredData.length === 0) {
        debouncedGoTo(view, {
          center: [54.37, 24.47],
          zoom: 10,
        });
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

          const point = new Point({
            longitude: lon,
            latitude: lat,
          });

          const marker = new SimpleMarkerSymbol({
            color: [226, 119, 40],
            outline: {
              color: [255, 255, 255],
              width: 1,
            },
          });

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

      console.log("Calculated bounds:", { minLat, maxLat, minLon, maxLon });

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

        console.log("Zooming to:", {
          center: [centerLon, centerLat],
          zoom: zoomLevel,
        });

        debouncedGoTo(view, {
          center: [centerLon, centerLat],
          zoom: zoomLevel,
        });

        setHasZoomed(true);
      }

      return () => {
        if (viewRef.current && viewRef.current.map) {
          if (markersLayerRef.current) {
            viewRef.current.map.remove(markersLayerRef.current);
          }
        }
      };
    }, [filter, memoizedData, isMapReady, stableT, debouncedGoTo, hasZoomed]);

    useEffect(() => {
      if (!viewRef.current || !layerRef.current || !isMounted.current) return;

      if (selectedId === null) {
        if (viewRef.current) {
          viewRef.current.graphics.removeAll();
        }
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
        .catch((err) => {
          console.error("Error querying selected feature:", err);
        });
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

    const responsiveStyles = {
      container: {
        backgroundColor: "#fdfdfd",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        maxWidth: "100vw",
        minWidth: 0,
        height: "100%",
        border: "1px solid #e0e0e0",
        borderRadius: 4,
        margin: 0,
        padding: 0,
      },
      mapHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        p: 1,
        borderBottom: "none",
      },
      mapTitle: {
        fontSize: { xs: "1rem", sm: "1.2rem" },
        fontWeight: "bold",
        color: "#2c3e50",
      },
      mapDiv: {
        height: { xs: "100%", sm: "100%" },
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        minHeight: "300px",
        mt: 0,
      },
      buttonContainer: {
        display: "flex",
        alignItems: "center",
        gap: 2,
      },
      button: {
        backgroundColor: "#f5f5f5",
        color: "#000",
        border: "1px solid #f5f5f5",
        borderRadius: 3,
        padding: "4px 12px",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: 600,
        textTransform: "none",
        display: "flex",
        alignItems: "center",
        "&:hover": {
          backgroundColor: "#bcc7ce",
          border: "1px solid #bcc7ce",
        },
      },
    };

    return (
      <Box sx={responsiveStyles.container}>
        <Box sx={responsiveStyles.mapHeader}>
          <Typography sx={responsiveStyles.mapTitle}>
            {i18n.language === "en" ? "Interactive Map" : "خريطة الأراضي"}
          </Typography>
          <Box sx={responsiveStyles.buttonContainer}>
            <Button
              sx={responsiveStyles.button}
              onClick={handleToggleFullscreen}
              startIcon={<span style={{ fontSize: "1rem" }}>⟐</span>}
            >
              {i18n.language === "en" ? "Fullscreen" : "ملء الشاشة"}
            </Button>
            <Button
              sx={responsiveStyles.button}
              onClick={() => expandRef.current?.expand()}
              startIcon={<span style={{ fontSize: "1rem" }}>⋮⋮</span>}
            >
              {i18n.language === "en" ? "Layers" : "الطبقات"}
            </Button>
          </Box>
        </Box>
        <Box sx={responsiveStyles.mapDiv} ref={mapDiv}>
          <div id="sketch-container" style={{ display: "none" }}></div>
          <Backdrop
            open={isLoading}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: (theme) => theme.zIndex.drawer + 1,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress color="inherit" size={40} thickness={4} />
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                mt: 2,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                textAlign: "center",
              }}
            >
              {error ||
                (i18n.language === "en"
                  ? "Loading Map..."
                  : "جارٍ تحميل الخريطة...")}
            </Typography>
          </Backdrop>
        </Box>
      </Box>
    );
  }
);

export default ParcelMap;