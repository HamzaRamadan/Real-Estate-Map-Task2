import React, { useState } from "react";
import Graphic from "@arcgis/core/Graphic";
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  type SnackbarCloseReason,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  graphics: Graphic[];
  view: __esri.MapView | null;
  onSelectGraphic: (graphic: Graphic) => void;
}
interface GraphicAttributes {
  uid: string;
  name?: string;
  [key: string]: any; // للسماح بخصائص ديناميكية إضافية
}
export default function SearchDrawingsPanel({
  graphics,
  view,
  onSelectGraphic,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Graphic[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<any | null>(
    null
  );
  const { t, i18n } = useTranslation();

  const [editing, setEditing] = useState(false);
const [editedValues, setEditedValues] = useState<GraphicAttributes>({ uid: "" });  // حالة مؤشر التحميل
  const [loading, setLoading] = useState(false);

  // حالة اختيار العنصر في التنقل بلوحة المفاتيح
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // ** حالة التحكم بظهور رسالة النجاح **
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSearch = () => {
    const lower = searchText.trim().toLowerCase();
    if (!lower) return;

    setLoading(true); // بدء التحميل

    setTimeout(() => {
      const matches = graphics.filter((g) =>
        g.attributes?.name?.toLowerCase().includes(lower)
      );

      setSearchResults(matches);
      setSearched(true);
      setHighlightedIndex(null); // إعادة تعيين مؤشر العنصر المحدد

      if (matches.length === 1) {
        handleSelect(matches[0]);
      }

      setLoading(false); // انتهاء التحميل
    }, 400); // محاكاة تأخير بسيط (تقدر تحذف الـ setTimeout لو البحث فعلي)
  };

  const handleSelect = (graphic: Graphic) => {
    if (!view || !graphic.geometry) return;

    view.goTo({ target: graphic.geometry, scale: 95000 });

    graphic.symbol = {
      type: "simple-fill",
      color: [255, 255, 0, 0.6],
      outline: { color: [255, 255, 255], width: 1 },
    };

    onSelectGraphic(graphic);
  };

  const handleZoomToAll = () => {
    if (!view || searchResults.length === 0) return;
    // إعادة تعيين مظهر كل الرسومات إلى الافتراضي
    graphics.forEach((g) => {
      g.symbol = null;
    });

    // تغيير مظهر الرسومات الناتجة من البحث
    searchResults.forEach((g) => {
      g.symbol = {
        type: "simple-fill",
        color: [0, 255, 0, 0.4], // أخضر شفاف
        outline: { color: "#006400", width: 1 }, // أخضر غامق
      };
    });

    const geometries = searchResults.map((g) => g.geometry).filter(Boolean);

    if (geometries.length > 0) {
      view.goTo(geometries);
    }
  };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    if (highlightedIndex !== null && searchResults[highlightedIndex]) {
      handleSelect(searchResults[highlightedIndex]);
    } else {
      handleSearch();
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setHighlightedIndex((prev: number | null) =>
      prev === null || prev === searchResults.length - 1 ? 0 : prev + 1
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setHighlightedIndex((prev: number | null) =>
      prev === null || prev === 0 ? searchResults.length - 1 : prev - 1
    );
  }
};

  // دالة إغلاق رسالة النجاح
const handleSuccessClose = (
  _event: React.SyntheticEvent | Event,
  reason: SnackbarCloseReason
) => {
  if (reason === "clickaway") return;
  setSuccessOpen(false);
};
// دالة إغلاق الـ Alert
const handleAlertClose = (_event: React.SyntheticEvent) => {
  setSuccessOpen(false);
};

  return (
    <div style={{ marginBottom: 20, marginTop: 20 }}>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        <TextField
          label={
            i18n.language === "en"
              ? "🔍 ... Search By Name"
              : "🔍 ...ابحث باسم الرسمه"
          }
          variant="outlined"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          autoComplete="off"
        />

        <button
          style={{
            backgroundColor: "#607d8b",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
            height: "40px",
            
          }}
          onClick={handleSearch}
          disabled={loading}
        >
          {i18n.language === "en" ? "search" : "بحث"}
        </button>
        <button
          style={{
            backgroundColor: "#df1616",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
            height: "40px",
          }}
          onClick={() => {
            setSearchResults([]);
            setSearchText("");
            setSearched(false);
            setSelectedAttributes(null);
            setHighlightedIndex(null);
          }}
          disabled={loading}
        >
          {i18n.language === "en" ? "Reset" : "إعادة تعيين"}
        </button>
        {searchResults.length > 1 && (
          <Button
            variant="contained"
            onClick={handleZoomToAll}
            color="primary"
            style={{
              backgroundColor: "#4121a8",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              height: "40px",
            }}
          >
            {i18n.language === "en" ? "Zoom to All" : "تكبير لكل النتائج"}
          </Button>
        )}
      </Box>

      {/* مؤشر التحميل */}
      {loading && (
        <Typography sx={{ mt: 2, color: "blue" }}>
          {i18n.language === "en" ? "Loading..." : "جاري التحميل..."}
        </Typography>
      )}

      {searched && (
        <div style={{ marginTop: "10px", color: "#333" }}>
          <strong>{t("matchingNames") || "الأسماء المطابقة"}:</strong>
          <div style={{ marginTop: 5 }}>
            {searchResults.length > 0 ? (
              searchResults.map((g, i) => (
                <div
                  onClick={() => handleSelect(g)}
                  key={i}
                  style={{
                    padding: "6px 10px",
                    marginBottom: "5px",
                    backgroundColor:
                      i === highlightedIndex ? "#cce4ff" : "#f1f1f1",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)} // تمييز العنصر عند المرور بالفأرة
                >
                  <span style={{ cursor: "pointer", color: "#000" }}>
                    {g.attributes?.name || `(${t("noName") || "بدون اسم"})`}
                  </span>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAttributes(g.attributes);
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    {i18n.language === "en" ? "Show Details" : "عرض التفاصيل"}
                  </Button>
                </div>
              ))
            ) : (
              <div style={{ color: "#f43434", marginTop: 5, fontSize: "30px" }}>
                {i18n.language === "en"
                  ? "No Drawing Found"
                  : "لا يوجد اسم بهذا البحث"}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedAttributes && (
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: 2,
            marginTop: 2,
            borderRadius: 2,
            boxShadow: 1,
            position: "relative",
          }}
        >
          <Button
            onClick={() => setSelectedAttributes(null)}
            size="small"
            variant="outlined"
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            {t("close") || "إغلاق"}
          </Button>

          <Typography variant="h6" gutterBottom>
            {t("drawingDetails") || "تفاصيل الرسم"}
          </Typography>

          {!editing ? (
            <>
              {Object.entries(selectedAttributes)
                .filter(([key]) => key !== "uid") // تجاهل uid
                .map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}

              <Button
                variant="contained"
                color="success"
                sx={{ mt: 2 }}
                onClick={() => {
                  setEditing(true);
                  setEditedValues({ ...selectedAttributes });
                }}
              >
                Update
              </Button>
            </>
          ) : (
            <>
              {Object.entries(editedValues).map(([key, value]) =>
                key === "uid" ? null : (
                  <Box key={key} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) =>
                        setEditedValues((prev:GraphicAttributes) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </Box>
                )
              )}

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    // تعديل الرسمة
                    const updated = searchResults.find(
                      (g) => g.attributes.uid === selectedAttributes.uid
                    );
                    if (updated) {
                      updated.attributes = { ...editedValues };
                      setSelectedAttributes({ ...editedValues });
                      setSuccessOpen(true); // *** هنا افتح رسالة النجاح عند الحفظ ***
                    }
                    setEditing(false);
                  }}
                >
                  حفظ
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setEditing(false)}
                >
                  إلغاء
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Snackbar مع Alert لرسالة النجاح */}
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose} // استخدام دالة منفصلة للـ Alert          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          {t("Update Success") || "تم التحديث بنجاح!"}
        </Alert>
      </Snackbar>
    </div>
  );
}
