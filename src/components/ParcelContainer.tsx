import { useRef, useState, useEffect } from "react";
// @ts-ignore - سيتم استخدامها لاحقاً
import ParcelMap from "./ParcelMap";
// @ts-ignore - سيتم استخدامها لاحقاً
import ParcelTable from "./ParcelTable";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
// @ts-ignore - سيتم استخدامها لاحقاً
import { exportToPDF } from "../utils/exportToPDF";
import { Box, CircularProgress, Typography } from "@mui/material";
import Dashboard from "../pages/Dashboard";

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
      bgcolor: "rgba(0, 0, 0, 0.85)", 
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
  // @ts-ignore - سيتم استخدامها لاحقاً
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // @ts-ignore - سيتم استخدامها لاحقاً
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const { t, i18n } = useTranslation();
  // @ts-ignore - سيتم استخدامها لاحقاً
  const mapViewRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 

    return () => clearTimeout(timer); 
  }, []);

  // @ts-ignore - سيتم استخدامها لاحقاً
  const handleSelect = (ids: number[] | null) => {
    console.log("Selected IDs:", ids);
    if (Array.isArray(ids) && ids.length > 0) {
      setSelectedId(ids[0]);
    } else {
      setSelectedId(null);
    }
  };

  // @ts-ignore - سيتم استخدامها لاحقاً
  const clearSelection = () => {
    setSelectedId(null);
  };

  // @ts-ignore - سيتم استخدامها لاحقاً
  const columns = [
    { field: "objectid", title: i18n.language === "ar" ? "المعرف" : "ID" },
    { field: "st_district_ar", title: i18n.language === "ar" ? "الحي (عربي)" : "District (AR)" },
    { field: "region", title: i18n.language === "ar" ? "المنطقة" : "Region" },
    { field: "citizen_total", title: i18n.language === "ar" ? "إجمالي السكان" : "Total Population" },
    { field: "citizen_males", title: i18n.language === "ar" ? "الذكور (مواطنين)" : "Citizen Males" },
    { field: "citizen_females", title: i18n.language === "ar" ? "الإناث (مواطنات)" : "Citizen Females" },
  ];

  // @ts-ignore - سيتم استخدامها لاحقاً
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

  // @ts-ignore - سيتم استخدامها لاحقاً
  const handleExportPDF = () => {
    console.log("Exporting PDF with parcels:", parcels);
    if (parcels.length === 0) {
      alert(t("noDataToExport") || "لا يوجد بيانات للتصدير!");
      return;
    }
    exportToPDF(parcels, i18n.language === "ar" ? "بيانات القطع" : "Parcel Data", columns);
  };

  // @ts-ignore - سيتم استخدامها لاحقاً
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

  // @ts-ignore - سيتم استخدامها لاحقاً
  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // @ts-ignore - سيتم استخدامها لاحقاً
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
      <Dashboard/>
    </Box>
  );
}