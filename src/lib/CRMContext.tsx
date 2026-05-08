import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useAuth, useUser } from "./AuthContext"
import { supabase } from "./supabaseClient"
import { logger } from "./logger"

// ── Table mapping ────────────────────────────────────────────────────────────

export const TABLE_MAP: Record<string, string> = {
  leads: "leads",
  contacts: "contacts",
  deals: "deals",
  tasks: "tasks",
  activities: "activities",
  orders: "sales_orders",
  quotes: "quotes",
  inventory: "inventory",
  purchase_orders: "purchase_orders",
  purchase_requests: "purchase_requests",
  purchase_receipts: "purchase_receipts",
  purchase_receipt_items: "purchase_receipt_items",
  inventory_transactions: "inventory_transactions",
  vendors: "vendors",
  projects: "projects",
  task_tags: "task_tags",
  task_tag_links: "task_tag_links",
  task_activities: "task_activities",
  return_to_suppliers: "return_to_suppliers",
  organizations: "organizations",
  audit_log: "audit_log",
  notifications: "notifications",
  users: "app_users",
  discounts: "discounts",
}

// ── Case converters ──────────────────────────────────────────────────────────

type SnakeObject = Record<string, any>
type CamelObject = Record<string, any>

const UUID_FIELDS = [
  "contact_id", "deal_id", "lead_id", "entity_id",
  "converted_to_contact_id", "converted_to_deal_id",
  "converted_to_contact_id", "converted_to_deal_id",
  "customer_id", "project_id", "task_id", "tag_id",
  "parent_task_id", "inventory_item_id", "quote_id",
  "receipt_id", "receipt_item_id", "po_id", "po_item_id"
]

const CAMEL_TO_DB: Record<string, string> = {
  isRead: "is_read",
  userId: "user_id",
  createdAt: "created_at",
  updatedAt: "updated_at",
  organizationId: "organization_id",
  ownerId: "owner_id",
  contactId: "contact_id",
  dealId: "deal_id",
  leadId: "lead_id",
  projectId: "project_id",
  taskId: "task_id",
  tagId: "tag_id",
  assigneeId: "assignee_id",
  createdById: "created_by_id",
  delegatedById: "delegated_by_id",
  delegatedAt: "delegated_at",
  completedAt: "completed_at",
  stepId: "step_id",
  authorId: "author_id",
  authorName: "author_name",
  attachmentUrl: "attachment_url",
  attachmentName: "attachment_name",
  attachmentType: "attachment_type",
  userName: "user_name",
  notificationEmail: "notification_email",
  emailNotificationsEnabled: "email_notifications_enabled",
  appName: "app_name",
  appLogoUrl: "app_logo_url",
  appTagline: "app_tagline",
  brandColor: "brand_color",
}

const DB_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_DB).map(([k, v]) => [v, k])
)

export function toSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnake(item))
  }
  if (obj !== null && typeof obj === "object") {
    const result: SnakeObject = {}
    for (const key in obj) {
      const mappedKey = CAMEL_TO_DB[key]
      const snakeKey =
        mappedKey || key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
      let value = obj[key]
      if (UUID_FIELDS.includes(snakeKey) && value === "") value = null
      result[snakeKey] = toSnake(value)
    }
    return result
  }
  return obj
}

export function toCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamel(item))
  }
  if (obj !== null && typeof obj === "object") {
    const result: CamelObject = {}
    for (const key in obj) {
      const mappedKey = DB_TO_CAMEL[key]
      const camelKey =
        mappedKey ||
        key.replace(/([-_][a-z])/g, (g) =>
          g.toUpperCase().replace("-", "").replace("_", "")
        )
      result[camelKey] = toCamel(obj[key])
    }
    return result
  }
  return obj
}

// ── Per-resource state shape ─────────────────────────────────────────────────

interface ResourceState<T> {
  data: T[]
  isLoaded: boolean
}

// ── Context value ────────────────────────────────────────────────────────────

