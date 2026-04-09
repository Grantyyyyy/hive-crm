/**
 * Development API Server for local development
 *
 * Usage:
 * 1. Create .env.local with SUPABASE_SERVICE_ROLE_KEY
 * 2. pnpm run dev:api
 * 3. In another terminal: pnpm run dev (Vite)
 */

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

// Invite endpoint — uses Supabase admin API
app.post('/api/invite-user', async (req, res) => {
  const { email, name, role } = req.body;

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
    console.log(`📧 Creating invitation for ${email}...`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: process.env.VITE_APP_URL || 'http://localhost:5173/sign-up',
      data: {
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

    console.log(`✅ Sent Supabase invitation to ${email} (ID: ${data.user?.id})`);

    return res.status(200).json({
      success: true,
      authUserId: data.user?.id,
      invitationId: data.user?.id,
      email: data.user?.email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
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

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Dev API Server running on http://localhost:${PORT}     ║
║                                                           ║
║   Endpoints:                                              ║
║   - POST /api/invite-user  - Send Supabase invitation     ║
║   - POST /api/create-user  - Create user with password    ║
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
