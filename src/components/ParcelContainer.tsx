import { useEffect, useRef, useState } from "react";
import ParcelMap from "./ParcelMap";
import ParcelTable from "./ParcelTable";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { exportToPDF } from "../utils/exportToPDF";
import { Box, Button } from "@mui/material";

export default function ParcelContainer() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const { t, i18n } = useTranslation();
  const mapViewRef = useRef<any>(null);

  const handleSelect = (id: number | null) => {
    console.log("Selected ID:", id);
    setSelectedId(id);
  };

  const clearSelection = () => {
    setSelectedId(null);
  };

  const handleExportExcel = () => {
    if (parcels.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(parcels);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcels");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parcels.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { field: "objectid", title: "المعرف" },
    { field: "st_dist_ara", title: "الحي (عربي)" },
    { field: "region", title: "المنطقة" },
  ];

  const handleExportPDF = () => {
    exportToPDF(parcels, "القطع", columns);
  };

  const handleExportMapImage = async () => {
    const view = mapViewRef.current;
    if (!view) {
      alert(t("mapNotLoaded") || "الخريطة لم تُحمّل بعد!");
      return;
    }

    try {
      const response = await view.takeScreenshot({ format: "png", quality: 1 });
      const link = document.createElement("a");
      link.href = response.dataUrl;
      link.download = "parcel_map.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting map image:", err);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    console.log("Current language:", i18n.language);
  }, [i18n.language]);

  const responsiveStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      bgcolor: "background.default",
    },
    header: {
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      flexWrap: "wrap",
      gap: { xs: 1, sm: 1.5 },
      justifyContent: { xs: "center", sm: "flex-start" },
      p: { xs: 1, sm: 2 },
      bgcolor: "grey.100",
      borderBottom: "1px solid",
      borderColor: "divider",
      mb: { xs: 1, sm: 2 }, // مسافة تحت الـ header
    },
    content: {
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      flex: 1,
      gap: { xs: 2, sm: 2.5 }, // زيادة المسافة بين الخريطة والجدول
      width: "100%",
      maxWidth: "100vw",
    },
    mapContainer: {
      flex: { xs: "none", sm: 1 },
      display: "flex",
      flexDirection: "column",
      gap: { xs: 2, sm: 2 }, // مسافة بين الخريطة وأزرارها
      height: { xs: "auto", sm: "100%" },
      width: { xs: "100%", sm: "50%" },
      maxWidth: "100vw",
      minWidth: { sm: "300px" },
    },
    tableContainer: {
      flex: { xs: "none", sm: 1 },
      display: "flex",
      flexDirection: "column",
      height: { xs: "auto", sm: "100%" },
      width: { xs: "100%", sm: "50%" },
      maxWidth: "100vw",
      maxHeight: { sm: "100vh" },
      p: { xs: 1, sm: 2 },
      boxSizing: "border-box",
      mt: { xs: 2, sm: 0 }, // مسافة فوق الجدول على الموبايل
    },
    button: (bg: string) => ({
      bgcolor: bg,
      color: "white",
      borderRadius: 1,
      p: { xs: "6px 12px", sm: "8px 16px" },
      fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
      minWidth: { xs: "100%", sm: "120px" },
      "&:hover": {
        bgcolor: `${bg}cc`,
      },
      textTransform: "none",
    }),
  };

  return (
    <Box sx={responsiveStyles.container}>
      <Box sx={responsiveStyles.header}>
        <Button
          sx={responsiveStyles.button("#6c757d")}
          onClick={toggleLanguage}
          startIcon={<span>🌐</span>}
        >
          {i18n.language === "ar" ? "English" : "العربية"}
        </Button>
        <Button
          sx={responsiveStyles.button("#007bff")}
          onClick={clearSelection}
          startIcon={<span>🧹</span>}
        >
          {i18n.language === "en" ? "Clear Selection" : "مسح التحديد"}
        </Button>
        <Button
          sx={responsiveStyles.button("#dc3545")}
          onClick={handleExportPDF}
          startIcon={<span>📄</span>}
        >
          {i18n.language === "en" ? "Export PDF" : "تصدير إلى PDF"}
        </Button>
        <Button
          sx={responsiveStyles.button("#28a745")}
          onClick={handleExportExcel}
          startIcon={<span>📊</span>}
        >
          {i18n.language === "en" ? "Export Excel" : "تصدير إلى Excel"}
        </Button>
        <Button
          sx={responsiveStyles.button("#17a2b8")}
          onClick={handleExportMapImage}
          startIcon={<span>📸</span>}
        >
          {i18n.language === "en" ? "Export Map Image" : "تصدير صورة الخريطة"}
        </Button>
      </Box>

      <Box sx={responsiveStyles.content}>
        <Box sx={responsiveStyles.mapContainer}>
          <ParcelMap
            selectedId={selectedId}
            onSelectFromMap={handleSelect}
            onMapViewReady={(view) => {
              mapViewRef.current = view;
            }}
          />
        </Box>

        <Box sx={responsiveStyles.tableContainer}>
          <Box sx={{ flex: 1, maxHeight: { sm: "calc(100vh - 80px)" }, overflowY: "auto" }}>
            <ParcelTable
              selectedId={selectedId}
              onSelectParcel={handleSelect}
              onExportDataRequest={setParcels}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}