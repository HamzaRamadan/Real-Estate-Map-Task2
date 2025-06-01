import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./fonts/Amiri-Regular-normal.js"; // استيراد الخط العربي

export const exportToPDF = (
  data: any[],
  fileName: string = "القطع",
  columns?: { field: string; title: string }[]
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    format: "a4",
  });

  // استخدام الخط العربي
  doc.setFont("Amiri-Regular"); // الخط اللي ضفناه
  doc.setFontSize(12);

  const tableColumnTitles = columns?.map((col) => col.title) || [];
  const tableData = data.map((item) =>
    columns?.map((col) => item[col.field]) || []
  );

  autoTable(doc, {
    head: [tableColumnTitles],
    body: tableData,
    styles: {
      font: "Amiri-Regular",
      fontSize: 10,
      halign: "right",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
    },
    didDrawPage: () => {
      doc.setFontSize(16);
      doc.text(fileName, doc.internal.pageSize.getWidth() - 20, 20, {
        align: "right",
      });
    },
  });

  doc.save(`${fileName}.pdf`);
};
