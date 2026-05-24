import { createClient } from '@supabase/supabase-js';

type ApiRequest = {
  method?: string;
  body?: {
    email?: string;
    name?: string;
    role?: string;
  };
};

type ApiResponse = {
  status(code: number): {
    json(body: unknown): void;
  };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, role } = req.body ?? {};

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase credentials not configured for invitations');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Send invitation via Supabase admin API
    // inviteUserByEmail returns 422 if the user is already registered — handled below
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173'}/sign-up`,
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

    console.log(`✓ Sent Supabase invitation to ${email} (ID: ${data.user?.id})`);

    return res.status(200).json({
      success: true,
      authUserId: data.user?.id,
      invitationId: data.user?.id,
      email: data.user?.email,
      message: 'Invitation sent successfully. User will receive an email to set their password.',
    });
  } catch (error) {
    console.error('Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
