import { jsPDF } from "jspdf";
import type { Quote, SalesOrder } from "../lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEAL: [number, number, number] = [13, 148, 136]; // teal-600
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_400: [number, number, number] = [148, 163, 184];
const SLATE_200: [number, number, number] = [226, 232, 240];

function fmtCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || "$";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: string): string {
  return status.toUpperCase();
}

function statusColor(status: string): [number, number, number] {
  switch (status) {
    case "draft": return SLATE_400;
    case "sent": return [59, 130, 246]; // blue
    case "accepted": return TEAL;
    case "expired": return [239, 68, 68]; // red
    case "rejected": return [239, 68, 68];
    case "pending": return [245, 158, 11]; // amber
    case "shipped": return [59, 130, 246];
    case "delivered": return TEAL;
    case "cancelled": return [239, 68, 68];
    default: return SLATE_400;
  }
}

// ── PDF Builder ──────────────────────────────────────────────────────────────

interface PDFDocumentConfig {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
}

function createDoc(): PDFDocumentConfig {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  return { doc, y: 0, pageWidth, pageHeight, margin, contentWidth };
}

function checkPageBreak(pdf: PDFDocumentConfig, requiredHeight: number) {
  if (pdf.y + requiredHeight > pdf.pageHeight - pdf.margin) {
    pdf.doc.addPage();
    pdf.y = pdf.margin;
  }
}

function drawHeader(pdf: PDFDocumentConfig, title: string, subtitle: string) {
  const { doc, margin, contentWidth } = pdf;

  // Accent bar at top
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pdf.pageWidth, 4, "F");

  // Title area
  pdf.y = margin + 4;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_900);
  doc.text(title, margin, pdf.y);

  pdf.y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_400);
  doc.text(subtitle, margin, pdf.y);

  // Divider line
  pdf.y += 4;
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.5);
  doc.line(margin, pdf.y, margin + contentWidth, pdf.y);
  pdf.y += 6;
}

function drawMetaGrid(pdf: PDFDocumentConfig, left: Record<string, string>, right: Record<string, string>) {
  const { doc, margin, contentWidth } = pdf;
  const colWidth = contentWidth / 2;
  const rowH = 5.5;
  const rows = Math.max(Object.keys(left).length, Object.keys(right).length);
  const blockH = rows * rowH + 10;

  checkPageBreak(pdf, blockH);

  const startY = pdf.y;

  // Left column
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_400);
  let ly = startY;
  for (const [label, value] of Object.entries(left)) {
    doc.text(label, margin, ly);
    ly += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_900);
    doc.text(value, margin, ly);
    ly += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE_400);
  }

  // Right column
  const rx = margin + colWidth;
  ly = startY;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_400);
  for (const [label, value] of Object.entries(right)) {
    doc.text(label, rx, ly);
    ly += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_900);
    doc.text(value, rx, ly);
    ly += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE_400);
  }

  pdf.y = startY + blockH;

  // Divider
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.3);
  doc.line(margin, pdf.y, margin + contentWidth, pdf.y);
  pdf.y += 6;
}

function drawItemsTable(pdf: PDFDocumentConfig, items: Array<{ name: string; description?: string; quantity: number; price: number }>, currency: string) {
  const { doc, margin, contentWidth } = pdf;

  const colWidths = { name: contentWidth * 0.45, desc: contentWidth * 0.0, qty: contentWidth * 0.12, price: contentWidth * 0.18, total: contentWidth * 0.15 };
  const headerH = 8;
  const rowH = 7;

  checkPageBreak(pdf, headerH + items.length * rowH + 10);

  // Header background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, pdf.y, contentWidth, headerH, "F");

  // Header text
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_400);
  const headers = ["ITEM", "QTY", "UNIT PRICE", "TOTAL"];
  const headerPositions = [margin, margin + colWidths.name + colWidths.desc, margin + colWidths.name + colWidths.desc + colWidths.qty, margin + colWidths.name + colWidths.desc + colWidths.qty + colWidths.price];

  headers.forEach((h, i) => {
    doc.text(h, headerPositions[i], pdf.y + 5.5);
  });

  // Bottom border of header
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.3);
  doc.line(margin, pdf.y + headerH, margin + contentWidth, pdf.y + headerH);
  pdf.y += headerH + 1;

  // Rows
  items.forEach((item, idx) => {
    checkPageBreak(pdf, rowH + 4);

    const rowY = pdf.y;
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(margin, rowY, contentWidth, rowH, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE_900);
    doc.text(item.name.length > 40 ? item.name.substring(0, 40) + "…" : item.name, margin + 2, rowY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_600);
    const qtyX = margin + colWidths.name + colWidths.desc + colWidths.qty / 2;
    doc.text(String(item.quantity), qtyX, rowY + 5, { align: "center" });

    const priceX = margin + colWidths.name + colWidths.desc + colWidths.qty;
    doc.text(fmtCurrency(item.price, currency), priceX + colWidths.price - 2, rowY + 5, { align: "right" });

    const totalX = margin + colWidths.name + colWidths.desc + colWidths.qty + colWidths.price;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE_900);
    doc.text(fmtCurrency(item.quantity * item.price, currency), totalX + colWidths.total - 2, rowY + 5, { align: "right" });

    pdf.y = rowY + rowH;
  });

  // Table border
  doc.setDrawColor(...SLATE_200);
  doc.setLineWidth(0.3);
  doc.rect(margin, pdf.y - (items.length * rowH + headerH + 1), contentWidth, items.length * rowH + headerH + 1);

  pdf.y += 6;
}

