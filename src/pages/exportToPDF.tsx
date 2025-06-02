import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "../utils/fonts/Amiri-Regular-normal.js";
import i18n from "../i18n"; 


export async function exportToPDF(
  graphics: any[],
  t: (key: string) => string,
  viewRef: any,
  notify: (
    msg: string,
    opts?: { variant: "success" | "error" | "info" | "warning" }
  ) => void
) {
  if (graphics.length === 0) {
    notify(
      i18n.language === "en"
        ? "🚫 Please select drawings to export"
        : "🚫 لا يوجد رسومات للتصدير",
      { variant: "warning" }
    );
    return;
  }

  const view = viewRef.current;
  if (!view?.ready) await view?.when();

  const screenshot = await view.takeScreenshot();

  const doc = new jsPDF({ orientation: "portrait" });
  doc.addFileToVFS("Amiri-Regular.ttf", font);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");
  doc.setFontSize(16);
  doc.text(t("userDrawings") || "رسومات المستخدم", 105, 20, { align: "center" });

  const rows = graphics.map((g) => [
    g.attributes?.name || t("noName"),
    g.geometry?.type === "polygon" ? t("polygon") : t("polyline"),
    g.attributes?.description || t("noDescription"),
    g.attributes?.createdAt || t("noDate"),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [[t("name"), t("type"), t("description"), t("date")]],
    body: rows,
    styles: {
      font: "Amiri",
      fontStyle: "normal",
      fontSize: 12,
      halign: "right",
    },
    headStyles: {
      fillColor: [40, 100, 200],
      textColor: 255,
      halign: "right",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
const finalY = (doc as any).lastAutoTable?.finalY || 50;

  doc.addImage(screenshot.dataUrl, "PNG", 15, finalY + 10, 180, 100);

  doc.save("رسومات_المستخدم.pdf");

  notify(
    i18n.language === "en"
      ? "✅ PDF exported successfully"
      : "✅ تم تصدير PDF بنجاح",
    { variant: "success" }
  );
}
