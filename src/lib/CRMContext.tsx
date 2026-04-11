import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useAuth } from "./AuthContext"
import { supabase } from "./supabaseClient"

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

export function toSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnake(item))
  }
  if (obj !== null && typeof obj === 'object') {
    const result: SnakeObject = {}
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
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
    return obj.map(item => toCamel(item))
  }
  if (obj !== null && typeof obj === 'object') {
    const result: CamelObject = {}
    for (const key in obj) {
      const camelKey = key.replace(/([-_][a-z])/g, (g) =>
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
  getResource: <T>(name: string) => ResourceState<T>
  setResourceData: <T>(name: string, updater: (prev: T[]) => T[]) => void
  getClient: () => Promise<typeof supabase | null>
  runAtomicUpdate: (ops: AtomicOp[]) => Promise<AtomicOp[]>
}

const CRMContext = createContext<CRMContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

const PRELOAD_RESOURCES = [
  "leads", "contacts", "deals", "tasks", "activities", "projects",
  "task_tags", "task_tag_links",
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
  const { userId, isLoaded } = useAuth()

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

  // ── Fetch a single resource ────────────────────────────────────────────────
  const fetchResource = useCallback(
    async (name: string) => {
      if (fetchedRef.current.has(name)) return
      fetchedRef.current.add(name)

      const client = await getClient()
      if (!client) { fetchedRef.current.delete(name); return }

      const tableName = TABLE_MAP[name]
      try {
        const { data: rows, error } = await client
          .from(tableName)
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        const mapped = (rows ?? []).map((r: SnakeObject) => toCamel(r))
        setStore((prev) => ({
          ...prev,
          [name]: { data: mapped, isLoaded: true },
        }))
      } catch (err) {
        console.error(`[CRMContext] Failed to fetch ${name}:`, err)
        setStore((prev) => ({
          ...prev,
          [name]: { ...prev[name], isLoaded: true },
        }))
      }
    },
    [getClient]
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

      // 1. Database Phase
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
          const ownerIdTables = ['tasks', 'task_tags', 'projects', 'leads', 'contacts', 'deals']

          if (!noUserIdTables.includes(op.resource) && !snakePatch.user_id) {
            snakePatch.user_id = userId
          }
          if (ownerIdTables.includes(op.resource) && !snakePatch.owner_id) {
            snakePatch.owner_id = userId
          }

          const { data, error } = await client.from(tableName).insert(snakePatch).select()
          if (error) {
            console.error(`[CRMContext] Insert failed for ${op.resource}:`, error)
            errors.push({ resource: op.resource, error })
          } else {
            const resultItem = data?.[0]
            if (isTask && resultItem) {
              // Handle secondary relational inserts for tasks
              await handleTaskRelations(client, resultItem.id, nestedData)
            }
            const created = toCamel(resultItem || {})
            successes.push({ ...op, action, patch: created })
          }
        } else if (action === "update") {
          const { error } = await client.from(tableName).update(snakePatch).eq("id", op.id)
          if (error) {
            console.error(`[CRMContext] Update failed for ${op.resource}:${op.id}:`, error)
            errors.push({ resource: op.resource, id: op.id, error })
          } else {
            if (isTask) {
              // Sync relational data (tags etc) if provided in the patch
              await handleTaskRelations(client, op.id as string, nestedData, true)
            }
            successes.push({ ...op, action })
          }
        }
      }

      if (errors.length > 0) {
        console.error("[CRMContext] Atomic update failed:", errors)
        throw new Error(`Atomic update failed with ${errors.length} errors. Local state not committed.`)
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
    [getClient, setResourceData, userId]
  )

  return (
    <CRMContext.Provider value={{ userId, getResource, setResourceData, getClient, runAtomicUpdate }}>
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

export async function insertRows<T extends { id: string }>(
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
    const ownerIdTables = ['tasks', 'task_tags', 'projects', 'leads', 'contacts', 'deals']

    if (!noUserIdTables.includes(resourceName) && !row.user_id) {
      row.user_id = ctx.userId
    }
    if (ownerIdTables.includes(resourceName) && !row.owner_id) {
      row.owner_id = ctx.userId
    }

    // Always delete id so the database generates it (avoids UUID conflicts)
    delete row.id
    return row
  })

  const { data: result, error } = await client.from(tableName).insert(rows).select()
  if (error) {
    console.error(`[CRMContext] Batch insert failed for ${resourceName}:`, error)
    throw error
  }

  const mapped = (result ?? []).map(toCamel) as T[]

  // Task-specific post-processing for relations
  if (resourceName === 'tasks') {
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i] as any
      const resultItem = mapped[i]
      if (!resultItem) continue

      await handleTaskRelations(client, resultItem.id, {
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
    console.error(`[CRMContext] Update failed for ${resourceName}:${id}:`, error)
    throw error
  }

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

  ctx.setResourceData(resourceName, (prev: T[]) => prev.filter((item) => item.id !== id))
}
