// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      clearSelection: "Clear Selection",
      exportExcel: "Export to Excel",
      exportPDF: "Export to PDF",
      parcels: "Parcels",
    },
  },
  ar: {
    translation: {
      clearSelection: "مسح التحديد",
      exportExcel: "تصدير إلى Excel",
      exportPDF: "تصدير إلى PDF",
      parcels: "القطع",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