export interface AtomicOp {
  resource: string
  action?: "insert" | "update"
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: Record<string, any>
}

export interface CRMContextValue {
  userId: string
  organizationId: string | null
  getResource: <T>(name: string) => ResourceState<T>
  setResourceData: <T>(name: string, updater: (prev: T[]) => T[]) => void
  getClient: () => Promise<typeof supabase | null>
  runAtomicUpdate: (ops: AtomicOp[]) => Promise<AtomicOp[]>
  fetchAuditLogs: (entityType: string, entityId: string) => Promise<any[]>
  fetchAllAuditLogs: () => Promise<any[]>
  insertAuditLog: (log: { entity_type: string, entity_id: string, action: string, diff?: any }) => Promise<void>
  fetchResource: (name: string, options?: { limit?: number; offset?: number; append?: boolean }) => Promise<void>
}

const CRMContext = createContext<CRMContextValue | null>(null)

// ── Audit actor resolver ──────────────────────────────────────────────────────
// changed_by stores the user's UID. We resolve display names from the app_users table via auth_user_id.

async function resolveAuditActors(client: any, logs: any[], currentUser?: any): Promise<any[]> {
  if (logs.length === 0) return logs

  // Collect unique auth UIDs from the logs
  const authIds = [...new Set(logs.map((l: any) => l.changedBy).filter(Boolean))]
  if (authIds.length === 0) return logs

  // In Project 2 (the active one), the table is app_users and it lacks an avatarurl column.
  // We match against both id and auth_user_id to be safe.
  const { data: users } = await client
    .from("app_users")
    .select("id, auth_user_id, name")
    .or(`id.in.(${authIds.map(id => `"${id}"`).join(',')}),auth_user_id.in.(${authIds.map(id => `"${id}"`).join(',')})`)

  const userMap: Record<string, { name: string, avatarUrl: string }> = {}
  
  // Initialize with current user if provided
  if (currentUser) {
    const profile = { 
      name: currentUser.user_metadata?.full_name || currentUser.email || "Me", 
      avatarUrl: currentUser.user_metadata?.avatar_url || "" 
    }
    userMap[currentUser.id] = profile
  }

  for (const u of (users ?? [])) {
    // Don't overwrite current user's rich metadata if we already have it
    if (userMap[u.id] && userMap[u.id].avatarUrl) continue;
    if (u.auth_user_id && userMap[u.auth_user_id] && userMap[u.auth_user_id].avatarUrl) continue;

    const profile = { name: u.name, avatarUrl: "" }
    userMap[u.id] = profile
    if (u.auth_user_id) userMap[u.auth_user_id] = profile
  }

  return logs.map((log: any) => ({
    ...log,
    changedBy: userMap[log.changedBy] ?? { name: "Unknown", avatarUrl: "" },
  }))
}

/**
 * calculateDiff — compares a patch against existing data to only log 
 * fields that actually changed. Prevents "UPDATE" logs from showing 
 * identical values for every field.
 */
function calculateDiff(oldItem: any, patch: any) {
  if (!oldItem) return patch
  const diff: any = {}
  const skip = ['id', 'createdAt', 'updatedAt', 'organizationId', 'userId', 'ownerId', 'activities', 'tags']
  
  const normalize = (v: any) => (v === "" || v === undefined || v === null) ? null : v

  Object.keys(patch).forEach(key => {
    if (skip.includes(key)) return
    
    const oldVal = normalize(oldItem[key])
    const newVal = normalize(patch[key])

    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      diff[key] = {
        from: oldItem[key],
        to: patch[key]
      }
    }
  })
  return diff
}

// ── Provider ─────────────────────────────────────────────────────────────────

const PRELOAD_RESOURCES = [
  "leads", "contacts", "deals", "tasks", "activities", "projects",
  "task_tags", "task_tag_links", "notifications", "users", "organizations",
]

