import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_BLUE = [30, 64, 175] as [number, number, number]; // #1e40af
const LIGHT_GRAY = [248, 250, 252] as [number, number, number]; // slate-50
const TEXT_DARK = [15, 23, 42] as [number, number, number]; // slate-900
const TEXT_MUTED = [100, 116, 139] as [number, number, number]; // slate-500

export interface ReportSummaryItem {
  label: string;
  value: string;
}

export interface ReportColumn {
  header: string;
  dataKey: string;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  organization?: string;
  summary?: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  filename: string;
  mode?: "save" | "preview";
}

export function generatePDFReport(opts: ReportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Header bar ────────────────────────────────────────────────
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageW, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(opts.title, 14, 10);

  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(199, 210, 254); // indigo-200
    doc.text(opts.subtitle, 14, 17);
  }

  // Organization + date range right-aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  const org = opts.organization || "Countrylab Laboratory";
  const dateStr = opts.dateRange || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  doc.text(org, pageW - 14, 10, { align: "right" });
  doc.text(dateStr, pageW - 14, 17, { align: "right" });

  let y = 30;

  // ── Summary cards ────────────────────────────────────────────
  if (opts.summary && opts.summary.length > 0) {
    const cardW = (pageW - 28 - (opts.summary.length - 1) * 4) / opts.summary.length;

    opts.summary.forEach((item, i) => {
      const x = 14 + i * (cardW + 4);
      doc.setFillColor(...LIGHT_GRAY);
      doc.roundedRect(x, y, cardW, 16, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...TEXT_DARK);
      doc.text(item.value, x + cardW / 2, y + 8, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(item.label, x + cardW / 2, y + 13.5, { align: "center" });
    });

    y += 22;
  }

  // ── Data table ────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [opts.columns.map((c) => c.header)],
    body: opts.rows.map((row) => opts.columns.map((c) => row[c.dataKey] ?? "—")),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: TEXT_DARK,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BRAND_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ───────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 8, pageW - 14, pageH - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Generated ${new Date().toLocaleString("en-GB")} · Countrylab LMS`,
      14,
      pageH - 4,
    );
    doc.text(`Page ${p} of ${totalPages}`, pageW - 14, pageH - 4, { align: "right" });
  }

  if (opts.mode === "preview") {
    const url = doc.output("bloburl") as unknown as string;
    window.open(url, "_blank");
  } else {
    doc.save(opts.filename);
  }
}

// ── Formatters ───────────────────────────────────────────────────
export const fmt = {
  currency: (v: number | null | undefined) =>
    v != null ? `NGN ${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—",
  date: (v: string | Date | null | undefined) =>
    v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  num: (v: number | null | undefined) => (v != null ? String(v) : "0"),
  pct: (v: number | null | undefined) => (v != null ? `${v}%` : "0%"),
  cap: (v: string | null | undefined) =>
    v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—",
};
