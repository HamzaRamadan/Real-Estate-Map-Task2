import { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import { useTranslation } from "react-i18next";

// واجهة لبيانات السكان
interface PopulationData {
  id: number;
  district: string;
  region: string;
  totalPop: number;
  citizenM: number;
  citizenFe: number;
  OBJECTID?: number;
}

// بيانات وهمية مؤقتة للسكان
const fallbackPopulationData: PopulationData[] = [
  { id: 1, district: "Al Nahda", region: "Amman", totalPop: 10000, citizenM: 5000, citizenFe: 5000 },
  { id: 2, district: "Jabal Amman", region: "Amman", totalPop: 8000, citizenM: 4000, citizenFe: 4000 },
  { id: 3, district: "Sweileh", region: "Amman", totalPop: 12000, citizenM: 6000, citizenFe: 6000 },
  { id: 4, district: "Marka", region: "Amman", totalPop: 15000, citizenM: 7500, citizenFe: 7500 },
  { id: 5, district: "Tlaa Al Ali", region: "Amman", totalPop: 9000, citizenM: 4500, citizenFe: 4500 },
];

interface PopulationDataGridProps {
  view?: MapView | null;
  layer?: FeatureLayer | null;
}

const PopulationDataGrid: React.FC<PopulationDataGridProps> = ({ view, layer }) => {
  const { t } = useTranslation();
  const [tableData, setTableData] = useState<PopulationData[]>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const featureLayer = layer || new FeatureLayer({
    url: "" // ضع رابط ArcGIS FeatureServer هنا
  });

  const defaultColumns: GridColDef[] = [
    { field: "district", headerName: t("district") || "المنطقة", width: 150, sortable: true },
    { field: "region", headerName: t("region") || "الإقليم", width: 150, sortable: true },
    { field: "totalPop", headerName: t("totalPop") || "إجمالي السكان", width: 150, sortable: true },
    { field: "citizenM", headerName: t("citizenM") || "الذكور", width: 120, sortable: true, editable: true },
    { field: "citizenFe", headerName: t("citizenFe") || "الإناث", width: 120, sortable: true, editable: true },
  ];

  useEffect(() => {
    if (!featureLayer.url) {
      setColumns(defaultColumns);
      setTableData(fallbackPopulationData);
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    featureLayer.when(() => {
      const availableFields = featureLayer.fields.map((f) => f.name);
      const requiredFields = ["District", "Region", "TotalPop", "CitizenM", "CitizenFe"];

      if (!requiredFields.every((field) => availableFields.includes(field))) {
        setColumns(defaultColumns);
        setTableData(fallbackPopulationData);
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      const dynamicColumns = featureLayer.fields
        .filter((field) => requiredFields.includes(field.name))
        .map((field) => ({
          field: field.name.toLowerCase(),
          headerName: t(field.name) || field.name.replace(/_/g, " "),
          width: 150,
          sortable: true,
          editable: field.editable !== false,
        }));

      setColumns(dynamicColumns.length ? dynamicColumns : defaultColumns);
    }).catch(() => {
      setColumns(defaultColumns);
      setTableData(fallbackPopulationData);
      setIsLoading(false);
      setIsReady(true);
    });
  }, [featureLayer, t]);

  useEffect(() => {
    if (!view || !featureLayer || !featureLayer.url) {
      setTableData(fallbackPopulationData);
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    Promise.all([view.when(), featureLayer.when()]).then(() => {
      setIsReady(true);

      const query = featureLayer.createQuery();
      query.outFields = ["District", "Region", "TotalPop", "CitizenM", "CitizenFe", "OBJECTID"];
      query.returnGeometry = false;

      const fetchData = async () => {
        setIsLoading(true);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const result = await featureLayer.queryFeatures(query, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (result.features.length === 0) {
            setTableData(fallbackPopulationData);
          } else {
            const features = result.features.map((f, index) => ({
              id: index,
              district: f.attributes["District"] || "غير معروف",
              region: f.attributes["Region"] || "غير معروف",
              totalPop: f.attributes["TotalPop"] || 0,
              citizenM: f.attributes["CitizenM"] || 0,
              citizenFe: f.attributes["CitizenFe"] || 0,
              OBJECTID: f.attributes["OBJECTID"]
            }));
            setTableData(features);
          }
        } catch {
          setTableData(fallbackPopulationData);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }).catch(() => {
      setTableData(fallbackPopulationData);
      setIsLoading(false);
      setIsReady(true);
    });

    if (view && isReady) {
      const handleExtentChange = () => {
        if (!view.extent || !featureLayer) return;
        const query = featureLayer.createQuery();
        query.geometry = view.extent;
        query.outFields = ["District", "Region", "TotalPop", "CitizenM", "CitizenFe", "OBJECTID"];
        query.returnGeometry = false;

        featureLayer.queryFeatures(query).then((result) => {
          const features = result.features.map((f, index) => ({
            id: index,
            district: f.attributes["District"] || "غير معروف",
            region: f.attributes["Region"] || "غير معروف",
            totalPop: f.attributes["TotalPop"] || 0,
            citizenM: f.attributes["CitizenM"] || 0,
            citizenFe: f.attributes["CitizenFe"] || 0,
            OBJECTID: f.attributes["OBJECTID"]
          }));
          setTableData(features.length ? features : fallbackPopulationData);
        }).catch(() => {
          setTableData(fallbackPopulationData);
        });
      };

      const extentWatcher = view.watch("extent", handleExtentChange);
      return () => extentWatcher.remove();
    }
  }, [view, featureLayer, isReady, t]);

  const processRowUpdate = async (newRow: PopulationData, oldRow: PopulationData) => {
    try {
      const updatedRow = { ...newRow };
      setTableData((prev) =>
        prev.map((row) => (row.id === newRow.id ? updatedRow : row))
      );

      if (featureLayer.url && featureLayer.capabilities?.operations?.supportsUpdate) {
        const graphic = new Graphic({
          attributes: {
            ...updatedRow,
            OBJECTID: updatedRow.OBJECTID
          }
        });
        await featureLayer.applyEdits({ updateFeatures: [graphic] });
      }
      return updatedRow;
    } catch {
      return oldRow;
    }
  };

  return (
    <Box
      sx={{
        height: { xs: 300, sm: 400 },
        width: "100%",
        mt: 2,
        "& .MuiDataGrid-root": {
          border: "1px solid #ddd",
          fontSize: { xs: "0.75rem", sm: "0.85rem" },
        },
      }}
    >
      {tableData.length === 0 && !isLoading ? (
        <Typography variant="body1" color="textSecondary" sx={{ p: 2, textAlign: "center" }}>
          {t("noData") || "لا توجد بيانات متاحة"}
        </Typography>
      ) : (
        <DataGrid
          rows={tableData}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 20]}
          checkboxSelection
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          localeText={{
            noRowsLabel: t("noData") || "لا توجد بيانات متاحة",
            toolbarColumns: t("columns") || "الأعمدة",
            toolbarFilters: t("filters") || "الفلاتر",
            toolbarDensity: t("density") || "الكثافة",
            toolbarExport: t("export") || "تصدير",
          }}
        />
      )}
    </Box>
  );
};

export default PopulationDataGrid;