/**
 * CRMContext provides a unified data layer for the CRM application.
 *
 * Authentication Integration:
 * - Uses useAuth() from AuthContext to get the authenticated user ID
 * - All data operations are scoped to the current user's ID for ownership tracking
 * - Supabase RLS policies use auth.uid() to filter data
 */
export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { userId, organizationId, isLoaded } = useAuth()
  const { user } = useUser()

  // Single map holding arrays for every resource
  const [store, setStore] = useState<Record<string, ResourceState<any>>>(() =>
    Object.fromEntries(
      Object.keys(TABLE_MAP).map((k) => [k, { data: [], isLoaded: false }])
    )
  )

  // Track which resources have already been fetched so we never double-fetch
  const fetchedRef = useRef<Set<string>>(new Set())

  // ── Supabase client factory ────────────────────────────────────────────────
  const getClient = useCallback(async () => {
    if (!userId) return null
    return supabase
  }, [userId])

  const FETCH_LIMIT = 1000

  // ── Fetch a single resource ────────────────────────────────────────────────
  const fetchResource = useCallback(
    async (name: string, options: { limit?: number; offset?: number; append?: boolean } = {}) => {
      const { limit = FETCH_LIMIT, offset = 0, append = false } = options

      // Only skip if we are doing a "full" fresh load and already have it
      if (!append && fetchedRef.current.has(name) && offset === 0) return
      if (!append) fetchedRef.current.add(name)

      const client = await getClient()
      if (!client) { 
        if (!append) fetchedRef.current.delete(name)
        return 
      }

      const tableName = TABLE_MAP[name]
      try {
        let query = client
          .from(tableName)
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (organizationId) query = query.eq('organization_id', organizationId)

        const { data: rows, error } = await query

        if (error) throw error

        const mapped = (rows ?? []).map((r: SnakeObject) => toCamel(r))
        
        setStore((prev) => ({
          ...prev,
          [name]: { 
            data: append ? [...(prev[name]?.data ?? []), ...mapped] : mapped, 
            isLoaded: true 
          },
        }))
      } catch (err) {
        logger.error(`[CRMContext] Failed to fetch ${name}:`, err)
        setStore((prev) => ({
          ...prev,
          [name]: { ...prev[name], isLoaded: true },
        }))
      }
    },
    [getClient, organizationId]
  )

  // ── Pre-fetch all primary resources once the user is ready ─────────────────
  useEffect(() => {
    if (!isLoaded || !userId) return
    PRELOAD_RESOURCES.forEach((r) => fetchResource(r))
  }, [isLoaded, userId, fetchResource])

  // ── Reset cache on user change (sign-out / switch account) ────────────────
  useEffect(() => {
    if (!userId) {
      fetchedRef.current.clear()
      setStore(
        Object.fromEntries(
          Object.keys(TABLE_MAP).map((k) => [k, { data: [], isLoaded: false }])
        )
      )
    }
  }, [userId])

  // ── Public helpers ─────────────────────────────────────────────────────────
  const getResource = useCallback(
    <T,>(name: string): ResourceState<T> => {
      // Lazily fetch resources that weren't in the preload list
      if (!fetchedRef.current.has(name) && userId) {
        fetchResource(name)
      }
      return (store[name] ?? { data: [], isLoaded: false }) as ResourceState<T>
    },
    [store, fetchResource, userId]
  )
  const setResourceData = useCallback(
    <T,>(name: string, updater: (prev: T[]) => T[]) => {
      setStore((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          data: updater(prev[name]?.data ?? []),
        },
      }))
    },
    []
  )

  const runAtomicUpdate = useCallback(
    async (ops: AtomicOp[]) => {
      const client = await getClient()
      if (!client) throw new Error("Not authenticated")

      const errors: Array<{ resource: string; id?: string; error: unknown }> = []
      const successes: Array<AtomicOp & { action: "insert" | "update" }> = []
      const auditLogs: any[] = []

      // 1. Build Payload Phase
      const rpcPayload: any[] = []

      for (const op of ops) {
        const action = op.action ?? "update"
        const tableName = TABLE_MAP[op.resource]
        if (!tableName) {
          errors.push({ resource: op.resource, error: new Error(`Unknown resource: ${op.resource}`) })
          continue
        }

        const snakePatch = toSnake(op.patch)
        const isTask = op.resource === 'tasks'
        let nestedData: any = {}

        if (isTask) {
          // Extract nested relational data before sending to 'tasks' table
          ['activities', 'tags'].forEach(f => {
            if (snakePatch[f] !== undefined) {
              nestedData[f] = op.patch[f] // Keep original camelCase data for easier secondary processing
              delete snakePatch[f]
            }
          })
        }

        if (action === "insert") {
          const noUserIdTables = ['task_tags', 'task_tag_links', 'task_subtasks', 'task_comments', 'purchase_receipt_items']
          const ownerIdTables = ['tasks', 'task_tags', 'projects', 'leads', 'contacts', 'deals', 'vendors', 'purchase_requests']

          if (!noUserIdTables.includes(op.resource) && !snakePatch.user_id) {
            snakePatch.user_id = userId
          }
          if (ownerIdTables.includes(op.resource) && !snakePatch.owner_id) {
            snakePatch.owner_id = userId
          }

          // Auto-stamp organization_id on ALL inserts
          if (!snakePatch.organization_id && organizationId) {
            snakePatch.organization_id = organizationId
          }

          // Generate an ID client-side so we can link relational data immediately
          if (!snakePatch.id) {
            snakePatch.id = crypto.randomUUID()
          }

          rpcPayload.push({
            table: tableName,
            action: 'insert',
            data: snakePatch
          })

          const created = toCamel(snakePatch)
          successes.push({ ...op, action, patch: created })

          // Audit log insert
          auditLogs.push({
            entity_type: op.resource,
            entity_id: snakePatch.id,
            action: "INSERT",
            changed_by: userId,
            organization_id: organizationId,
            diff: { new: created }
          })
          
          if (isTask) {
             (op as any)._nestedData = nestedData;
             (op as any)._resolvedId = snakePatch.id;
          }

        } else if (action === "update") {
          rpcPayload.push({
            table: tableName,
            action: 'update',
            id: op.id,
            data: snakePatch
          })

          successes.push({ ...op, action })

          // Audit log update
          const oldItem = getResource<any>(op.resource).data.find(i => i.id === op.id)
          const diff = calculateDiff(oldItem, op.patch)

          auditLogs.push({
            entity_type: op.resource,
            entity_id: op.id,
            action: "UPDATE",
            changed_by: userId,
            organization_id: organizationId,
            diff: { updates: diff }
          })
          
          if (isTask) {
             (op as any)._nestedData = nestedData;
             (op as any)._resolvedId = op.id;
          }
        }
      }

      if (errors.length > 0) {
        logger.error("[CRMContext] Atomic update payload build failed:", errors)
        throw new Error(`Atomic update failed with ${errors.length} errors during build phase.`)
      }

      // 2. Database Transaction Phase
      if (rpcPayload.length > 0) {
        const { error: rpcError } = await client.rpc('execute_transaction', { operations: rpcPayload })
        if (rpcError) {
          logger.error("[CRMContext] RPC execute_transaction failed:", rpcError)
          throw new Error(`Database transaction failed: ${rpcError.message}`)
        }
      }

      // Process secondary relations now that the transaction is committed
      for (const op of successes) {
        if ((op as any)._nestedData) {
          await handleTaskRelations(client, (op as any)._resolvedId, (op as any)._nestedData, op.action === 'update')
        }
      }

      // Emit audit logs in background
      if (auditLogs.length > 0) {
        client.from('audit_log').insert(auditLogs).then(({ error }: any) => {
          if (error) logger.error("[CRMContext] Failed to emit audit logs:", error)
        })
      }

      // 2. React state Phase: Only runs if all DB calls succeeded
      successes.forEach((op) => {
        if (op.action === "update") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResourceData(op.resource, (prev: any[]) =>
            prev.map((item) => (item.id === op.id ? { ...item, ...op.patch } : item))
          )
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResourceData(op.resource, (prev: any[]) => [op.patch, ...prev])
        }
      })
      return successes
    },
    [getClient, setResourceData, userId, organizationId]
  )

  const fetchAuditLogs = useCallback(
    async (entityType: string, entityId: string) => {
      const client = await getClient()
      if (!client) return []
      const { data, error } = await client
        .from("audit_log")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("changed_at", { ascending: false })

      if (error) {
        logger.error("[CRMContext] fetchAuditLogs error:", error)
        return []
      }
      return resolveAuditActors(client, toCamel(data || []), user)
    },
    [getClient, user]
  )

  const fetchAllAuditLogs = useCallback(
    async () => {
      const client = await getClient()
      if (!client) return []
      const { data, error } = await client
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(200)

      if (error) {
        logger.error("[CRMContext] fetchAllAuditLogs error:", error)
        return []
      }
      return resolveAuditActors(client, toCamel(data || []), user)
    },
    [getClient, user]
  )

  const insertAuditLog = useCallback(
    async (log: { entity_type: string, entity_id: string, action: string, diff?: any }) => {
      const client = await getClient()
      if (!client || !userId || !organizationId) return

      const { error } = await client.from('audit_log').insert({
        ...log,
        changed_by: userId,
        organization_id: organizationId,
      })

      if (error) {
        logger.error("[CRMContext] insertAuditLog error:", error)
      }
    },
    [getClient, userId, organizationId]
  )

  return (
    <CRMContext.Provider value={{ userId, organizationId, getResource, setResourceData, getClient, runAtomicUpdate, fetchAuditLogs, fetchAllAuditLogs, insertAuditLog, fetchResource }}>
      {children}
    </CRMContext.Provider>
  )
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useCRMContext() {
  const ctx = useContext(CRMContext)
  if (!ctx) throw new Error("useCRMContext must be used inside <CRMProvider>")
  return ctx
}

