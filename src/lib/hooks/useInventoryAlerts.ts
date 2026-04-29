import { useEffect, useRef, useCallback } from "react"
import { useLocation } from "wouter"
import { useCRMResource } from "@/lib/hooks"
import type { InventoryItem, Notification } from "@/lib/types"
import { toast } from "sonner"

import { useAuth, useUser } from "@/lib/AuthContext"

export function useInventoryAlerts() {
  const { data: inventory, isLoaded: inventoryLoaded } = useCRMResource<InventoryItem>('inventory')
  const { data: notifications, addItems, isLoaded: notificationsLoaded } = useCRMResource<Notification>('notifications')
  const [, setLocation] = useLocation()
  const { user } = useUser()
  
  // Stable refs to avoid re-triggering the effect when notifications/addItems change
  const notificationsRef = useRef(notifications)
  notificationsRef.current = notifications

  const addItemsRef = useRef(addItems)
  addItemsRef.current = addItems

  const userIdRef = useRef(user?.id)
  userIdRef.current = user?.id

  // Track which items we've already alerted about in this session
  const alertedItemsRef = useRef<Set<string>>(new Set())
  // Track last known stock levels to detect actual changes
  const lastStockRef = useRef<Map<string, number>>(new Map())

  // Stable callback that reads from refs
  const processAlerts = useCallback(async (items: InventoryItem[]) => {
    const currentUserId = userIdRef.current
    if (!currentUserId) return // Don't alert if not logged in

    for (const item of items) {
      if (item.status !== 'active') continue
      
      const threshold = item.reorderThreshold ?? 10 // Default to 10 if not set
      
      const currentStock = item.stockQuantity
      const previousStock = lastStockRef.current.get(item.id)
      const isBelowThreshold = currentStock <= threshold

      if (previousStock !== undefined && previousStock !== currentStock) {
        console.log(`[InventoryAlerts] Stock changed for ${item.sku}: ${previousStock} -> ${currentStock} (threshold: ${threshold})`)
      }

      // Update tracked stock level
      lastStockRef.current.set(item.id, currentStock)

      // If above threshold, clear the alert flag so future dips re-trigger
      if (!isBelowThreshold) {
        alertedItemsRef.current.delete(item.id)
        continue
      }

      // Detect if stock actually changed during this session (not initial load)
      const isInitialLoad = previousStock === undefined
      const stockChanged = !isInitialLoad && previousStock !== currentStock
      const wasAlreadyAlerted = alertedItemsRef.current.has(item.id)

      // Determine severity and title early (needed for dedup checks)
      const isOutOfStock = currentStock === 0
      const alertType = isOutOfStock ? 'out_of_stock' : 'low_stock'
      const alertTitle = item.sku

      // On initial load, just record the stock level and check for existing alerts
      // On stock change, allow re-alerting if previous alert was read
      if (isInitialLoad) {
        // Check for ANY recent notification (read or unread) to avoid duplicates on refresh
        const currentNotifications = notificationsRef.current
        const hasRecentAlert = currentNotifications.some(n =>
          n.title === alertTitle &&
          (Date.now() - new Date(n.createdAt).getTime() < 60 * 60 * 1000)
        )
        if (hasRecentAlert) {
          alertedItemsRef.current.add(item.id)
        }
        continue
      }

      // Skip if we already alerted and stock hasn't changed since
      if (wasAlreadyAlerted && !stockChanged) continue
      if (!stockChanged) continue

      // Only skip if there's an unread notification for the same item within the last hour.
      // Read/dismissed notifications don't block new alerts from fresh stock changes.
      const currentNotifications = notificationsRef.current
      const existingUnread = currentNotifications.find(n =>
        n.title === alertTitle &&
        !n.isRead &&
        (Date.now() - new Date(n.createdAt).getTime() < 60 * 60 * 1000)
      )

      if (existingUnread) {
        alertedItemsRef.current.add(item.id)
        continue
      }

      // Markdown for the notification panel (renders bold)
      const message = `**${item.name}** is currently at ${currentStock} units (threshold: ${threshold}).`
      // Plain text for the toast (Sonner doesn't render markdown)
      const toastMessage = `${item.name} is currently at ${currentStock} units (threshold: ${threshold}).`

      try {
        await addItemsRef.current([{
          userId: currentUserId,
          type: alertType,
          title: alertTitle,
          message,
          link: `/inventory/${item.id}`,
          isRead: false,
          createdAt: new Date().toISOString()
        }], true)

        // Only mark as alerted AFTER a successful insert
        alertedItemsRef.current.add(item.id)

        toast.error(alertTitle, {
          description: toastMessage,
          duration: 8000,
          action: {
            label: "View",
            onClick: () => setLocation(`/inventory/${item.id}`)
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