function drawTotals(pdf: PDFDocumentConfig, items: Array<{ quantity: number; price: number }>, currency: string) {
  const { doc, margin, contentWidth } = pdf;
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  checkPageBreak(pdf, 30);

  const blockW = 70;
  const blockX = margin + contentWidth - blockW;
  const startY = pdf.y;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(blockX, startY, blockW, 24, 2, 2, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_400);
  doc.text("TOTAL", blockX + blockW - 4, startY + 6, { align: "right" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL);
  doc.text(fmtCurrency(subtotal, currency), blockX + blockW - 4, startY + 16, { align: "right" });

  pdf.y = startY + 30;
}

function drawTerms(pdf: PDFDocumentConfig, terms: string) {
  if (!terms) return;
  const { doc, margin, contentWidth } = pdf;

  checkPageBreak(pdf, 25);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_400);
  doc.text("TERMS & NOTES", margin, pdf.y);
  pdf.y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_600);
  const lines = doc.splitTextToSize(terms, contentWidth - 4);
  doc.text(lines, margin + 2, pdf.y);
  pdf.y += lines.length * 4 + 6;
}

function drawFooter(pdf: PDFDocumentConfig, companyName: string) {
  const { doc, pageWidth, pageHeight, margin } = pdf;

  // Bottom accent bar
  doc.setFillColor(...TEAL);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_400);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, pageHeight - 8);
  doc.text(companyName, pageWidth - margin, pageHeight - 8, { align: "right" });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds a Quote PDF as a Blob (no download). Used by email service.
 */
export async function generateQuotePDFBlob(quote: Quote, companyName: string = "Your Company"): Promise<Blob> {
  return _buildQuotePdf(quote, companyName);
}

/**
 * Generates a professional Quote PDF and triggers browser download.
 */
export async function generateQuotePDF(quote: Quote, companyName: string = "Your Company"): Promise<Blob> {
  const blob = await _buildQuotePdf(quote, companyName);
  const safeName = (quote.customerName || "Unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Quote_${quote.quoteNumber}_${safeName}.pdf`;
  console.log("[pdfService] Saving PDF:", filename);
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return blob;
}

/**
 * Builds an Invoice PDF as a Blob (no download). Used by email service.
 */
export async function generateInvoicePDFBlob(order: SalesOrder, companyName: string = "Your Company"): Promise<Blob> {
  return _buildInvoicePdf(order, companyName);
}

/**
 * Generates a professional Invoice PDF and triggers browser download.
 */
export async function generateInvoicePDF(order: SalesOrder, companyName: string = "Your Company"): Promise<Blob> {
  const blob = await _buildInvoicePdf(order, companyName);
  const safeName = (order.customerName || "Unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Invoice_${order.orderNumber}_${safeName}.pdf`;
  console.log("[pdfService] Saving PDF:", filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return blob;
}

// ── Internal Builders ────────────────────────────────────────────────────────

function _buildQuotePdf(quote: Quote, companyName: string): Promise<Blob> {
  const pdf = createDoc();
  const { doc } = pdf;

  drawHeader(pdf, "QUOTATION", `Quote #${quote.quoteNumber}`);

  drawMetaGrid(pdf,
    {
      "CUSTOMER": quote.customerName || "—",
      "DATE": fmtDate(quote.date),
      "VALID UNTIL": fmtDate(quote.validUntil || ""),
      "STATUS": statusLabel(quote.status),
    },
    {
      "QUOTE NUMBER": `#${quote.quoteNumber}`,
      "CURRENCY": quote.currency || "USD",
      "ITEMS": String(quote.items?.length || 0),
    }
  );

  const sColor = statusColor(quote.status);
  pdf.doc.setFontSize(8);
  pdf.doc.setFont("helvetica", "bold");
  pdf.doc.setTextColor(...sColor);

  const safeItems = Array.isArray(quote.items) ? quote.items : [];
  drawItemsTable(pdf, safeItems.map(i => ({ name: i.name, description: i.description, quantity: i.quantity, price: i.price })), quote.currency || "USD");
  drawTotals(pdf, safeItems, quote.currency || "USD");
  drawTerms(pdf, quote.terms || "");
  drawFooter(pdf, companyName);

  return Promise.resolve(doc.output("blob"));
}

function _buildInvoicePdf(order: SalesOrder, companyName: string): Promise<Blob> {
  const pdf = createDoc();
  const { doc } = pdf;

  drawHeader(pdf, "INVOICE", `Order #${order.orderNumber}`);

  drawMetaGrid(pdf,
    {
      "CUSTOMER": order.customerName || "—",
      "ORDER DATE": fmtDate(order.orderDate),
      "STATUS": statusLabel(order.status),
      "PAYMENT TERMS": "Net 30",
    },
    {
      "ORDER NUMBER": `#${order.orderNumber}`,
      "CURRENCY": order.currency || "USD",
      "ITEMS": String(order.items?.length || 0),
      "QUOTE REF": order.quoteId ? `#${order.quoteId.substring(0, 8)}` : "N/A",
    }
  );

  const sColor = statusColor(order.status);
  pdf.doc.setFontSize(8);
  pdf.doc.setFont("helvetica", "bold");
  pdf.doc.setTextColor(...sColor);

  const safeItems = Array.isArray(order.items) ? order.items : [];
  drawItemsTable(pdf, safeItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })), order.currency || "USD");
  drawTotals(pdf, safeItems, order.currency || "USD");
  drawFooter(pdf, companyName);

  return Promise.resolve(doc.output("blob"));
}