// ── Typed mutation helpers (used by useCRMResource) ───────────────────────────

export async function insertRows<T extends { id?: string }>(
  ctx: CRMContextValue,
  resourceName: string,
  newItems: T[]
): Promise<T[]> {
  const client = await ctx.getClient()
  if (!client) throw new Error("Not authenticated")

  const tableName = TABLE_MAP[resourceName]
  const rows = newItems.map((item) => {
    const row = toSnake(item)
    if (resourceName === 'tasks') {
      ['activities', 'tags'].forEach(f => delete row[f])
    }

    const noUserIdTables = ['task_tags', 'task_tag_links', 'task_subtasks', 'task_comments', 'purchase_receipt_items']
    const ownerIdTables = ['tasks', 'task_tags', 'projects', 'leads', 'contacts', 'deals', 'vendors', 'purchase_requests']

    if (!noUserIdTables.includes(resourceName) && !row.user_id) {
      row.user_id = ctx.userId
    }
    if (ownerIdTables.includes(resourceName) && !row.owner_id) {
      row.owner_id = ctx.userId
    }

    // Auto-stamp organization_id on ALL inserts
    if (!row.organization_id && ctx.organizationId) {
      row.organization_id = ctx.organizationId
    }

    // Always delete id so the database generates it (avoids UUID conflicts)
    delete row.id
    return row
  })

  const { data: result, error } = await client.from(tableName).insert(rows).select()
  if (error) {
    logger.error(`[CRMContext] Batch insert failed for ${resourceName}:`, error)
    throw error
  }

  const mapped = (result ?? []).map(toCamel) as T[]

  // Audit Logging
  if (mapped.length > 0 && resourceName !== 'notifications') {
    const auditLogs = mapped.map(item => ({
      entity_type: resourceName,
      entity_id: item.id!,
      action: "INSERT",
      changed_by: ctx.userId,
      organization_id: ctx.organizationId,
      diff: { new: item }
    }))
    client.from('audit_log').insert(auditLogs).then(({ error }: any) => {
      if (error) logger.error("[CRMContext] Failed to emit audit logs:", error)
    })
  }

  // Task-specific post-processing for relations
  if (resourceName === 'tasks') {
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i] as any
      const resultItem = mapped[i]
      if (!resultItem) continue

      await handleTaskRelations(client, resultItem.id!, {
        activities: item.activities,
        tags: item.tags
      })
    }
  }

  ctx.setResourceData(resourceName, (prev: T[]) => [...mapped, ...prev])
  return mapped
}

