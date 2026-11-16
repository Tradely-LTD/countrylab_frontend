// ─── Certificate of Analysis PDF ──────────────────────────────────────────────
// Reproduces the Countrylab Nigeria result template (Borehole / Bottled Water /
// Groundnut Oil / Coconut Oil .docx templates): A4 portrait, Times, black
// bordered tables —
//   CERTIFICATE OF ANALYSIS ............................ Certificate No.
//   Sample Information grid (4 columns)
//   certification statement
//   TEST RESULT table: S/N | TEST PERFORMED | LIMITS | TEST RESULTS | REMARK
//   COMMENT
//   Signature of Public Analyst / name / title
//   disclaimer footer on every page
//
// `letterhead: true` leaves the top of page 1 blank for printing on the
// company's pre-printed letterhead paper (the .docx templates have an empty
// header for this reason); otherwise the logo and address are drawn there.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CertificateData {
  result: {
    id: string;
    approved_at: string | null;
    created_at: string | null;
    notes: string | null;
    qr_hash: string | null;
    parameters: CertificateParameter[];
  };
  sample: Record<string, any>;
  client: { name: string; company: string | null; address: string; contact_person: string | null } | null;
  template: { name: string; nis_standard: string | null; nis_standard_ref: string | null } | null;
  analyst: { full_name: string } | null;
  approver: { full_name: string; role: string } | null;
  org: {
    name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    accreditation_number: string | null;
    logo_data_url: string | null;
  };
  verify_url: string | null;
  qr_data_url: string | null;
  coa_settings: {
    signatory_label: string | null;
    signatory_name: string | null;
    signatory_title: string | null;
    disclaimer: string | null;
  };
}

export interface CertificateParameter {
  param_name: string;
  raw_value?: string | number | null;
  calculated_value?: string | number | null;
  unit?: string | null;
  spec_min?: number | null;
  spec_max?: number | null;
  nis_limit?: string | null;
  parameter_group?: string | null;
  pass?: boolean;
  data_type?: "numerical" | "qualitative";
}

const BLACK: [number, number, number] = [0, 0, 0];
const FONT = "times";
const MARGIN = 15; // mm

const CERTIFY_TEXT =
  "I hereby certify that I have analyzed the above described sample in the condition submitted to us. Hereunder, are the test results and comment.";

function defaultDisclaimer(lab: string) {
  return (
    `The information contained herein is based on the laboratory tests and observations performed by ${lab}. ` +
    `This sample(s) was submitted by the client solely for testing. ${lab} disclaims any and all liability for damages ` +
    `or injury which results in the use of the information contained herein and nothing contained herein shall constitute ` +
    `a guarantee, warranty or representation of ${lab} with respect to the accuracy of the information, the sample, ` +
    `products or items described or their suitability for use for any specific purpose. Unless otherwise instructed all ` +
    `samples pertaining to this report will be discarded between 7 to 45 days after the issuing date of this report ` +
    `depending on the nature of the sample`
  );
}

// ── Formatting ────────────────────────────────────────────────────────────────

function val(v: unknown, fallback = "N/A"): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s === "" ? fallback : s;
}

function date(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** jsPDF's built-in fonts are WinAnsi; swap characters they can't draw. */
function pdfText(s: string): string {
  return s
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/₄/g, "4");
}

function limitText(p: CertificateParameter): string {
  if (p.nis_limit && p.nis_limit.trim()) return p.nis_limit.trim();
  const hasMin = p.spec_min !== null && p.spec_min !== undefined;
  const hasMax = p.spec_max !== null && p.spec_max !== undefined;
  if (hasMin && hasMax) return `${p.spec_min} - ${p.spec_max}`;
  if (hasMax) return `${p.spec_max} (max)`;
  if (hasMin) return `${p.spec_min} (min)`;
  return "";
}

function testName(p: CertificateParameter): string {
  const name = p.param_name.trim();
  if (!p.unit || name.toLowerCase().includes(p.unit.toLowerCase())) return name;
  return `${name} (${p.unit})`;
}

function resultValue(p: CertificateParameter): string {
  const v = p.calculated_value ?? p.raw_value;
  return v === null || v === undefined || String(v).trim() === "" ? "" : String(v);
}

function remark(p: CertificateParameter): string {
  if (p.pass === true) return "Pass";
  if (p.pass === false) return "Fail";
  return "";
}

