/* ==========================================================
   FIELD BUDDY PRO v5.0 – ELITE EDITION
   Reports Module (ESM)
   Author: Martín Pérez | Fidelity Mechanical Solutions
   ----------------------------------------------------------
   Purpose:
     Reusable helpers to format reports, generate PDFs with
     jsPDF, and prepare email share links.

   Exports:
     - formatReportText(report, opts)
     - buildServicePDF(report, opts)
     - downloadPDF(doc, filename)
     - makeMailtoLink({ to, cc, bcc, subject, body })
     - safeFileName(name)
   Notes:
     - Assumes jsPDF UMD is loaded globally (window.jspdf.jsPDF).
     - All functions are pure/portable except PDF generation.
   ========================================================== */

/* ------------------ Utilities ------------------ */
export function safeFileName(s = '') {
  return String(s).trim().replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');
}

function fmtDate(d = new Date()) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function linesFromText(txt = '', width = 100) {
  return (txt || '').split(/\r?\n/).flatMap(p => p.length ? wrap(p, width) : ['']);
}

/* Simple word wrapper used for monospaced PDF text blocks */
function wrap(s, width) {
  const words = s.split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      if (line) out.push(line);
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) out.push(line);
  return out;
}

/* ------------------ Text Report ------------------ */
/**
 * Creates a clean, human-readable text block for the report.
 * report shape (expected by app.js):
 * {
 *   id, date, tech,
 *   customer: { name, addr },
 *   complaint
 *   diagnostics?, materials? (optional arrays/objects)
 * }
 */
export function formatReportText(report = {}, opts = {}) {
  const {
    includeHeader = true,
    includeDiagnostics = true,
    includeMaterials = true
  } = opts;

  const lines = [];
  if (includeHeader) {
    lines.push('Field Buddy Pro — Service Report');
    lines.push(`Report ID: ${report.id || ''}`);
    lines.push(`Date: ${fmtDate(report.date)}`);
    lines.push(`Technician: ${report.tech || ''}`);
    lines.push(`Customer: ${report.customer?.name || ''}`);
    lines.push(`Address: ${report.customer?.addr || ''}`);
    lines.push('');
  }

  if (report.complaint) {
    lines.push('Customer Complaint:');
    lines.push(...linesFromText(report.complaint, 100));
    lines.push('');
  }

  if (includeDiagnostics && report.diagnostics) {
    lines.push('Diagnostics:');
    // Expect an array of { label, value, unit? } or simple key-value
    const diag = Array.isArray(report.diagnostics) ? report.diagnostics : Object.entries(report.diagnostics).map(([k, v]) => ({ label: k, value: v }));
    for (const d of diag) {
      const label = d.label ?? d.key ?? '';
      const val = d.value ?? '';
      const unit = d.unit ? ` ${d.unit}` : '';
      lines.push(`  • ${label}: ${val}${unit}`);
    }
    lines.push('');
  }

  if (includeMaterials && report.materials && Object.keys(report.materials).length) {
    lines.push('Materials Selected:');
    const entries = Object.entries(report.materials).filter(([, q]) => q > 0).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length) {
      for (const [id, qty] of entries) {
        const [cat, name] = id.split('::');
        lines.push(`  • ${qty} × ${name} — ${cat}`);
      }
    } else {
      lines.push('  (none)');
    }
    lines.push('');
  }

  if (report.notes) {
    lines.push('Technician Notes:');
    lines.push(...linesFromText(report.notes, 100));
    lines.push('');
  }

  return lines.join('\n');
}

/* ------------------ PDF Generation ------------------ */
/**
 * Build a jsPDF document from a report object.
 * Returns the jsPDF instance (so caller can save or preview).
 */
