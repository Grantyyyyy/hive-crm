import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "./AuthContext"
import { supabase } from "./supabaseClient"

// ── Module-level cache for the async can() helper ────────────────────────

interface PermCache {
  userId: string
  permissionIds: Set<string>
  loaded: boolean
}

let cache: PermCache | null = null

async function loadPermissions(userId: string): Promise<Set<string>> {
  const { data: appUser } = await supabase
    .from("app_users")
    .select("role_id")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (!appUser?.role_id) return new Set()

  const { data: links } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", appUser.role_id)

  return new Set((links || []).map((l: any) => l.permission_id))
}

/**
 * Standalone async permission check — usable outside React.
 * Usage: `const ok = await can("leads", "create")`
 */
export async function can(
  module: string,
  action: string,
  userId?: string,
): Promise<boolean> {
  let uid = userId
  if (!uid) {
    const { data: session } = await supabase.auth.getSession()
    uid = session.session?.user?.id
  }
  if (!uid) return false

  if (!cache || cache.userId !== uid || !cache.loaded) {
    const permIds = await loadPermissions(uid)
    cache = { userId: uid, permissionIds: permIds, loaded: true }
  }

  const { data: perm } = await supabase
    .from("permissions")
    .select("id")
    .eq("module", module)
    .eq("action", action)
    .maybeSingle()

  if (!perm) return false
  return cache.permissionIds.has(perm.id)
}

/** Clear the module cache — called on sign-out. */
export function clearPermCache() {
  cache = null
  globalPermMap = null
  globalTotalCount = null
  globalRoleName = null
}

// ── React Hook ────────────────────────────────────────────────────────────

interface UsePermissionReturn {
  /** Synchronous check against loaded cache. Returns false until loaded. */
  can: (module: string, action: string) => boolean
  /** True once permissions have been fetched from the server. */
  isLoaded: boolean
  /** Async check — always hits the database (use when you need fresh data). */
  canAsync: (module: string, action: string) => Promise<boolean>
  /** True if the user has every permission defined in the system. */
  hasFullAccess: boolean
  /** The user's role name (e.g., "Admin", "Manager", "Agent"), or null. */
  roleName: string | null
}

// Module-level global store for the map (doesn't change often)
let globalPermMap: Map<string, string> | null = null;
let globalTotalCount: number | null = null;
let globalRoleName: string | null = null;

export function usePermission(): UsePermissionReturn {
  const { userId, isLoaded: authLoaded } = useAuth()

  // Initialize from cache if available to prevent flickering
  const [perms, setPerms] = useState<{
    ids: Set<string>
    loaded: boolean
    totalPermCount: number | null
    roleName: string | null
  }>(() => {
    if (cache && cache.userId === userId && cache.loaded) {
      return { 
        ids: cache.permissionIds, 
        loaded: true, 
        totalPermCount: globalTotalCount, 
        roleName: globalRoleName 
      }
    }
    return { ids: new Set(), loaded: false, totalPermCount: null, roleName: null }
  })

  const [permMap, setPermMap] = useState<Map<string, string>>(globalPermMap || new Map())

  useEffect(() => {
    if (!userId) {
      setPerms({ ids: new Set(), loaded: true, totalPermCount: null, roleName: null })
      setPermMap(new Map())
      cache = null
      globalPermMap = null
      globalRoleName = null
      return
    }

    // If cache already exists for this user, don't fetch again
    if (cache && cache.userId === userId && cache.loaded && globalPermMap) {
      if (!perms.loaded) {
        setPerms({ 
          ids: cache.permissionIds, 
          loaded: true, 
          totalPermCount: globalTotalCount, 
          roleName: globalRoleName 
        })
        setPermMap(globalPermMap)
      }
      return
    }

    let cancelled = false
      ; (async () => {
        const [userRoleData, allPermsData] = await Promise.all([
          supabase
            .from("app_users")
            .select(`
              role_id,
              roles (
                name,
                role_permissions (
                  permission_id
                )
              )
            `)
            .eq("auth_user_id", userId)
            .maybeSingle(),

          supabase
            .from("permissions")
            .select("id, module, action", { count: "exact" })
        ]);

        if (cancelled) return;

        const { data: userRecord } = userRoleData;
        const { data: allPerms, count: totalCount } = allPermsData;

        const roleData = userRecord?.roles as any;
        const roleName = roleData?.name || null;
        const rawPerms = roleData?.role_permissions || [];
        const permIds = new Set<string>(rawPerms.map((rp: any) => rp.permission_id));

        const map = new Map<string, string>();
        allPerms?.forEach((p: any) => map.set(`${p.module}:${p.action}`, p.id));

        // Update Globals
        globalPermMap = map;
        globalTotalCount = totalCount;
        globalRoleName = roleName;
        cache = { userId, permissionIds: permIds, loaded: true };

        setPermMap(map);
        setPerms({
          ids: permIds,
          loaded: true,
          totalPermCount: totalCount,
          roleName,
        });
      })()

    return () => { cancelled = true }
  }, [userId])

  const canSync = useCallback(
    (module: string, action: string): boolean => {
      if (!perms.loaded) return false
      // Super Admin bypass: guaranteed full access
      if (perms.roleName === 'Super Admin') return true
      if (perms.totalPermCount !== null && perms.ids.size >= perms.totalPermCount) return true
      const permId = permMap.get(`${module}:${action}`)
      if (!permId) return false
      return perms.ids.has(permId)
    },
    [perms, permMap],
  )

  const canAsync = useCallback(
    async (module: string, action: string): Promise<boolean> => {
      return can(module, action, userId || undefined)
    },
    [userId],
  )

  return useMemo(
    () => ({
      can: canSync,
      isLoaded: perms.loaded && authLoaded,
      canAsync,
      hasFullAccess: (perms.roleName === 'Super Admin') || (perms.totalPermCount !== null && perms.ids.size >= (perms.totalPermCount || 0)),
      roleName: perms.roleName,
    }),
    [canSync, perms.loaded, perms.totalPermCount, perms.ids.size, perms.roleName, authLoaded, canAsync],
  )
}
