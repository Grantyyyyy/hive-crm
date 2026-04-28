import { useEffect, useRef, useCallback } from "react"
import { useCRMResource } from "@/lib/hooks"
import type { InventoryItem, Notification } from "@/lib/types"
import { toast } from "sonner"

export function useInventoryAlerts() {
  const { data: inventory, isLoaded: inventoryLoaded } = useCRMResource<InventoryItem>('inventory')
  const { data: notifications, addItems, isLoaded: notificationsLoaded } = useCRMResource<Notification>('notifications')
  
  // Stable refs to avoid re-triggering the effect when notifications/addItems change
  const notificationsRef = useRef(notifications)
  notificationsRef.current = notifications

  const addItemsRef = useRef(addItems)
  addItemsRef.current = addItems

  // Track which items we've already alerted about in this session
  const alertedItemsRef = useRef<Set<string>>(new Set())
  // Track last known stock levels to detect actual changes
  const lastStockRef = useRef<Map<string, number>>(new Map())

  // Stable callback that reads from refs
  const processAlerts = useCallback(async (items: InventoryItem[]) => {
    for (const item of items) {
      if (item.status !== 'active') continue
      
      const threshold = item.reorderThreshold ?? 0
      if (threshold <= 0) continue

      const currentStock = item.stockQuantity
      const previousStock = lastStockRef.current.get(item.id)
      const isBelowThreshold = currentStock <= threshold

      // Update tracked stock level
      lastStockRef.current.set(item.id, currentStock)

      // If above threshold, clear the alert flag so future dips re-trigger
      if (!isBelowThreshold) {
        alertedItemsRef.current.delete(item.id)
        continue
      }

      // Detect if stock actually changed or this is initial load
      const stockChanged = previousStock === undefined || previousStock !== currentStock
      const wasAlreadyAlerted = alertedItemsRef.current.has(item.id)

      // Skip if we already alerted and stock hasn't changed since
      if (wasAlreadyAlerted && !stockChanged) continue

      // Determine severity
      const isOutOfStock = currentStock === 0
      const alertType = isOutOfStock ? 'out_of_stock' : 'low_stock'
      const alertTitle = item.sku

      // Check for existing notification in the last 24 hours with same title
      const currentNotifications = notificationsRef.current
      const existingNotification = currentNotifications.find(n =>
        n.title === alertTitle &&
        (Date.now() - new Date(n.createdAt).getTime() < 24 * 60 * 60 * 1000)
      )

      if (existingNotification) {
        alertedItemsRef.current.add(item.id)
        continue
      }

      const message = `**${item.name}** is currently at ${currentStock} units (threshold: ${threshold}).`

      try {
        await addItemsRef.current([{
          userId: '',
          type: alertType,
          title: alertTitle,
          message,
          link: `/inventory/${item.id}`,
          isRead: false,
          createdAt: new Date().toISOString()
        } as any], true)

        // Only mark as alerted AFTER a successful insert
        alertedItemsRef.current.add(item.id)

        toast.error(alertTitle, {
          description: message,
          duration: 8000,
          action: {
            label: "View",
            onClick: () => window.location.hash = `#/inventory/${item.id}`
          }
        })

        console.log(`[InventoryAlerts] Alert created: ${alertTitle}`)
      } catch (err) {
        console.error(`[InventoryAlerts] Failed to create alert for ${item.sku}:`, err)
        // Don't mark as alerted — allow retry on next cycle
      }
    }
  }, [])

  // Only re-run when inventory data actually changes
  useEffect(() => {
    if (!inventoryLoaded || !notificationsLoaded) return
    processAlerts(inventory)
  }, [inventory, inventoryLoaded, notificationsLoaded, processAlerts])
}