/**
 * Shared helper to manage task-related records in secondary tables
 */
async function handleTaskRelations(client: any, taskId: string, data: any, isUpdate = false) {
  // 1. Handle Tags (Sync)
  if (data.tags !== undefined) {
    if (isUpdate) {
      await client.from('task_tag_links').delete().eq('task_id', taskId)
    }
    const tags = data.tags || []
    if (tags.length > 0) {
      const links = tags.map((tagId: string) => ({ task_id: taskId, tag_id: tagId }))
      await client.from('task_tag_links').insert(links)
    }
  }

  // 2. Handle Activities / Logs (Additive/Managed)
  if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
    const activities = data.activities.map((a: any) => {
      const row = toSnake(a)
      row.task_id = taskId
      if (row.id && row.id.length < 10) delete row.id // Clean temporary IDs
      return row
    })
    await client.from('task_activities').insert(activities)
  }

}

export async function updateRow<T extends { id: string }>(
  ctx: CRMContextValue,
  resourceName: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const client = await ctx.getClient()
  if (!client) throw new Error("Not authenticated")

  const tableName = TABLE_MAP[resourceName]
  const snakePatch = toSnake(updates)
  const isTask = resourceName === 'tasks'
  let nestedData: any = {}

  if (isTask) {
    ['activities', 'tags'].forEach(f => {
      if (snakePatch[f] !== undefined) {
        nestedData[f] = (updates as any)[f]
        delete snakePatch[f]
      }
    })
  }

  const { error } = await client.from(tableName).update(snakePatch).eq("id", id)
  if (error) {
    logger.error(`[CRMContext] Update failed for ${resourceName}:${id}:`, error)
    throw error
  }

  // Audit Logging
  const oldItem = ctx.getResource<T>(resourceName).data.find(i => i.id === id)
  const diff = calculateDiff(oldItem, updates)

  client.from('audit_log').insert({
    entity_type: resourceName,
    entity_id: id,
    action: "UPDATE",
    changed_by: ctx.userId,
    organization_id: ctx.organizationId,
    diff: { updates: diff }
  }).then(({ error }: any) => {
    if (error) logger.error("[CRMContext] Failed to emit audit log:", error)
  })

  if (isTask) {
    await handleTaskRelations(client, id, nestedData, true)
  }

  ctx.setResourceData(resourceName, (prev: T[]) =>
    prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
  )
}

export async function deleteRow<T extends { id: string }>(
  ctx: CRMContextValue,
  resourceName: string,
  id: string
): Promise<void> {
  const client = await ctx.getClient()
  if (!client) throw new Error("Not authenticated")

  const tableName = TABLE_MAP[resourceName]
  const { error } = await client.from(tableName).delete().eq("id", id)
  if (error) throw error

  // Audit Logging
  client.from('audit_log').insert({
    entity_type: resourceName,
    entity_id: id,
    action: "DELETE",
    changed_by: ctx.userId,
    organization_id: ctx.organizationId,
    diff: { id }
  }).then(({ error }: any) => {
    if (error) logger.error("[CRMContext] Failed to emit audit log:", error)
  })

  ctx.setResourceData(resourceName, (prev: T[]) => prev.filter((item) => item.id !== id))
}