function autoComment(params: CertificateParameter[], standard: string | null): string {
  const judged = params.filter((p) => p.pass !== undefined);
  const against = standard ? ` the requirements of ${standard}` : " the specified requirements";
  if (judged.length === 0) return "";
  if (judged.every((p) => p.pass)) return `All tested parameters complied with${against}.`;
  const failed = judged.filter((p) => p.pass === false).map((p) => p.param_name);
  return `The sample did not comply with${against} in respect of: ${failed.join(", ")}.`;
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateCoaPdf(
  data: CertificateData,
  opts: { letterhead?: boolean; mode?: "save" | "preview" } = {},
) {
  const doc = buildCoaPdf(data, opts);
  const filename = `CoA-${data.sample.ulid.replace(/[\/\\]/g, "-")}${opts.letterhead ? "-letterhead" : ""}.pdf`;
  if (opts.mode === "preview") {
    window.open(doc.output("bloburl") as unknown as string, "_blank");
  } else {
    doc.save(filename);
  }
}

export function buildCoaPdf(data: CertificateData, opts: { letterhead?: boolean } = {}): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const lab = data.org.name || "Countrylab";
  const { sample, client, result } = data;
  const standard =
    sample.reference_standard || data.template?.nis_standard_ref || data.template?.nis_standard || null;

  doc.setTextColor(...BLACK);
  doc.setFont(FONT, "normal");

  // Footer height is fixed so tables never run into it
  const disclaimer = pdfText(data.coa_settings.disclaimer || defaultDisclaimer(lab));
  doc.setFontSize(6.5);
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW) as string[];
  const footerH = disclaimerLines.length * 2.6 + 10;
  const bottomLimit = pageH - footerH - 4;

  // ── Letterhead ───────────────────────────────────────────────────────────
  let y = MARGIN;
  if (opts.letterhead) {
    y = 42; // space for pre-printed letterhead
  } else {
    let textX = pageW / 2;
    let align: "center" | "left" = "center";
    if (data.org.logo_data_url) {
      try {
        const props = doc.getImageProperties(data.org.logo_data_url);
        const h = 16;
        const w = Math.min((props.width / props.height) * h, 45);
        doc.addImage(data.org.logo_data_url, MARGIN, y, w, h);
        textX = MARGIN + w + 5;
        align = "left";
      } catch {
        /* unreadable logo — fall back to text-only header */
      }
    }
    doc.setFont(FONT, "bold");
    doc.setFontSize(15);
    doc.text(pdfText(lab.toUpperCase()), textX, y + 5, { align });
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    const lines = [
      data.org.address,
      [data.org.phone && `Tel: ${data.org.phone}`, data.org.email && `Email: ${data.org.email}`]
        .filter(Boolean)
        .join("   "),
      data.org.accreditation_number && `Accreditation No.: ${data.org.accreditation_number}`,
    ].filter(Boolean) as string[];
    let ly = y + 10;
    for (const line of lines) {
      for (const l of doc.splitTextToSize(pdfText(line), pageW - textX - MARGIN) as string[]) {
        doc.text(l, textX, ly, { align });
        ly += 3.6;
      }
    }
    y = Math.max(y + 18, ly) + 1;
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += 6;
  }

  // ── Title row ────────────────────────────────────────────────────────────
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text("CERTIFICATE OF ANALYSIS", pageW / 2, y, { align: "center" });
  doc.setFontSize(9);
  doc.setFont(FONT, "normal");
  doc.text(`Certificate No.: ${sample.ulid}`, pageW - MARGIN, y, { align: "right" });
  y += 4;

  // ── Sample information grid ──────────────────────────────────────────────
  const productionExpiry =
    [date(sample.production_date), date(sample.expiry_date)].filter(Boolean).join(" / ") || "N/A";

  const info: [string, string, string, string][] = [
    ["Client/Establishment:", val(client?.company || client?.name, ""), "Date of Analysis:", date(result.created_at)],
    ["Address:", val(client?.address, ""), "Lab No.:", val(sample.ulid)],
    ["Delivered by:", val(client?.contact_person, "Client"), "Sampled by:", "Client"],
    ["Sample Type:", val(sample.name || sample.matrix, ""), "Sample Container:", val(sample.sample_container)],
    ["Name of Manufacturer:", val(sample.manufacturer), "Temp./ Humidity:", val(sample.temperature_on_receipt)],
    ["Description/ Sample Label:", val(sample.description || sample.name, ""), "Sample Received Condition:", val(sample.sample_condition, "Good")],
    ["Receiving Date:", date(sample.received_at), "Appearance of Sample:", val(sample.sample_condition, "Good")],
    ["Sample Volume/Size:", val(sample.sample_volume), "Production/Expiry Date:", productionExpiry],
    ["Reference Standard:", val(standard), "Batch No./NAFDAC No.:", val(sample.batch_number)],
  ];
  if (sample.sampling_point) info.push(["Sampling Point:", val(sample.sampling_point), "Date Approved:", date(result.approved_at)]);

  const gridStyles = {
    font: FONT,
    fontSize: 8.5,
    textColor: BLACK,
    lineColor: BLACK,
    lineWidth: 0.2,
    cellPadding: 1.3,
    valign: "middle" as const,
  };

  autoTable(doc, {
    startY: y,
    head: [[{ content: "Sample Information", colSpan: 4, styles: { halign: "left" } }]],
    body: info.map((r) => r.map(pdfText)),
    theme: "grid",
    styles: gridStyles,
    headStyles: { fillColor: false as any, textColor: BLACK, fontStyle: "bold", fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: contentW * 0.22 },
      1: { cellWidth: contentW * 0.28 },
      2: { fontStyle: "bold", cellWidth: contentW * 0.24 },
      3: { cellWidth: contentW * 0.26 },
    },
    margin: { left: MARGIN, right: MARGIN, bottom: pageH - bottomLimit },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // ── Certification statement ──────────────────────────────────────────────
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  const certify = doc.splitTextToSize(CERTIFY_TEXT, contentW) as string[];
  doc.text(certify, MARGIN, y);
  y += certify.length * 3.6 + 3;

  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.text("TEST RESULT", pageW / 2, y, { align: "center" });
  y += 2;

  // ── Results table ────────────────────────────────────────────────────────
  const params = result.parameters || [];
  const body: any[] = [];
  let lastGroup: string | null = null;
  params.forEach((p, i) => {
    const group = p.parameter_group?.trim() || null;
    if (group && group !== lastGroup) {
      body.push([
        { content: pdfText(group.toUpperCase()), colSpan: 5, styles: { fontStyle: "bold", halign: "center" } },
      ]);
    }
    lastGroup = group;
    body.push([String(i + 1), testName(p), limitText(p), resultValue(p), remark(p)].map(pdfText));
  });

  const limitsHeader = data.template?.nis_standard || standard ? "NIS LIMITS" : "LIMITS";
  autoTable(doc, {
    startY: y,
    head: [["S/N", "TEST PERFORMED", limitsHeader, "TEST RESULTS", "REMARK"]],
    body,
    theme: "grid",
    styles: { ...gridStyles, fontSize: 8.5 },
    headStyles: { fillColor: false as any, textColor: BLACK, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 11, halign: "center" },
      1: { cellWidth: contentW * 0.36 },
      2: { cellWidth: contentW * 0.22 },
      3: { cellWidth: contentW * 0.2 },
      4: { halign: "center" },
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 4 && hook.cell.raw === "Fail") {
        hook.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: pageH - bottomLimit },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── Comment + signature (kept together) ──────────────────────────────────
  const comment = pdfText((result.notes && result.notes.trim()) || autoComment(params, standard));
  doc.setFontSize(9);
  const commentLines = comment
    ? (doc.splitTextToSize(`COMMENT: ${comment}`, contentW) as string[])
    : [];
  const signatureH = 30;
  const blockH = commentLines.length * 4 + signatureH;
  if (y + blockH > bottomLimit) {
    doc.addPage();
    y = MARGIN + 5;
  }

  if (commentLines.length) {
    // Bold "COMMENT:" label, normal body
    doc.setFont(FONT, "bold");
    doc.text("COMMENT:", MARGIN, y);
    const labelW = doc.getTextWidth("COMMENT: ");
    doc.setFont(FONT, "normal");
    const first = doc.splitTextToSize(comment, contentW - labelW) as string[];
    doc.text(first[0], MARGIN + labelW, y);
    const rest = first.slice(1).join(" ");
    let cy = y + 4;
    if (rest) {
      const restLines = doc.splitTextToSize(rest, contentW) as string[];
      doc.text(restLines, MARGIN, cy);
      cy += restLines.length * 4;
    }
    y = cy + 3;
  }

  // Signature block (left) and verification QR (right)
  const sigLabel = data.coa_settings.signatory_label || "Signature of Public Analyst";
  const sigName = data.coa_settings.signatory_name || data.approver?.full_name || "";
  const sigTitle = data.coa_settings.signatory_title || "Laboratory Manager";
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.text(pdfText(sigLabel), MARGIN, y + 2);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + 14, MARGIN + 60, y + 14);
  doc.setFont(FONT, "bold");
  if (sigName) doc.text(pdfText(sigName), MARGIN, y + 18.5);
  doc.setFont(FONT, "normal");
  doc.text(pdfText(sigTitle), MARGIN, y + 22.5);

  if (data.qr_data_url) {
    const qr = 22;
    const qx = pageW - MARGIN - qr;
    doc.addImage(data.qr_data_url, "PNG", qx, y - 1, qr, qr);
    doc.setFontSize(6.5);
    doc.text("Scan to verify authenticity", qx + qr / 2, y + qr + 1.5, { align: "center" });
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const pages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const top = pageH - footerH;
    doc.setLineWidth(0.2);
    doc.line(MARGIN, top, pageW - MARGIN, top);
    doc.setFont(FONT, "italic");
    doc.setFontSize(6.5);
    doc.text(disclaimerLines, MARGIN, top + 3, { align: "justify", maxWidth: contentW });
    doc.setFont(FONT, "normal");
    doc.setFontSize(7);
    doc.text(`Certificate No.: ${sample.ulid}`, MARGIN, pageH - 4);
    doc.text(`Page ${p} of ${pages}`, pageW - MARGIN, pageH - 4, { align: "right" });
  }

  return doc;
}
