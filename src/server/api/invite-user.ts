import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Send invitation via Clerk's Invitations API
    // This creates the user when they accept and prompts them to set a password
    const inviteResponse = await fetch('https://api.clerk.com/v1/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: {
          name: name,
        },
        redirect_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/sign-up`,
      }),
    });

    if (!inviteResponse.ok) {
      const error = await inviteResponse.json().catch(() => ({ errors: [] }));

      // Check if user already exists
      if (inviteResponse.status === 422) {
        return res.status(409).json({
          error: 'User with this email already exists',
          exists: true
        });
      }

      throw new Error(error.errors?.[0]?.message || 'Failed to send invitation');
    }

    const invitation = await inviteResponse.json();

    console.log(`✓ Sent Clerk invitation to ${email} (ID: ${invitation.id})`);

    return res.status(200).json({
      success: true,
      invitationId: invitation.id,
      email: invitation.email_address,
      message: 'Invitation sent successfully. User will set their password via email link.',
    });
  } catch (error) {
    console.error('Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
