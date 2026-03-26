import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useSession, useUser } from "@clerk/clerk-react"
import { createClerkSupabaseClient } from "./supabaseClient"

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
}

// ── Case converters ──────────────────────────────────────────────────────────

type SnakeObject = Record<string, any>
type CamelObject = Record<string, any>

const UUID_FIELDS = [
  "contact_id", "deal_id", "lead_id", "entity_id",
  "converted_to_contact_id", "converted_to_deal_id",
  "customer_id", "vendor_id",
]

export function toSnake(obj: CamelObject): SnakeObject {
  const result: SnakeObject = {}
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
    let value = obj[key]
    if (UUID_FIELDS.includes(snakeKey) && value === "") value = null
    result[snakeKey] = value
  }
  return result
}

export function toCamel(obj: SnakeObject): CamelObject {
  const result: CamelObject = {}
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, (g) =>
      g.toUpperCase().replace("-", "").replace("_", "")
    )
    result[camelKey] = obj[key]
  }
  return result
}

// ── Per-resource state shape ─────────────────────────────────────────────────

interface ResourceState<T> {
  data: T[]
  isLoaded: boolean
}

// ── Context value ────────────────────────────────────────────────────────────

interface CRMContextValue {
  userId: string
  getResource: <T>(name: string) => ResourceState<T>
  setResourceData: <T>(name: string, updater: (prev: T[]) => T[]) => void
  getClient: () => Promise<ReturnType<typeof createClerkSupabaseClient> | null>
}

const CRMContext = createContext<CRMContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

const PRELOAD_RESOURCES = [
  "leads", "contacts", "deals", "tasks", "activities",
]

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { session } = useSession()
  const userId = user?.id ?? ""

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
    if (!session) return null
    const token = await session.getToken({ template: "supabase" })
    if (!token) return null
    return createClerkSupabaseClient(token)
  }, [session])

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
    if (!userLoaded || !userId || !session) return
    PRELOAD_RESOURCES.forEach((r) => fetchResource(r))
  }, [userLoaded, userId, session, fetchResource])

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
      if (!fetchedRef.current.has(name) && userId && session) {
        fetchResource(name)
      }
      return (store[name] ?? { data: [], isLoaded: false }) as ResourceState<T>
    },
    [store, fetchResource, userId, session]
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

  return (
    <CRMContext.Provider value={{ userId, getResource, setResourceData, getClient }}>
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
    row.user_id = ctx.userId
    if (!row.id || row.id === "0") delete row.id
    return row
  })

  const { data: result, error } = await client.from(tableName).insert(rows).select()
  if (error) throw error

  const mapped = (result ?? []).map(toCamel) as T[]
  ctx.setResourceData(resourceName, (prev: T[]) => [...mapped, ...prev])
  return mapped
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
  const { error } = await client.from(tableName).update(toSnake(updates)).eq("id", id)
  if (error) throw error

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
