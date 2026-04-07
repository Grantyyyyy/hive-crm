/**
 * Settings Service - Supabase-based users, roles, and permissions management.
 * Replaces the old localhost:3001 REST API calls with direct Supabase queries.
 */
import { createClerkSupabaseClient } from './supabaseClient'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string
  module: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  color: string
  isSystem: boolean
  ownerId: string
  permissions?: Permission[]
  _count?: { users: number }
  createdAt: string
  updatedAt: string
}

export interface AppUser {
  id: string
  clerkUserId: string
  email: string
  name: string
  username?: string
  roleId?: string
  role?: Role
  ownerId: string
  createdAt: string
  updatedAt: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClerkSupabaseClient>

function toRole(row: any, permissions?: Permission[], userCount?: number): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    isSystem: row.is_system,
    ownerId: row.owner_id,
    permissions: permissions || [],
    _count: { users: userCount ?? 0 },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toAppUser(row: any, role?: Role): AppUser {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    name: row.name,
    username: row.username,
    roleId: row.role_id,
    role,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Roles Service ────────────────────────────────────────────────────────────

export async function fetchRoles(client: SupabaseClient): Promise<Role[]> {
  // 1. Fetch all roles
  const { data: roles, error } = await client
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name')
  if (error) throw error

  // 2. Fetch all role_permissions with permission details
  const { data: rolePerms, error: rpError } = await client
    .from('role_permissions')
    .select('role_id, permission_id, permissions(id, module, action, description)')
  if (rpError) throw rpError

  // 3. Count users per role
  const { data: userCounts, error: ucError } = await client
    .from('app_users')
    .select('role_id')
  if (ucError) throw ucError

  const countMap: Record<string, number> = {}
  userCounts?.forEach((u: any) => {
    if (u.role_id) countMap[u.role_id] = (countMap[u.role_id] || 0) + 1
  })

  // 4. Build permission map per role
  const permMap: Record<string, Permission[]> = {}
  rolePerms?.forEach((rp: any) => {
    if (!permMap[rp.role_id]) permMap[rp.role_id] = []
    if (rp.permissions) {
      permMap[rp.role_id].push({
        id: rp.permissions.id,
        module: rp.permissions.module,
        action: rp.permissions.action,
        description: rp.permissions.description,
      })
    }
  })

  return (roles || []).map(r => toRole(r, permMap[r.id] || [], countMap[r.id] || 0))
}

export async function createRole(
  client: SupabaseClient,
  data: { name: string; description?: string; color?: string; permissionIds?: string[] },
  ownerId: string,
): Promise<Role> {
  const { data: role, error } = await client
    .from('roles')
    .insert({
      name: data.name,
      description: data.description || null,
      color: data.color || '#6366f1',
      owner_id: ownerId,
    })
    .select()
    .single()
  if (error) throw error

  // Insert permission links
  if (data.permissionIds && data.permissionIds.length > 0) {
    const links = data.permissionIds.map(pid => ({
      role_id: role.id,
      permission_id: pid,
    }))
    const { error: linkError } = await client.from('role_permissions').insert(links)
    if (linkError) throw linkError
  }

  return toRole(role)
}

export async function updateRole(
  client: SupabaseClient,
  id: string,
  data: { name?: string; description?: string; color?: string; permissionIds?: string[] },
): Promise<Role> {
  const updates: any = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.color !== undefined) updates.color = data.color

  const { data: role, error } = await client
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  // Sync permissions: delete old, insert new
  if (data.permissionIds !== undefined) {
    await client.from('role_permissions').delete().eq('role_id', id)
    if (data.permissionIds.length > 0) {
      const links = data.permissionIds.map(pid => ({
        role_id: id,
        permission_id: pid,
      }))
      const { error: linkError } = await client.from('role_permissions').insert(links)
      if (linkError) throw linkError
    }
  }

  return toRole(role)
}

export async function deleteRole(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('roles').delete().eq('id', id)
  if (error) throw error
}

// ── Permissions Service ──────────────────────────────────────────────────────

export async function fetchPermissions(client: SupabaseClient): Promise<Record<string, Permission[]>> {
  const { data, error } = await client
    .from('permissions')
    .select('*')
    .order('module')
    .order('action')
  if (error) throw error

  const grouped: Record<string, Permission[]> = {}
    ; (data || []).forEach((p: any) => {
      if (!grouped[p.module]) grouped[p.module] = []
      grouped[p.module].push({
        id: p.id,
        module: p.module,
        action: p.action,
        description: p.description,
      })
    })
  return grouped
}

// ── Users Service ────────────────────────────────────────────────────────────

export async function fetchAppUsers(client: SupabaseClient): Promise<AppUser[]> {
  // 1. Fetch all app_users
  const { data: users, error } = await client
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  // 2. Fetch all roles for joining
  const roles = await fetchRoles(client)
  const roleMap = new Map(roles.map(r => [r.id, r]))

  return (users || []).map(u => toAppUser(u, u.role_id ? roleMap.get(u.role_id) : undefined))
}

export async function upsertCurrentUser(
  client: SupabaseClient,
  clerkUser: { id: string; email: string; fullName: string; username?: string },
  ownerId: string,
): Promise<AppUser> {
  // First, check if user already exists by exact clerk_user_id
  const { data: existingById } = await client
    .from('app_users')
    .select('*')
    .eq('clerk_user_id', clerkUser.id)
    .maybeSingle()

  if (existingById) {
    // Update name/email if changed
    const { data: updated, error } = await client
      .from('app_users')
      .update({
        email: clerkUser.email,
        name: clerkUser.fullName,
        username: clerkUser.username || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingById.id)
      .select()
      .single()
    if (error) throw error
    return toAppUser(updated)
  }

  // Next, check by email for a manually added placeholder user profile
  const { data: existingByEmail } = await client
    .from('app_users')
    .select('*')
    .eq('email', clerkUser.email)
    .like('clerk_user_id', 'manual_%')
    .maybeSingle()

  if (existingByEmail) {
    // Claim this manual profile with the real clerk_user_id
    const { data: claimed, error } = await client
      .from('app_users')
      .update({
        clerk_user_id: clerkUser.id,
        name: clerkUser.fullName,
        username: clerkUser.username || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingByEmail.id)
      .select()
      .single()
    if (error) throw error
    return toAppUser(claimed)
  }

  // Otherwise, create a entirely new user entry
  const { data: created, error } = await client
    .from('app_users')
    .insert({
      clerk_user_id: clerkUser.id,
      email: clerkUser.email,
      name: clerkUser.fullName,
      username: clerkUser.username || null,
      owner_id: ownerId,
    })
    .select()
    .single()
  if (error) throw error
  return toAppUser(created)
}

export async function updateUserRole(
  client: SupabaseClient,
  userId: string,
  roleId: string,
): Promise<void> {
  const { error } = await client
    .from('app_users')
    .update({ role_id: roleId, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Response from Clerk invitation API
 */
export interface ClerkInviteResponse {
  success: boolean;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

/**
 * Invite a user via Clerk API and create local app_users record.
 * This sends an invitation email to the user with a link to set their password.
 * The app_users record is created with a placeholder clerk_user_id that will be
 * updated to the real Clerk user ID when the user accepts the invitation and signs in.
 */
export async function inviteUser(
  client: SupabaseClient,
  data: { name: string; email: string; roleId?: string },
  ownerId: string,
): Promise<{ appUser: AppUser; clerkUserId: string }> {
  // Step 1: Call Clerk API to create user and send invitation
  const inviteResponse = await fetch('/api/invite-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      name: data.name,
      role: data.roleId,
    }),
  });

  const result = await inviteResponse.json();

  if (!inviteResponse.ok) {
    throw new Error(result.error || 'Failed to send invitation');
  }

  // Step 2: Create local app_users record with a placeholder clerk_user_id
  // This will be updated to the real Clerk user ID when the user accepts the invitation
  const placeholderId = `manual_invite_${result.invitationId || result.clerkUserId}`;

  const { data: created, error } = await client
    .from('app_users')
    .insert({
      clerk_user_id: placeholderId,
      email: data.email,
      name: data.name,
      role_id: data.roleId || null,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    appUser: toAppUser(created),
    clerkUserId: placeholderId,
  };
}

export async function addUser(
  client: SupabaseClient,
  data: { name: string; email: string; roleId?: string },
  ownerId: string,
): Promise<AppUser> {
  // Use a placeholder clerk_user_id for manually added users
  const placeholderId = `manual_${crypto.randomUUID()}`

  const { data: created, error } = await client
    .from('app_users')
    .insert({
      clerk_user_id: placeholderId,
      email: data.email,
      name: data.name,
      role_id: data.roleId || null,
      owner_id: ownerId,
    })
    .select()
    .single()
  if (error) throw error
  return toAppUser(created)
}

export async function removeUser(client: SupabaseClient, userId: string): Promise<void> {
  const { error } = await client.from('app_users').delete().eq('id', userId)
  if (error) throw error
}
