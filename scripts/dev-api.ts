import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Invite endpoint — resolves an existing user or invites a brand-new one,
// returning the real auth user id so the client can attach a membership.
app.post('/api/invite-user', async (req, res) => {
  const { email, name } = req.body;
  const role = req.body.roleId ?? req.body.role;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    console.log(`📧 Resolving invitation for ${email}...`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Already registered? Attach them without sending an email.
    const { data: existingId, error: lookupError } = await supabase.rpc('find_auth_user_id_by_email', {
      p_email: email,
    });
    if (lookupError) throw lookupError;

    if (existingId) {
      console.log(`👥 ${email} already has an account (${existingId}) — will be added to the org.`);
      return res.status(200).json({
        success: true,
        authUserId: existingId,
        isExisting: true,
        emailSent: false,
        message: 'User already has an account — they will be added to this organization.',
      });
    }

    // 2. Brand-new user: create the account + send the set-password email.
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/accept-invite`,
      data: {
        full_name: name,
        role: role || 'User',
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || error.status === 422) {
        const { data: raceId } = await supabase.rpc('find_auth_user_id_by_email', { p_email: email });
        if (raceId) {
          return res.status(200).json({ success: true, authUserId: raceId, isExisting: true, emailSent: false });
        }
      }
      throw error;
    }

    console.log(`✅ Sent Supabase invitation to ${email} (ID: ${data.user?.id})`);

    return res.status(200).json({
      success: true,
      authUserId: data.user?.id,
      isExisting: false,
      emailSent: true,
      email: data.user?.email,
      message: 'Invitation email sent.',
    });
  } catch (error) {
    console.error('❌ Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Create user endpoint — creates account with default password immediately
app.post('/api/create-user', async (req, res) => {
  const { email, name, role, password = 'password' } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    console.log(`👤 Creating user account for ${email}...`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role || 'User',
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || error.status === 422) {
        return res.status(409).json({
          error: 'User with this email already exists',
          exists: true,
        });
      }
      throw error;
    }

    console.log(`✅ Created Supabase user: ${email} (ID: ${data.user?.id})`);

    return res.status(200).json({
      success: true,
      authUserId: data.user?.id,
      email: data.user?.email,
      message: `User created successfully with default password: ${password}`,
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email endpoint — uses Resend
app.post('/api/email/send', async (req, res) => {
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
  } = req.body;

  if (!to || !subject || !documentType || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, documentType, pdfBase64' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured in .env.local' });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const COMPANY_NAME = process.env.COMPANY_NAME || 'Your Company';
    const DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
    const currencySymbol = (curr: string) => ({ USD: '$', EUR: '€', GBP: '£' }[curr] || '$');
    const fmt = (amt: number, curr: string) =>
      `${currencySymbol(curr)}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const label = documentType === 'invoice' ? 'Invoice' : 'Quote';

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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <tr><td style="background: #0d9488; padding: 4px;"></td></tr>
    <tr><td style="padding: 32px 32px 16px;">
      <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">${COMPANY_NAME}</p>
      <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">${subject}</h1>
      <p style="font-size: 14px; color: #64748b; margin: 0;">${label} #${documentNumber} for ${toName || 'you'}</p>
    </td></tr>
    <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e2e8f0;"></td></tr>
    ${message ? `<tr><td style="padding: 16px 32px;"><p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p></td></tr>` : ''}
    <tr><td style="padding: 16px 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <thead><tr style="background: #f8fafc;">
        <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: left; border-bottom: 1px solid #e2e8f0;">Item</th>
        <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
        <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
        <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table></td></tr>
    <tr><td style="padding: 0 32px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
      <tr><td></td><td style="background: #f8fafc; border-radius: 8px; padding: 12px 20px; text-align: right; min-width: 140px;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total</span><br>
        <span style="font-size: 18px; font-weight: 700; color: #0d9488;">${fmt(total, currency)}</span>
      </td></tr>
    </table></td></tr>
    <tr><td style="padding: 16px 32px 32px;"><div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px; text-align: center;">
      <p style="font-size: 13px; color: #0d9488; margin: 0;">📎 The full ${label.toLowerCase()} PDF is attached.</p>
    </div></td></tr>
    <tr><td style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent from ${COMPANY_NAME} • <a href="${APP_URL}" style="color: #0d9488;">View online</a></p>
    </td></tr>
    <tr><td style="background: #0d9488; padding: 4px;"></td></tr>
  </table>
</body></html>`;

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html,
      attachments: [{ filename: pdfFilename || `${label}_${documentNumber}.pdf`, content: pdfBase64 }],
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Email sent to ${to} (${label} #${documentNumber}) — ID: ${data?.id}`);
    return res.status(200).json({ success: true, emailId: data?.id, to });
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err instanceof Error ? err.message : String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Dev API Server running on http://localhost:${PORT}     ║
║                                                           ║
║   Endpoints:                                              ║
║   - POST /api/invite-user  - Send Supabase invitation     ║
║   - POST /api/create-user  - Create user with password    ║
║   - POST /api/email/send   - Send email with PDF          ║
║   - GET  /api/health       - Health check                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}).on('error', (err: Error & { code?: string }) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
❌ Port ${PORT} is already in use!

Solutions:
1. Kill the process using port 3001:
   Windows: netstat -ano | findstr :3001
            taskkill /F /PID <PID>

2. Or set a different port by adding to .env.local:
   API_PORT=3002
`);
    process.exit(1);
  }
  throw err;
});
