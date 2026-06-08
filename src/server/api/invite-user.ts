import { createClient } from '@supabase/supabase-js';

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: {
    email?: string;
    name?: string;
    role?: string;
    roleId?: string;
    organizationId?: string;
  };
};

type ApiResponse = {
  status(code: number): {
    json(body: unknown): void;
  };
};

/**
 * Resolves an invitee's auth identity for a (possibly multi-org) membership.
 *
 * - Brand-new email  -> sends a Supabase invite email and returns the freshly
 *   created auth user id.
 * - Already-registered email -> returns the existing auth user id (no email).
 *
 * In BOTH cases the caller (settingsService.inviteUser) then inserts the
 * organization membership row under the acting user's RLS, so authorization is
 * enforced by the database, not duplicated here. This endpoint only requires a
 * valid signed-in caller to prevent anonymous abuse of the admin API.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body ?? {};
  const role = req.body?.roleId ?? req.body?.role;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase credentials not configured for invitations');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Require a valid signed-in caller (lightweight anti-abuse; the membership
    // insert itself is still authorized by RLS on the client).
    const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
    const callerToken = authHeader?.replace(/^Bearer\s+/i, '');
    if (!callerToken || !SUPABASE_ANON_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { data: caller, error: callerError } = await admin.auth.getUser(callerToken);
    if (callerError || !caller?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Demo users are anonymous — never let them trigger real invite emails.
    if (caller.user.is_anonymous) {
      return res.status(403).json({ error: 'Inviting users is disabled in demo mode.' });
    }

    // 1. Already registered? Attach them without sending an email.
    const { data: existingId, error: lookupError } = await admin.rpc('find_auth_user_id_by_email', {
      p_email: email,
    });
    if (lookupError) throw lookupError;

    if (existingId) {
      return res.status(200).json({
        success: true,
        authUserId: existingId,
        isExisting: true,
        emailSent: false,
        message: 'User already has an account — they will be added to this organization.',
      });
    }

    // 2. Brand-new user: create the auth account + send the set-password email.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173'}/accept-invite`,
      data: { full_name: name, role: role || 'User' },
    });

    if (error) {
      // Race: registered between lookup and invite — resolve the id and attach.
      if (error.message?.includes('already registered') || error.status === 422) {
        const { data: raceId } = await admin.rpc('find_auth_user_id_by_email', { p_email: email });
        if (raceId) {
          return res.status(200).json({
            success: true,
            authUserId: raceId,
            isExisting: true,
            emailSent: false,
          });
        }
      }
      throw error;
    }

    console.log(`✓ Sent Supabase invitation to ${email} (ID: ${data.user?.id})`);

    return res.status(200).json({
      success: true,
      authUserId: data.user?.id,
      isExisting: false,
      emailSent: true,
      email: data.user?.email,
      message: 'Invitation sent. The user will receive an email to set their password.',
    });
  } catch (error) {
    console.error('Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
    });
  }
}
