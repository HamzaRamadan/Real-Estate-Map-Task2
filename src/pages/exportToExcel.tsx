import * as XLSX from "xlsx";
import i18n from "../i18n"; // تأكد من وجود i18n لو بتستخدم اللغة

interface GraphicAttributes {
  name?: string;
  description?: string;
  createdAt?: string;
}

interface Graphic {
  attributes?: GraphicAttributes;
  geometry: {
    type: string;
  };
}

interface ExportToExcelParams {
  graphics: Graphic[];
  t: (key: string) => string;
  enqueueSnackbar: (
    msg: string,
    opts?: { variant: "success" | "error" | "info" | "warning" }
  ) => void;
}

export function exportToExcel({
  graphics,
  t,
  enqueueSnackbar,
}: ExportToExcelParams) {
  if (!graphics || graphics.length === 0) {
    enqueueSnackbar(
      i18n.language === "en"
        ? "🚫 No drawings to export"
        : "🚫 لا يوجد رسومات للتصدير",
      { variant: "warning" }
    );
    return;
  }

  const dataForExcel = graphics.map((g) => ({
    [t("name") || "الاسم"]: g.attributes?.name || "",
    [t("type") || "النوع"]:
      g.geometry.type === "polygon"
        ? t("polygon") || "مضلع"
        : t("polyline") || "خط",
    [t("description") || "الوصف"]: g.attributes?.description || "",
    [t("date") || "التاريخ"]: g.attributes?.createdAt || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    t("userDrawings") || "رسومات المستخدم"
  );
  XLSX.writeFile(workbook, "رسومات_المستخدم.xlsx");

  enqueueSnackbar(
    i18n.language === "en"
      ? "✅ Excel exported successfully"
      : "✅ تم تصدير Excel بنجاح",
    { variant: "success" }
  );
}
