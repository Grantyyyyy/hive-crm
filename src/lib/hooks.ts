import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  useCRMContext,
  insertRows,
  updateRow,
  deleteRow,
  TABLE_MAP,
} from "./CRMContext"

/**
 * useCRMResource — same public API as before, but now backed by the shared
 * CRMContext cache. Data is fetched once per session (in CRMProvider) and
 * reused across every page. No more re-fetches on navigation.
 */
export function useCRMResource<T extends { id: string }>(
  resourceName: keyof typeof TABLE_MAP,
  initialSearch: string = ""
) {
  const ctx = useCRMContext()
  const { data, isLoaded } = ctx.getResource<T>(String(resourceName))
  const [search, setSearch] = useState(initialSearch)

  const addItems = useCallback(
    async (newItems: T[], silent: boolean = false) => {
      const promise = insertRows<T>(ctx, String(resourceName), newItems)
      if (!silent) {
        toast.promise(promise, {
          loading: `Saving ${resourceName}...`,
          success: `Successfully added to ${resourceName}`,
          error: `Failed to add to ${resourceName}`,
        })
      }
      return promise
    },
    [ctx, resourceName]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>, silent: boolean = false) => {
      // Optimistic update — apply to cache immediately, then persist
      ctx.setResourceData<T>(String(resourceName), (prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
      const promise = updateRow<T>(ctx, String(resourceName), id, updates)
      if (!silent) {
        toast.promise(promise, {
          loading: `Updating ${resourceName}...`,
          success: `Successfully updated ${resourceName}`,
          error: `Failed to update ${resourceName}`,
        })
      }
      return promise
    },
    [ctx, resourceName]
  )

  const deleteItem = useCallback(
    async (id: string, silent: boolean = false) => {
      const promise = deleteRow<T>(ctx, String(resourceName), id)
      if (!silent) {
        toast.promise(promise, {
          loading: `Deleting from ${resourceName}...`,
          success: `Successfully removed from ${resourceName}`,
          error: `Failed to delete from ${resourceName}`,
        })
      }
      return promise
    },
    [ctx, resourceName]
  )

  return {
    data,
    setData: (updater: (prev: T[]) => T[]) =>
      ctx.setResourceData<T>(String(resourceName), updater),
    search,
    setSearch,
    userId: ctx.userId,
    isLoaded,
    error: null,
    addItems,
    updateItem,
    deleteItem,
    refresh: () => { }, // no-op — data is managed by the provider
  }
}

