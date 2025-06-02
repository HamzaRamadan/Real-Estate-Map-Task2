import { useRef, useState, useEffect } from "react";
import ParcelMap from "./ParcelMap";
import ParcelTable from "./ParcelTable";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { exportToPDF } from "../utils/exportToPDF";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

// مكون شاشة التحميل مع أنيميشن دوران وتوهج
const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      bgcolor: "rgba(0, 0, 0, 0.85)", // خلفية داكنة شبه شفافة
      zIndex: 9999,
      color: "white",
      animation: "fadeIn 0.5s ease-in-out",
      "@keyframes fadeIn": {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "rotate 1.5s linear infinite, glow 2s ease-in-out infinite",
        "@keyframes rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "@keyframes glow": {
          "0%": { boxShadow: "0 0 10px 5px rgba(0, 123, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px 10px rgba(0, 123, 255, 0.7)" },
          "100%": { boxShadow: "0 0 10px 5px rgba(0, 123, 255, 0.3)" },
        },
      }}
    >
      <CircularProgress
        size={90}
        thickness={4.5}
        sx={{ color: "#007bff" }}
      />
    </Box>
    <Typography
      variant="h5"
      sx={{
        mt: 2,
        fontWeight: "bold",
        textAlign: "center",
        fontSize: { xs: "1.2rem", sm: "1.5rem" },
        letterSpacing: 1.2,
        textShadow: "0 0 5px rgba(255, 255, 255, 0.5)",
      }}
    >
      {message}
    </Typography>
  </Box>
);

export default function ParcelContainer() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // حالة تحميل الموقع
  const { t, i18n } = useTranslation();
  const mapViewRef = useRef<any>(null);

  // إيقاف شاشة التحميل بعد وقت معين
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 ثوانٍ (يمكن تعديل الوقت حسب الحاجة)

    return () => clearTimeout(timer); // تنظيف المؤقت
  }, []);

  const handleSelect = (ids: number[] | null) => {
    console.log("Selected IDs:", ids);
    if (Array.isArray(ids) && ids.length > 0) {
      setSelectedId(ids[0]);
    } else {
      setSelectedId(null);
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
  };

  const columns = [
    { field: "objectid", title: i18n.language === "ar" ? "المعرف" : "ID" },
    { field: "st_district_ar", title: i18n.language === "ar" ? "الحي (عربي)" : "District (AR)" },
    { field: "region", title: i18n.language === "ar" ? "المنطقة" : "Region" },
    { field: "citizen_total", title: i18n.language === "ar" ? "إجمالي السكان" : "Total Population" },
    { field: "citizen_males", title: i18n.language === "ar" ? "الذكور (مواطنين)" : "Citizen Males" },
    { field: "citizen_females", title: i18n.language === "ar" ? "الإناث (مواطنات)" : "Citizen Females" },
  ];

  const handleExportExcel = () => {
    if (parcels.length === 0) {
      alert(t("noDataToExport") || "لا يوجد بيانات للتصدير!");
      return;
    }

    const data = parcels.map((parcel) =>
      columns.reduce((row: any, col) => {
        row[col.title] = parcel[col.field] ?? "غير متاح";
        return row;
      }, {})
    );

    const worksheet = XLSX.utils.json_to_sheet(data);

    if (i18n.language === "ar") {
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].t = "s";
            worksheet[cellAddress].z = "@";
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, i18n.language === "ar" ? "بيانات القطع" : "Parcels");

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
    link.download = i18n.language === "ar" ? "بيانات_القطع.xlsx" : "parcels.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    console.log("Exporting PDF with parcels:", parcels);
    if (parcels.length === 0) {
      alert(t("noDataToExport") || "لا يوجد بيانات للتصدير!");
      return;
    }
    exportToPDF(parcels, i18n.language === "ar" ? "بيانات القطع" : "Parcel Data", columns);
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

  const responsiveStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      bgcolor: "background.default",
      position: "relative",
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
      mb: { xs: 1, sm: 2 },
      zIndex: 1000,
    },
    content: {
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      flex: 1,
      gap: { xs: 2, sm: 2.5 },
      width: "100%",
      maxWidth: "100vw",
    },
    mapContainer: {
      flex: { xs: "none", sm: 1 },
      display: "flex",
      flexDirection: "column",
      gap: { xs: 2, sm: 2 },
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
      mt: { xs: 2, sm: 0 },
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
      {isLoading && <LoadingScreen message={t("loading") || "جاري التحميل..."} />}
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
            onSelectFromMap={(id) => setSelectedId(id)}
            onMapViewReady={(view) => {
              mapViewRef.current = view;
            }}
          />
        </Box>

        <Box sx={responsiveStyles.tableContainer}>
          <Box sx={{ flex: 1, maxHeight: { sm: "calc(100vh - 80px)" }, overflowY: "auto" }}>
            <ParcelTable
              selectedIds={selectedId ? [selectedId] : null}
              onSelectParcel={handleSelect}
              onExportDataRequest={setParcels}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}