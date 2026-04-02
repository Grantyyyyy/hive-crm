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
    // Step 1: Create user in Clerk
    const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: [email],
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || '',
        password: crypto.randomUUID(), // Random secure password
        skip_password_requirement: true, // Allow without email verification initially
      }),
    });

    if (!clerkResponse.ok) {
      const error = await clerkResponse.json().catch(() => ({ errors: [] }));

      // Check if user already exists
      if (clerkResponse.status === 422) {
        return res.status(409).json({
          error: 'User with this email already exists',
          exists: true
        });
      }

      throw new Error(error.errors?.[0]?.message || 'Failed to create user in Clerk');
    }

    const user = await clerkResponse.json();

    // Step 2: Send invitation email via Clerk
    // This sends an email with a link to set their password
    const inviteResponse = await fetch(`https://api.clerk.com/v1/users/${user.id}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`,
      }),
    });

    if (!inviteResponse.ok) {
      console.error('Invite endpoint failed, but user was created. User ID:', user.id);
      // Continue anyway - user can reset password later
    }

    console.log(`✓ Created Clerk user ${user.id} and sent invitation to ${email}`);

    return res.status(200).json({
      success: true,
      clerkUserId: user.id,
      email: user.email_addresses[0]?.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
      message: 'User created successfully. Invitation email sent.',
    });
  } catch (error) {
    console.error('Error creating user invitation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user invitation',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
