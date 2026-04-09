/**
 * Vercel Serverless Function — Send Email with PDF Attachment
 *
 * POST /api/email/send
 *
 * Body:
 * {
 *   to: "customer@example.com",
 *   toName: "Customer Name",
 *   subject: "Quote #QT-001",
 *   message: "Custom message (optional)",
 *   documentType: "quote" | "invoice",
 *   documentNumber: "QT-001",
 *   items: [{ name, quantity, price }],
 *   currency: "USD",
 *   total: 5000,
 *   pdfBase64: "base64-encoded-pdf-content",
 *   pdfFilename: "Quote_QT-001.pdf"
 * }
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Your Company';
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    to,
    toName,
    subject,
    message,
    documentType,
    documentNumber,
    items = [],
    currency = 'USD',
    total = 0,
    pdfBase64,
    pdfFilename,
  } = body;

  if (!to || !subject || !documentType || !pdfBase64) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: to, subject, documentType, pdfBase64' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error — RESEND_API_KEY not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const currencySymbol = (curr: string) => ({ USD: '$', EUR: '€', GBP: '£' }[curr] || '$');
    const fmt = (amt: number, curr: string) =>
      `${currencySymbol(curr)}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const itemsHtml = items
      .map(
        (item: { name: string; quantity: number; price: number }) =>
          `<tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #0f172a;">${item.name}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: right;">${fmt(item.price, currency)}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">${fmt(item.quantity * item.price, currency)}</td>
          </tr>`
      )
      .join('');

    const label = documentType === 'invoice' ? 'Invoice' : 'Quote';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: #0d9488; padding: 4px;"></td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">${COMPANY_NAME}</p>
              <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">${subject}</h1>
              <p style="font-size: 14px; color: #64748b; margin: 0;">
                ${label} #${documentNumber} for ${toName || 'you'}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e2e8f0;">
            </td>
          </tr>

          <!-- Message -->
          ${message ? `<tr><td style="padding: 16px 32px;">
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
          </td></tr>` : ''}

          <!-- Items Table -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: left; border-bottom: 1px solid #e2e8f0;">Item</th>
                    <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
                    <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
                    <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td></td>
                  <td style="background: #f8fafc; border-radius: 8px; padding: 12px 20px; text-align: right; min-width: 140px;">
                    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em;">Total</span>
                    <br>
                    <span style="font-size: 18px; font-weight: 700; color: #0d9488;">${fmt(total, currency)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attachment Note -->
          <tr>
            <td style="padding: 16px 32px 32px;">
              <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="font-size: 13px; color: #0d9488; margin: 0;">
                  📎 The full ${label.toLowerCase()} PDF is attached to this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                Sent from ${COMPANY_NAME} • <a href="${APP_URL}" style="color: #0d9488; text-decoration: none;">View online</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #0d9488; padding: 4px;"></td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
${subject}

${label} #${documentNumber} for ${toName || 'you'}

${message ? message + '\n\n' : ''}
${items.map((item: { name: string; quantity: number; price: number }) => `${item.name} x${item.quantity} @ ${fmt(item.price, currency)} = ${fmt(item.quantity * item.price, currency)}`).join('\n')}

Total: ${fmt(total, currency)}

See attached ${label.toLowerCase()} PDF for full details.
Sent from ${COMPANY_NAME}
    `.trim();

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html,
      text,
      attachments: pdfBase64
        ? [
            {
              filename: pdfFilename || `${label}_${documentNumber}.pdf`,
              content: pdfBase64,
            },
          ]
        : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Email sent to ${to} (${label} #${documentNumber}) — ID: ${data?.id}`);

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id, to }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
