/**
 * Settings Service - Supabase-based users, roles, and permissions management.
 * Replaces the old localhost:3001 REST API calls with direct Supabase queries.
 */
import { supabase } from './supabaseClient'
import type { Permission, Role, AppUser } from './types'

export type { Permission, Role }

// ── Helpers ──────────────────────────────────────────────────────────────────


type SupabaseClient = typeof supabase

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
    authUserId: row.auth_user_id,
    email: row.email,
    name: row.name,
    username: row.username,
    roleId: row.role_id,
    role,
    ownerId: row.owner_id,
    isSuperadmin: row.is_superadmin,
    brandColor: row.brand_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Permission Enforcement ────────────────────────────────────────────────

/**
 * Throws if the currently authenticated user does NOT have the specified
 * module:action permission. Call this at the start of any sensitive function.
 */
export async function assertPermission(
  client: SupabaseClient,
  module: string,
  action: string,
): Promise<void> {
  // Get current auth user ID
const { data: session } = await (client.auth as any).getSession()
  const authUserId = session.session?.user?.id
  if (!authUserId) throw new Error('Unauthorized')

  // Look up the user's role and permissions
  const { data: appUser } = await client
    .from('app_users')
    .select('role_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (!appUser?.role_id) throw new Error('Unauthorized')

  // Get the permission ID for this module:action
  const { data: requiredPerm } = await client
    .from('permissions')
    .select('id')
    .eq('module', module)
    .eq('action', action)
    .maybeSingle()

  if (!requiredPerm) throw new Error(`Unknown permission: ${module}:${action}`)

  // Check if the user's role has ALL permissions (full access)
  const { count: totalPerms } = await client
    .from('permissions')
    .select('*', { count: 'exact', head: true })

  const { count: userPermCount } = await client
    .from('role_permissions')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', appUser.role_id)

  // Full access: role has every permission
  if (totalPerms !== null && userPermCount !== null && userPermCount >= totalPerms) return

  // Otherwise check for the specific permission
  const hasPerm = await client
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', appUser.role_id)
    .eq('permission_id', requiredPerm.id)
    .maybeSingle()

  if (!hasPerm) throw new Error(`Forbidden: requires ${module}:${action}`)
}

/**
 * Validates that an Admin cannot assign the Admin or Super Admin role.
 */
async function assertRoleAssignmentPerms(
  client: SupabaseClient,
  assignedRoleId: string | undefined,
  actingUserId: string,
) {
  if (!assignedRoleId || !actingUserId) return;

  const { data: actingAppUser } = await client
    .from('app_users')
    .select('is_superadmin, roles(name)')
    .eq('auth_user_id', actingUserId)
    .maybeSingle();

  if (!actingAppUser || actingAppUser.is_superadmin) return;

  // roles(name) can be an array if there's multiple, but here it's singular relationship
  const roleData = actingAppUser.roles as any;
  const actingRoleName = roleData?.name;

  if (actingRoleName === 'Admin') {
    const { data: targetRole } = await client
      .from('roles')
      .select('name')
      .eq('id', assignedRoleId)
      .maybeSingle();

    if (targetRole && ['Admin', 'Super Admin'].includes(targetRole.name)) {
      throw new Error('Admins cannot assign the Admin or Super Admin role');
    }
  }
}

/**
 * Validates that the last Admin in an organization cannot be removed or demoted.
 */
async function assertLastAdminGuard(
  client: SupabaseClient,
  targetAppUserId: string,
) {
  // Find the target user and their role
  const { data: targetUser } = await client
    .from('app_users')
    .select('organization_id, roles(name)')
    .eq('id', targetAppUserId)
    .maybeSingle();

  if (!targetUser) return;

  const roleData = targetUser.roles as any;
  const targetRoleName = roleData?.name;

  if (targetRoleName === 'Admin') {
    // Count how many Admins exist in this organization
    const { count } = await client
      .from('app_users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', targetUser.organization_id)
      .not('roles', 'is', null)
      // This requires PostgREST filtering on the joined table or a simpler approach.
      // Easiest is to fetch all users in the org and filter locally (or use RPC).
      // Since orgs typically have few users, local filtering is acceptable for this guard.
      
    const { data: allOrgUsers } = await client
      .from('app_users')
      .select('id, roles(name)')
      .eq('organization_id', targetUser.organization_id);

    const adminCount = (allOrgUsers || []).filter((u: any) => u.roles?.name === 'Admin').length;

    if (adminCount <= 1) {
      throw new Error('Cannot modify or remove the last Admin in the organization');
    }
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
  organizationId: string,
): Promise<Role> {
  await assertPermission(client, 'roles', 'create')
  const { data: role, error } = await client
    .from('roles')
    .insert({
      name: data.name,
      description: data.description || null,
      color: data.color || '#6366f1',
      owner_id: ownerId,
      organization_id: organizationId,
    })
    .select()
    .single()
  if (error) throw error

  // Insert permission links
  if (data.permissionIds && data.permissionIds.length > 0) {
    const links = data.permissionIds.map(pid => ({
      role_id: role.id,
      permission_id: pid,
      organization_id: organizationId,
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
  organizationId: string,
): Promise<Role> {
  await assertPermission(client, 'roles', 'update')
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
        organization_id: organizationId,
      }))
      const { error: linkError } = await client.from('role_permissions').insert(links)
      if (linkError) throw linkError
    }
  }

  return toRole(role)
}

export async function deleteRole(client: SupabaseClient, id: string): Promise<void> {
  await assertPermission(client, 'roles', 'delete')
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

export async function fetchAppUsers(client: SupabaseClient, organizationId: string): Promise<AppUser[]> {
  // 1. Fetch all app_users in the current organization
  const { data: users, error } = await client
    .from('app_users')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error

  // 2. Fetch all roles for joining
  const roles = await fetchRoles(client)
  const roleMap = new Map(roles.map(r => [r.id, r]))

  return (users || []).map(u => toAppUser(u, u.role_id ? roleMap.get(u.role_id) : undefined))
}

export async function upsertCurrentUser(
  client: SupabaseClient,
  supabaseUser: { id: string; email: string; fullName: string; username?: string },
  ownerId: string,
): Promise<AppUser> {
  // First, check if user already exists by exact auth_user_id
  const { data: existingById } = await client
    .from('app_users')
    .select('*')
    .eq('auth_user_id', supabaseUser.id)
    .maybeSingle()

  if (existingById) {
    // Update name/email if changed
    const { data: updated, error } = await client
      .from('app_users')
      .update({
        email: supabaseUser.email,
        name: supabaseUser.fullName,
        username: supabaseUser.username || null,
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
    .eq('email', supabaseUser.email)
    .like('auth_user_id', 'manual_%')
    .maybeSingle()

  if (existingByEmail) {
    // Claim this manual profile with the real auth_user_id
    const { data: claimed, error } = await client
      .from('app_users')
      .update({
        auth_user_id: supabaseUser.id,
        name: supabaseUser.fullName,
        username: supabaseUser.username || null,
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
      auth_user_id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.fullName,
      username: supabaseUser.username || null,
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
  await assertPermission(client, 'users', 'update');
  
  // Guard 1: Verify acting user's capacity to assign this role
  const { data: session } = await (client.auth as any).getSession();
  if (session.session?.user?.id) {
    await assertRoleAssignmentPerms(client, roleId, session.session.user.id);
  }

  // Guard 2: Prevent demoting the last admin
  await assertLastAdminGuard(client, userId);
  const { error } = await client
    .from('app_users')
    .update({ role_id: roleId, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Response from user invitation API
 */
export interface InviteResponse {
  success: boolean;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

/**
 * Invite a user via API and create local app_users record.
 * This sends an invitation email to the user with a link to set their password.
 * The app_users record is created with a placeholder auth_user_id that will be
 * updated to the real Supabase user ID when the user accepts the invitation and signs in.
 */
export async function inviteUser(
  client: SupabaseClient,
  data: { name: string; email: string; roleId?: string },
  ownerId: string,
  organizationId: string,
): Promise<{ appUser: AppUser; authUserId: string }> {
  await assertPermission(client, 'users', 'create')
  await assertRoleAssignmentPerms(client, data.roleId, ownerId)
  // Step 1: Call the invitation API
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

  // Step 2: Create local app_users record with a placeholder auth_user_id
  // This will be updated to the real Supabase user ID when the user accepts the invitation
  const placeholderId = `manual_invite_${result.invitationId || result.authUserId}`;

  const { data: created, error } = await client
    .from('app_users')
    .insert({
      auth_user_id: placeholderId,
      email: data.email,
      name: data.name,
      role_id: data.roleId || null,
      owner_id: ownerId,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    appUser: toAppUser(created),
    authUserId: placeholderId,
  };
}

export async function addUser(
  client: SupabaseClient,
  data: { name: string; email: string; roleId?: string },
  ownerId: string,
  organizationId: string,
): Promise<AppUser> {
  await assertPermission(client, 'users', 'create')
  await assertRoleAssignmentPerms(client, data.roleId, ownerId)

  // Step 1: Create real Auth account via dev-api
  const createResponse = await fetch('/api/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      name: data.name,
      role: data.roleId,
      password: 'password', // Default password
    }),
  });

  const result = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(result.error || 'Failed to create user account');
  }

  const authUserId = result.authUserId;

  // Step 2: Create local app_users record with the real auth_user_id
  const { data: created, error } = await client
    .from('app_users')
    .insert({
      auth_user_id: authUserId,
      email: data.email,
      name: data.name,
      role_id: data.roleId || null,
      owner_id: ownerId,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (error) throw error
  return toAppUser(created)
}

export async function removeUser(client: SupabaseClient, userId: string): Promise<void> {
  await assertPermission(client, 'users', 'delete')
  await assertLastAdminGuard(client, userId)
  const { error } = await client.from('app_users').delete().eq('id', userId)
  if (error) throw error
}

export interface OrganizationSetupResult {
  organizationId: string
  roleId: string | null
}

/**
 * Handles the first-time setup for a user who just signed up.
 * 1. Creates a new organization via secure RPC.
 * 2. Assigns the user to that organization as Admin.
 * 3. Refreshes the session to update JWT claims.
 */
export async function setupFirstOrganization(
  client: SupabaseClient,
  data: { name: string; slug: string; ownerId: string; userEmail: string; userName?: string }
): Promise<OrganizationSetupResult> {
  const { data: rpcResult, error } = await client.rpc('initialize_organization', {
    org_name: data.name,
    org_slug: data.slug,
    user_email: data.userEmail,
    user_full_name: data.userName || data.userEmail.split('@')[0]
  })

  if (error) throw error

  const result = rpcResult as {
    success?: boolean
    organization_id?: string
    role_id?: string | null
    users_affected?: number
  } | null

  if (!result?.success || !result.organization_id) {
    throw new Error('Organization setup did not return a valid organization assignment.')
  }

  if (typeof result.users_affected === 'number' && result.users_affected < 1) {
    throw new Error('Organization was created, but no app_users row was linked to the current user.')
  }

  const { data: linkedUser, error: linkedUserError } = await client
    .from('app_users')
    .select('organization_id, role_id')
    .eq('auth_user_id', data.ownerId)
    .maybeSingle()

  if (linkedUserError) throw linkedUserError

  if (!linkedUser?.organization_id) {
    throw new Error('Organization was created, but the current user was not assigned in app_users.')
  }

  return {
    organizationId: linkedUser.organization_id,
    roleId: linkedUser.role_id ?? result.role_id ?? null,
  }
}
