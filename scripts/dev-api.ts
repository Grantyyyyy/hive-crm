/**
 * Development API Server for testing Clerk invitations locally
 * 
 * Usage:
 * 1. pnpm add express cors dotenv
 * 2. Create .env.local with CLERK_SECRET_KEY
 * 3. pnpm run dev:api
 * 4. In another terminal: pnpm run dev (Vite)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Invite endpoint
app.post('/api/invite-user', async (req, res) => {
  const { email, name, role } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

  if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error - CLERK_SECRET_KEY missing' });
  }

  try {
    console.log(`📧 Creating invitation for ${email}...`);

    // Step 1: Send invitation via Clerk's Official SDK
    const { createClerkClient } = await import('@clerk/clerk-sdk-node');
    const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role, requested_name: name },
        redirectUrl: process.env.VITE_APP_URL || 'http://localhost:5173/dashboard',
        ignoreExisting: true, // Don't crash if they were already invited in clerk but not local
      });

      console.log(`✅ Sent Clerk invitation to ${email} (Invite ID: ${invitation.id})`);

      return res.status(200).json({
        success: true,
        clerkUserId: `manual_${invitation.id}`, // the frontend uses manual_ prefix to know it hasn't signed in yet
        email: invitation.emailAddress,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        message: 'Invitation email sent.',
      });
    } catch (sdkError: any) {
      // Handle clerk SDK specific errors
      if (sdkError.errors && sdkError.errors.length > 0) {
        const errorData = sdkError.errors[0];
        console.log(`⚠️  Clerk validation error:`, JSON.stringify(errorData));
        return res.status(errorData.code === 'form_identifier_exists' ? 409 : 422).json({
          error: errorData.message || 'Failed to send invitation via Clerk',
          details: errorData,
          exists: errorData.code === 'form_identifier_exists'
        });
      }
      throw sdkError;
    }
  } catch (error) {
    console.error('❌ Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
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
║   - POST /api/invite-user  - Send Clerk invitation        ║
║   - GET  /api/health       - Health check                 ║
║                                                           ║
║   Make sure VITE_APP_URL in .env.local points to your     ║
║   Vite dev server (usually http://localhost:5173)         ║
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
