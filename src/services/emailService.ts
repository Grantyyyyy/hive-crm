import type { Quote, SalesOrder } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  message?: string;
  documentType: 'quote' | 'invoice';
  documentNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  currency: string;
  total: number;
  pdfBase64: string;
  pdfFilename: string;
}

/**
 * Sends an email with a PDF attachment via the server-side email endpoint.
 * Generates the PDF client-side, converts to base64, then POSTs to /api/email/send.
 */
export async function sendEmailWithPdf(
  payload: SendEmailPayload
): Promise<{ success: boolean; emailId?: string }> {
  // Demo users are anonymous — never let them send real emails.
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (session?.user?.is_anonymous) {
    throw new Error("Sending email is disabled in demo mode.");
  }

  const response = await fetch(`${API_BASE}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generates a Quote PDF as base64 and sends it via email.
 */
export async function sendQuoteEmail(
  quote: Quote,
  customerEmail: string,
  customMessage?: string
): Promise<{ success: boolean; emailId?: string }> {
  // 1. Generate the same PDF as pdfService
  const { generateQuotePDFBlob } = await import("./pdfService");
  const blob = await generateQuotePDFBlob(quote);

  // 2. Convert blob to base64
  const pdfBase64 = await blobToBase64(blob);

  // 3. Calculate total
  const total = quote.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  // 4. Send
  return sendEmailWithPdf({
    to: customerEmail,
    toName: quote.customerName,
    subject: `Quote #${quote.quoteNumber} from Your Company`,
    message: customMessage,
    documentType: 'quote',
    documentNumber: quote.quoteNumber,
    items: quote.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    currency: quote.currency || 'USD',
    total,
    pdfBase64,
    pdfFilename: `Quote_${quote.quoteNumber}.pdf`,
  });
}

/**
 * Generates an Invoice PDF as base64 and sends it via email.
 */
export async function sendInvoiceEmail(
  order: SalesOrder,
  customerEmail: string,
  customMessage?: string
): Promise<{ success: boolean; emailId?: string }> {
  const { generateInvoicePDFBlob } = await import("./pdfService");
  const blob = await generateInvoicePDFBlob(order);

  const pdfBase64 = await blobToBase64(blob);
  const total = order.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return sendEmailWithPdf({
    to: customerEmail,
    toName: order.customerName,
    subject: `Invoice #${order.orderNumber} from Your Company`,
    message: customMessage,
    documentType: 'invoice',
    documentNumber: order.orderNumber,
    items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    currency: order.currency || 'USD',
    total,
    pdfBase64,
    pdfFilename: `Invoice_${order.orderNumber}.pdf`,
  });
}

/**
 * Converts a Blob to a base64 string (without data: URL prefix).
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip "data:application/pdf;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
