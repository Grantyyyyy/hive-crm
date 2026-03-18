import { useState, useMemo, useCallback } from "react"
import { useUser } from "@clerk/clerk-react"
import * as storage from "./storage"

/**
 * Generic hook to manage a CRM resource (Leads, Contacts, Deals, Tasks, Activities)
 */
export function useCRMResource<T extends { id: string }>(
  resourceName: 'leads' | 'contacts' | 'deals' | 'tasks' | 'activities' | 'orders' | 'quotes' | 'inventory' | 'purchase_orders' | 'purchase_requests',
  initialSearch: string = ""
) {
  const { user, isLoaded } = useUser()
  const userId = user?.id ?? ""

  // Fetch logic based on resource name
  const getResourceData = useCallback(() => {
    if (!userId) return []
    switch (resourceName) {
      case 'leads': return storage.getLeads(userId) as unknown as T[]
      case 'contacts': return storage.getContacts(userId) as unknown as T[]
      case 'deals': return storage.getDeals(userId) as unknown as T[]
      case 'tasks': return storage.getTasks(userId) as unknown as T[]
      case 'activities': return storage.getActivities(userId) as unknown as T[]
      case 'orders': return storage.getOrders(userId) as unknown as T[]
      case 'quotes': return storage.getQuotes(userId) as unknown as T[]
      case 'inventory': return storage.getInventory(userId) as unknown as T[]
      case 'purchase_orders': return storage.getPurchaseOrders(userId) as unknown as T[]
      case 'purchase_requests': return storage.getPurchaseRequests(userId) as unknown as T[]
      default: return []
    }
  }, [userId, resourceName])

  const saveResourceData = useCallback((data: T[]) => {
    if (!userId) return
    switch (resourceName) {
      case 'leads': return storage.saveLeads(userId, data as any)
      case 'contacts': return storage.saveContacts(userId, data as any)
      case 'deals': return storage.saveDeals(userId, data as any)
      case 'tasks': return storage.saveTasks(userId, data as any)
      case 'activities': return storage.saveActivities(userId, data as any)
      case 'orders': return storage.saveOrders(userId, data as any)
      case 'quotes': return storage.saveQuotes(userId, data as any)
      case 'inventory': return storage.saveInventory(userId, data as any)
      case 'purchase_orders': return storage.savePurchaseOrders(userId, data as any)
      case 'purchase_requests': return storage.savePurchaseRequests(userId, data as any)
    }
  }, [userId, resourceName])


  const [data, setData] = useState<T[]>(() => getResourceData())
  const [search, setSearch] = useState(initialSearch)

  // Sync data if userId changes (e.g. after login)
  useMemo(() => {
    if (isLoaded && userId) {
      setData(getResourceData())
    }
  }, [isLoaded, userId, getResourceData])

  const addItems = useCallback((newItems: T[]) => {
    const updated = [...data, ...newItems]
    saveResourceData(updated)
    setData(updated)
  }, [data, saveResourceData])

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const updated = data.map(item => item.id === id ? { ...item, ...updates } : item)
    saveResourceData(updated)
    setData(updated)
  }, [data, saveResourceData])

  const deleteItem = useCallback((id: string) => {
    const updated = data.filter(item => item.id !== id)
    saveResourceData(updated)
    setData(updated)
  }, [data, saveResourceData])

  return {
    data,
    setData,
    search,
    setSearch,
    userId,
    isLoaded,
    addItems,
    updateItem,
    deleteItem,
    refresh: () => setData(getResourceData())
  }
}
