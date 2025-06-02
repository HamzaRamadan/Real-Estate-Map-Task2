import { useEffect, useRef, useState } from "react";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Query from "@arcgis/core/rest/support/Query";
import Search from "@arcgis/core/widgets/Search";
import { useTranslation } from "react-i18next";
import { exportToPDF } from "../pages/exportToPDF";
import { exportToExcel } from "../pages/exportToExcel";
import {
  saveGraphicsToLocalStorage,
  loadGraphicsFromLocalStorage,
} from "../pages/localStorageManager";
import { initializeSketchVM } from "../pages/SketchViewModel";
import SearchDrawingsPanel from "../pages/SearchDrawingsPanel";
import { useSnackbar } from "notistack";
import { notify } from "../pages/notifier";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
} from "@mui/material";
import { Backdrop, CircularProgress } from "@mui/material";

const featureLayerUrl =
  "https://infomapapp.com/ksaarcgis/rest/services/Hosted/AbuDhabi_Boundary/FeatureServer/2";

export default function ParcelMap({
  selectedId,
  onSelectFromMap,
  onMapViewReady,
}: {
  selectedId: number | null;
  onSelectFromMap: (id: number) => void;
  onMapViewReady?: (view: MapView) => void;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const layerRef = useRef<FeatureLayer | null>(null);
  const populationLayerRef = useRef<FeatureLayer | null>(null);
  const sketchLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchVMRef = useRef<any>(null);
  const highlightRef = useRef<any>(null);
  const { t, i18n } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [graphics, setGraphics] = useState<Graphic[]>([]);
  const [selectedGraphics, setSelectedGraphics] = useState<Graphic[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newGraphic, setNewGraphic] = useState<Graphic | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const webMap = new WebMap({ basemap: "streets-vector" });

    const view = new MapView({
      container: mapDiv.current as HTMLDivElement,
      map: webMap,
      center: [54.37, 24.47], 
      zoom: 10,
      ui: { components: ["zoom", "compass", "attribution"] },
      constraints: { snapToZoom: false },
    });

    onMapViewReady?.(view);

    // إضافة طبقة الأراضي
    const parcelLayer = new FeatureLayer({ url: featureLayerUrl });
    webMap.add(parcelLayer);
    layerRef.current = parcelLayer;

    // إضافة طبقة السكان
    const populationLayer = new FeatureLayer({
      url: featureLayerUrl,
      outFields: ["District", "Region", "Total Pop", "Citizen M", "Citizen Fe"],
      popupTemplate: {
        title: "{District} - {Region}",
        content: (feature: any) => {
          const attributes = feature.graphic.attributes;
          // console.log("Feature Attributes:", attributes); 
          if (
            !attributes.District &&
            !attributes.Region &&
            !attributes["Total Pop"] &&
            !attributes["Citizen M"] &&
            !attributes["Citizen Fe"]
          ) {
            return `
              <div style="font-family: Arial, sans-serif; padding: 15px; background-color: #fff3f3; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                <p style="color: #dc3545; font-size: 16px; margin: 0; font-weight: bold;">
                  ⚠️ لا توجد بيانات متاحة لهذه المنطقة
                </p>
              </div>
            `;
          }
          return `
            <div style="font-family: Arial, sans-serif; padding: 15px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h3 style="color: #2c3e50; font-size: 18px; margin: 0 0 10px 0; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                ${attributes.District || "غير متاح"} - ${
            attributes.Region || "غير متاح"
          }
              </h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="font-size: 15px; color: #34495e; margin-bottom: 10px;">
                  <span style="color: #007bff; font-weight: bold;">👨 الذكور:</span> ${
                    attributes["Citizen M"] || "غير متاح"
                  }
                </li>
                <li style="font-size: 15px; color: #34495e; margin-bottom: 10px;">
                  <span style="color: #e83e8c; font-weight: bold;">👩 الإناث:</span> ${
                    attributes["Citizen Fe"] || "غير متاح"
                  }
                </li>
                <li style="font-size: 15px; color: #34495e;">
                  <span style="color: #28a745; font-weight: bold;">📊 الإجمالي:</span> ${
                    attributes["Total Pop"] || "غير متاح"
                  }
                </li>
              </ul>
            </div>
          `;
        },
      },
    });
    webMap.add(populationLayer);
    populationLayerRef.current = populationLayer;

    //  طبقة الرسم
    const sketchLayer = new GraphicsLayer();
    webMap.add(sketchLayer);
    sketchLayerRef.current = sketchLayer;

    viewRef.current = view;

    // الجزئيه بتاعه البحث اللى ف الخريطه 
    const searchWidget = new Search({
      view,
      sources: [
        {
          layer: populationLayer,
          searchFields: ["District"],
          displayField: "District",
          exactMatch: false,
          outFields: [
            "District",
            "Region",
            "Total Pop",
            "Citizen M",
            "Citizen Fe",
          ],
          name: i18n.language === "ar" ? "البحث عن الحي" : "Search District",
          placeholder: i18n.language === "ar" ? "ابحث عن حي..." : "Search for a district...",
        },
      ],
    });
    view.ui.add(searchWidget, "top-right");

    // التعامل مع اختيار نتيجة البحث
    searchWidget.on("select-result", (event) => {
      if (!event.result || !event.result.feature) return;

      const feature = event.result.feature as Graphic;
      if (!feature.geometry) return;

      const geometry = feature.geometry as __esri.Polygon; 
      if (!geometry.extent) return;

      // لما تختار عنصر يعمل عليه ZOOM 
      view.goTo(geometry.extent.expand(2));

      // highligh للعنصر اللى اختارناه 
      if (highlightRef.current) {
        highlightRef.current.remove();
      }
      const populationLayer = populationLayerRef.current;
      if (!populationLayer) return;

      populationLayer
        .queryObjectIds({
          where: `District = '${feature.attributes.District}'`,
        })
        .then((ids) => {
          if (ids.length > 0) {
            view.whenLayerView(populationLayer).then((layerView) => {
              if ("highlight" in layerView) {
                const highlight = (layerView as __esri.FeatureLayerView).highlight(ids);
                highlightRef.current = highlight;
              }
            });
          }
        });
    });

    view.when(() => {
      setIsLoading(false);
    });

    const sketchVM = initializeSketchVM({
      view,
      sketchLayer,
      t,
      setGraphics,
      setSelectedGraphics,
      onCreateGraphic: (graphic: Graphic) => {
        setNewGraphic(graphic);
        setName("");
        setDescription("");
        setDialogOpen(true);
      },
    });
    sketchVMRef.current = sketchVM;

    const savedGraphics = loadGraphicsFromLocalStorage();
    if (savedGraphics.length > 0) {
      sketchLayer.addMany(savedGraphics);
      setGraphics(savedGraphics);
    }

    const clickHandler = view.on("click", async (event) => {
      const screenPoint = {
        x: event.x,
        y: event.y,
      };
      const hit = await view.hitTest(screenPoint);
      const sketchLayer = sketchLayerRef.current;
      if (!sketchLayer) return;

      const userDrawingHit = hit.results.find(
        (result) => "graphic" in result && result.graphic.layer === sketchLayer
      );

      if (userDrawingHit && "graphic" in userDrawingHit) {
        const clickedGraphic = userDrawingHit.graphic;
        const clickedUID = clickedGraphic.attributes?.uid;

        const isSelected = selectedGraphics.some(
          (g) => g.attributes?.uid === clickedUID
        );

        let newSelected: Graphic[];
        if (isSelected) {
          newSelected = selectedGraphics.filter(
            (g) => g.attributes?.uid !== clickedUID
          );
          clickedGraphic.symbol = {
            type: "simple-fill",
            color: [227, 139, 79, 0.8],
            outline: { color: [255, 255, 255], width: 1 },
          };
        } else {
          newSelected = [...selectedGraphics, clickedGraphic];
          clickedGraphic.symbol = {
            type: "simple-fill",
            color: [255, 255, 0, 0.6],
            outline: { color: [255, 255, 255], width: 1 },
          };
        }

        setSelectedGraphics(newSelected);
        return;
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

      const { features } = await parcelLayer.queryFeatures(query);

      if (features.length > 0) {
        const feature = features[0];
        const objectId =
          feature.attributes.objectid || feature.attributes.OBJECTID;
        onSelectFromMap(objectId);

        const highlight = new Graphic({
          geometry: feature.geometry,
          symbol: {
            type: "simple-fill",
            color: [0, 120, 255, 0.3],
            outline: { color: [0, 120, 255], width: 3 },
          },
        });

        view.graphics.removeAll();
        view.graphics.add(highlight);
      }
    });

    return () => {
      clickHandler.remove();
      sketchVM.destroy();
      view.destroy();
      viewRef.current = null;
      if (highlightRef.current) {
        highlightRef.current.remove();
      }
    };
  }, [onMapViewReady, onSelectFromMap, t, i18n.language]);

  useEffect(() => {
    if (!viewRef.current || !layerRef.current) return;

    if (selectedId === null) {
      viewRef.current.graphics.removeAll();
      return;
    }

    const query = new Query({
      where: `objectid = ${selectedId}`,
      returnGeometry: true,
      outFields: ["*"],
    });

    layerRef.current.queryFeatures(query).then((result) => {
      if (result.features.length > 0) {
        const feature = result.features[0];
        viewRef.current?.goTo({ target: feature.geometry, scale: 90000 });

        const graphic = new Graphic({
          geometry: feature.geometry,
          symbol: {
            type: "simple-fill",
            color: [255, 0, 0, 0.3],
            outline: { color: [255, 0, 0], width: 3 },
          },
        });

        viewRef.current?.graphics.removeAll();
        viewRef.current?.graphics.add(graphic);
      }
    });
  }, [selectedId]);

  const handleSave = () => {
    if (!newGraphic) return;
    if (!name.trim() || !description.trim()) {
      notify(t("incompleteDrawingData") || "يجب إدخال اسم ووصف للرسم!", {
        variant: "warning",
      });
      return;
    }

    newGraphic.attributes = {
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toLocaleString(),
      uid: crypto.randomUUID(),
    };

    newGraphic.symbol = {
      type: "simple-fill",
      color: [227, 139, 79, 0.8],
      outline: { color: [255, 255, 255], width: 1 },
    };

    sketchLayerRef.current?.add(newGraphic);

    setGraphics((prev) => {
      const updated = [...prev, newGraphic];
      saveGraphicsToLocalStorage(updated);
      return updated;
    });

    setDialogOpen(false);
    notify(t("savedSuccessfully") || "تم الحفظ بنجاح", {
      variant: "success",
    });
  };

  const handleExportExcel = () => {
    exportToExcel({ graphics, t, enqueueSnackbar });
  };

  const handleExportPDF = () => {
    exportToPDF(graphics, t, viewRef, enqueueSnackbar);
  };

  // وسع وسع بقى اهم جزئيه دى بتاعه الريسبونسيف Reponsive
  const responsiveStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: { xs: 2, sm: 2.5 },
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      px: { xs: 0.5, sm: 1 },
    },
    mapDiv: {
      height: { xs: "35vh", sm: "calc(100vh - 120px)" },
      width: "100%",
      maxWidth: "100vw",
      position: "relative",
    },
    buttonContainer: {
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      flexWrap: "wrap",
      gap: { xs: 2, sm: 2.5 },
      justifyContent: { xs: "center", sm: "flex-start" },
      px: { xs: 0.5, sm: 1 },
      py: { xs: 2, sm: 2.5 },
      mb: { xs: 2.5, sm: 2 },
    },
    button: (bgColor: string) => ({
      backgroundColor: bgColor,
      color: "white",
      border: "none",
      borderRadius: 4,
      padding: { xs: "6px 8px", sm: "8px 12px" },
      margin: { xs: "4px 0", sm: "4px" },
      cursor: "pointer",
      fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
      width: { xs: "100%", sm: "auto" },
      minWidth: { xs: "100%", sm: "80px" },
    }),
    dialog: {
      "& .MuiDialog-paper": {
        p: { xs: 1, sm: 2 },
        maxWidth: { xs: "90vw", sm: "500px" },
      },
    },
    textField: {
      fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    },
  };

  return (
    <Box sx={responsiveStyles.container}>
      <Box sx={responsiveStyles.mapDiv} ref={mapDiv}>
        <Backdrop
          open={isLoading}
          sx={{
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 1,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>

      <SearchDrawingsPanel
        graphics={graphics}
        view={viewRef.current}
        onSelectGraphic={(graphic) => setSelectedGraphics([graphic])}
      />

      <Box sx={responsiveStyles.buttonContainer}>
        <Button
          sx={responsiveStyles.button("#4CAF50")}
          onClick={() => sketchVMRef.current?.create("polygon")}
        >
          {i18n.language === "en" ? "Draw Polygon" : "ارسم مضلع"}
        </Button>
        <Button
          sx={responsiveStyles.button("#2196F3")}
          onClick={() => sketchVMRef.current?.create("polyline")}
        >
          {i18n.language === "en" ? "Draw Polyline" : "ارسم خط"}
        </Button>
        <Button
          sx={responsiveStyles.button("#f44336")}
          onClick={() => {
            if (selectedGraphics.length === 0) {
              notify(
                i18n.language === "en"
                  ? "🚫 Please select drawings to delete"
                  : "🚫 اختر رسومات للحذف",
                { variant: "warning" }
              );
              return;
            }

            const sketchLayer = sketchLayerRef.current;
            if (!sketchLayer) return;

            selectedGraphics.forEach((g) => {
              sketchLayer.remove(g);
            });

            setGraphics((prevGraphics) => {
              const updated = prevGraphics.filter(
                (g) =>
                  !selectedGraphics.some(
                    (sel) => sel.attributes?.uid === g.attributes?.uid
                  )
              );
              saveGraphicsToLocalStorage(updated);
              return updated;
            });

            setSelectedGraphics([]);
            notify(
              i18n.language === "en"
                ? "✅ Selected drawings deleted successfully"
                : "✅ تم حذف الرسومات المحددة بنجاح",
              { variant: "success" }
            );
          }}
        >
          {i18n.language === "en" ? "Delete Selected" : "احذف المحدد"}
        </Button>
        <Button
          sx={responsiveStyles.button("#607d8b")}
          onClick={() => {
            const allGraphics =
              sketchLayerRef.current?.graphics.toArray() || [];
            if (allGraphics.length === 0) {
              notify(
                i18n.language === "en"
                  ? "🚫 No graphics to delete"
                  : "🚫 لا يوجد رسومات للحذف",
                { variant: "warning" }
              );
              return;
            }
            setConfirmOpen(true);
          }}
        >
          {i18n.language === "en" ? "Clear All" : "احذف الكل"}
        </Button>
        <Button
          sx={responsiveStyles.button("#FF9800")}
          onClick={handleExportExcel}
        >
          {t("exportExcel")}
        </Button>
        <Button
          sx={responsiveStyles.button("#673AB7")}
          onClick={handleExportPDF}
        >
          {t("exportPDF")}
        </Button>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={responsiveStyles.dialog}
      >
        <DialogTitle>{t("enterDrawingData")}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("name")}
            fullWidth
            margin="dense"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            sx={responsiveStyles.textField}
          />
          <TextField
            label={t("description")}
            fullWidth
            margin="dense"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={responsiveStyles.textField}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={responsiveStyles.dialog}
      >
        <DialogTitle>{t("confirmDelete")}</DialogTitle>
        <DialogContent>
          {t("confirmDeleteMsg", { count: selectedGraphics.length })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              selectedGraphics.forEach((graphic) => {
                sketchLayerRef.current?.remove(graphic);
              });

              const updated = graphics.filter(
                (g) =>
                  !selectedGraphics.some(
                    (sg) => sg.attributes?.uid === g.attributes?.uid
                  )
              );

              setGraphics(updated);
              saveGraphicsToLocalStorage(updated);
              setSelectedGraphics([]);
              setConfirmOpen(false);
              sketchLayerRef.current?.removeAll();
              setGraphics([]);
              setSelectedGraphics([]);
              localStorage.removeItem("user_drawings");
              notify(
                i18n.language === "en"
                  ? "✅ Drawings deleted successfully"
                  : "✅ تم حذف الرسومات بنجاح",
                { variant: "success" }
              );
            }}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}