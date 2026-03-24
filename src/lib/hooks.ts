import { useState, useCallback, useEffect } from "react"
import { useUser, useSession } from "@clerk/clerk-react"
import { createClerkSupabaseClient } from "./supabaseClient"
import { toast } from "sonner"

// Resource to Table mapping
const TABLE_MAP: Record<string, string> = {
  'leads': 'leads',
  'contacts': 'contacts',
  'deals': 'deals',
  'tasks': 'tasks',
  'activities': 'activities',
  'orders': 'sales_orders',
  'quotes': 'quotes',
  'inventory': 'inventory',
  'purchase_orders': 'purchase_orders',
  'purchase_requests': 'purchase_requests'
}

type SnakeObject = Record<string, any>
type CamelObject = Record<string, any>

function toSnake(obj: CamelObject): SnakeObject {
  const result: SnakeObject = {}
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = obj[key]
  }
  return result
}

function toCamel(obj: SnakeObject): CamelObject {
  const result: CamelObject = {}
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
    result[camelKey] = obj[key]
  }
  return result
}

/**
 * Generic hook to manage a CRM resource (Leads, Contacts, Deals, Tasks, Activities)
 */
export function useCRMResource<T extends { id: string }>(
  resourceName: keyof typeof TABLE_MAP,
  initialSearch: string = ""
) {
  const { user, isLoaded: userLoaded } = useUser()
  const { session } = useSession()
  const userId = user?.id ?? ""
  const tableName = TABLE_MAP[resourceName]

  const [data, setData] = useState<T[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [search, setSearch] = useState(initialSearch)

  const fetchResourceData = useCallback(async () => {
    if (!session || !userId) return
    
    try {
      const token = await session.getToken({ template: 'supabase' })
      if (!token) {
        console.warn("No Supabase JWT template found in Clerk dashboard. Ensure template 'supabase' exists.")
        return
      }
      
      const supabase = createClerkSupabaseClient(token)
      const { data: result, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (supabaseError) throw supabaseError
      
      setData((result || []).map((row: SnakeObject) => toCamel(row) as T))
      setIsLoaded(true)
    } catch (err: any) {
      console.error(`Error fetching ${resourceName}:`, err)
      setError(err)
      setIsLoaded(true)
    }
  }, [session, userId, tableName, resourceName])

  useEffect(() => {
    if (userLoaded && userId && session) {
      fetchResourceData()
    }
  }, [userLoaded, userId, session, fetchResourceData])

  const addItems = useCallback(async (newItems: T[]) => {
    if (!session || !userId) return
    
    const promise = (async () => {
      const token = await session.getToken({ template: 'supabase' })
      const supabase = createClerkSupabaseClient(token!)
      
      const itemsToInsert = newItems.map(item => {
        const row = toSnake(item)
        row.user_id = userId
        if (!row.id || row.id === "0") delete row.id
        return row
      })

      const { data: result, error: insertError } = await supabase
        .from(tableName)
        .insert(itemsToInsert)
        .select()
      
      if (insertError) throw insertError
      
      if (result) {
        const mapped = result.map(toCamel) as T[]
        setData(prev => [...mapped, ...prev])
        return mapped
      } else {
        await fetchResourceData()
      }
    })()

    toast.promise(promise, {
      loading: `Saving ${resourceName}...`,
      success: `Successfully added to ${resourceName}`,
      error: `Failed to add to ${resourceName}`
    })

    return promise
  }, [session, userId, tableName, resourceName, fetchResourceData])

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    if (!session || !userId) return
    
    const promise = (async () => {
      const token = await session.getToken({ template: 'supabase' })
      const supabase = createClerkSupabaseClient(token!)
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update(toSnake(updates))
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
    })()

    toast.promise(promise, {
      loading: `Updating ${resourceName}...`,
      success: `Successfully updated ${resourceName}`,
      error: `Failed to update ${resourceName}`
    })

    return promise
  }, [session, userId, tableName, resourceName])

  const deleteItem = useCallback(async (id: string) => {
    if (!session || !userId) return
    
    const promise = (async () => {
      const token = await session.getToken({ template: 'supabase' })
      const supabase = createClerkSupabaseClient(token!)
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      setData(prev => prev.filter(item => item.id !== id))
    })()

    toast.promise(promise, {
      loading: `Deleting from ${resourceName}...`,
      success: `Successfully removed from ${resourceName}`,
      error: `Failed to delete from ${resourceName}`
    })

    return promise
  }, [session, userId, tableName, resourceName])

  return {
    data,
    setData,
    search,
    setSearch,
    userId,
    isLoaded,
    error,
    addItems,
    updateItem,
    deleteItem,
    refresh: fetchResourceData
  }
}