export function buildServicePDF(report = {}, opts = {}) {
  const { jsPDF } = (window.jspdf || {});
  if (!jsPDF) throw new Error('jsPDF not loaded. Include jsPDF UMD before using buildServicePDF().');

  const {
    logoText = 'Field Buddy Pro',
    brand = 'Fidelity Mechanical Solutions',
    city = 'Houston, TX',
    page = 'letter',        // 'letter' or 'a4'
    orientation = 'p',      // 'p' or 'l'
    includeMaterials = true,
    includeDiagnostics = true,
    signatureDataURL,       // optional PNG data URL
  } = opts;

  const doc = new jsPDF({ unit: 'pt', format: page, orientation });

  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(logoText, 40, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${brand} • ${city}`, 40, 56);

  // Report meta
  const y0 = 84;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Service Report', 40, y0);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  let y = y0 + 18;
  const meta = [
    ['Report ID', report.id || ''],
    ['Date', fmtDate(report.date)],
    ['Technician', report.tech || ''],
    ['Customer', report.customer?.name || ''],
    ['Address', report.customer?.addr || '']
  ];

  for (const [k, v] of meta) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, 40, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), 140, y);
    y += 16;
  }

  // Complaint block
  if (report.complaint) {
    y += 10;
    doc.setFont('helvetica', 'bold'); doc.text('Customer Complaint:', 40, y); y += 14;
    doc.setFont('helvetica', 'normal');
    y = multiLine(doc, String(report.complaint), 40, y, 520, 14);
    y += 8;
  }

  // Diagnostics
  if (includeDiagnostics && report.diagnostics) {
    doc.setFont('helvetica', 'bold'); doc.text('Diagnostics:', 40, y); y += 14;
    doc.setFont('helvetica', 'normal');

    const diag = Array.isArray(report.diagnostics) ? report.diagnostics : Object.entries(report.diagnostics).map(([k, v]) => ({ label: k, value: v }));
    for (const d of diag) {
      const line = `${d.label ?? d.key ?? ''}: ${d.value ?? ''}${d.unit ? ' ' + d.unit : ''}`;
      y = multiLine(doc, line, 48, y, 512, 14);
    }
    y += 6;
  }

  // Materials
  if (includeMaterials && report.materials && Object.keys(report.materials).length) {
    doc.setFont('helvetica', 'bold'); doc.text('Materials Selected:', 40, y); y += 14;
    doc.setFont('helvetica', 'normal');

    const entries = Object.entries(report.materials).filter(([, q]) => q > 0).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length) {
      for (const [id, qty] of entries) {
        const [cat, name] = id.split('::');
        y = multiLine(doc, `• ${qty} × ${name} — ${cat}`, 48, y, 512, 14);
      }
    } else {
      y = multiLine(doc, '(none)', 48, y, 512, 14);
    }
    y += 6;
  }

  // Signature (optional)
  if (signatureDataURL) {
    // Reserve space at bottom—scale image to fit width 200
    const imgW = 200;
    const imgH = 60;
    const pageH = doc.internal.pageSize.getHeight();
    const bottom = pageH - 120;

    // If current cursor is too close to bottom, add a page
    if (y > bottom - imgH - 20) {
      doc.addPage();
      y = 60;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Customer Authorization:', 40, y); y += 14;
    try {
      doc.addImage(signatureDataURL, 'PNG', 40, y, imgW, imgH);
      y += imgH + 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text('Signature on file', 40, y);
    } catch (e) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text('(Signature image failed to load)', 40, y);
    }
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Generated by Field Buddy Pro', 40, pageH - 30);

  return doc;
}

/** Write long paragraphs with wrapping and simple page breaks. */
function multiLine(doc, text, x, y, width, lineH) {
  const lines = doc.splitTextToSize(String(text), width);
  const pageH = doc.internal.pageSize.getHeight();
  for (const ln of lines) {
    if (y > pageH - 60) {
      doc.addPage();
      y = 60;
    }
    doc.text(ln, x, y);
    y += lineH;
  }
  return y;
}

/* ------------------ Download Helper ------------------ */
export function downloadPDF(doc, filename = 'Report.pdf') {
  try {
    doc.save(safeFileName(filename));
  } catch (e) {
    console.error(e);
    throw new Error('Unable to save PDF.');
  }
}

/* ------------------ Email Helper ------------------ */
/**
 * Build a mailto: link the UI can open in a new tab/window.
 * Example:
 *   const href = makeMailtoLink({
 *     to: "dispatch@fms.pro",
 *     subject: "Service Report — Elena Bolonina",
 *     body: formatReportText(report)
 *   });
 *   window.location.href = href;
 */
export function makeMailtoLink({ to = '', cc = '', bcc = '', subject = '', body = '' } = {}) {
  const enc = encodeURIComponent;
  const parts = [];
  if (cc) parts.push(`cc=${enc(cc)}`);
  if (bcc) parts.push(`bcc=${enc(bcc)}`);
  if (subject) parts.push(`subject=${enc(subject)}`);
  if (body) parts.push(`body=${enc(body)}`);
  const params = parts.length ? `?${parts.join('&')}` : '';
  return `mailto:${encodeURIComponent(to)}${params}`;
}

/* ------------------ Default Export ------------------ */
export default {
  formatReportText,
  buildServicePDF,
  downloadPDF,
  makeMailtoLink,
  safeFileName
};
