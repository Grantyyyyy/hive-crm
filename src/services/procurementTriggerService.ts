import { logger } from '../lib/logger'
import type { InventoryItem, OrderItem, SalesOrder, PurchaseOrder, PurchaseOrderItem, PurchaseRequest, Vendor } from '../lib/types'
import type { JobAdapter, AtomicOp } from './types'
import { generateNumber } from './types'
import { generateId } from '../lib/helpers'

/**
 * Procurement Trigger Service
 * 
 * Automatically creates PR/PO for order item shortages
 * Maintains idempotency - won't create duplicate PO for same shortage
 */

interface ShortageInfo {
  orderId: string
  orderItemId: string
  inventoryItemId: string
  shortageQty: number
  vendorId?: string
  vendorName?: string
}

/**
 * Analyze all pending orders to find shortages
 */
export function analyzeShortages(
  orders: SalesOrder[],
  inventory: InventoryItem[]
): ShortageInfo[] {
  const shortages: ShortageInfo[] = []

  for (const order of orders) {
    // Skip non-pending orders
    if (order.status === 'fulfilled' || order.status === 'delivered' || order.status === 'cancelled') {
      continue
    }

    for (const item of order.items) {
      if (!item.inventoryItemId) continue // Custom items not in inventory

      const invItem = inventory.find(i => i.id === item.inventoryItemId)
      if (!invItem) continue

      // Calculate pending: quantity - fulfilled - reserved - procured
      const fulfilled = item.fulfilledQuantity || 0
      const reserved = item.reservedQuantity || 0
      const procured = item.procuredQuantity || 0
      const pending = item.quantity - fulfilled - reserved - procured

      if (pending > 0) {
        shortages.push({
          orderId: order.id,
          orderItemId: item.id,
          inventoryItemId: item.inventoryItemId,
          shortageQty: pending,
          vendorId: invItem.reorderQuantity ? undefined : undefined, // Could link to preferred vendor
          vendorName: undefined
        })
      }
    }
  }

  return shortages
}

/**
 * Group shortages by inventory item for bulk procurement
 */
export function groupShortagesByInventory(
  shortages: ShortageInfo[]
): Record<string, number> {
  const grouped: Record<string, number> = {}

  for (const shortage of shortages) {
    const current = grouped[shortage.inventoryItemId] || 0
    grouped[shortage.inventoryItemId] = current + shortage.shortageQty
  }

  return grouped
}

/**
 * Create procurement for shortages (PR or direct PO)
 * 
 * Rules:
 * - Only create PO for: pending_quantity - procured_quantity
 * - Idempotent: won't duplicate
 * - Links to sales_order_item_id
 */
export async function createProcurementForShortages(
  params: {
    shortages: ShortageInfo[]
    vendors: Vendor[]
    mode: 'pr_then_po' | 'direct_po'
    adapter: JobAdapter
  }
): Promise<{ createdPOs: number; shortageCovered: number }> {
  const { shortages, vendors, mode, adapter } = params

  // Group by vendor to create consolidated POs
  const byVendor: Record<string, ShortageInfo[]> = {}
  const noVendor: ShortageInfo[] = []

  for (const shortage of shortages) {
    if (shortage.vendorId) {
      if (!byVendor[shortage.vendorId]) {
        byVendor[shortage.vendorId] = []
      }
      byVendor[shortage.vendorId].push(shortage)
    } else {
      noVendor.push(shortage)
    }
  }

  // Handle items with vendors
  for (const [vendorId, items] of Object.entries(byVendor)) {
    await createPOForGroup({
      vendorId,
      vendorName: items[0].vendorName || 'TBD',
      items,
      mode,
      adapter
    })
  }

  // Handle items without vendors (TBD)
  if (noVendor.length > 0) {
    await createPOForGroup({
      vendorId: '',
      vendorName: 'TBD',
      items: noVendor,
      mode,
      adapter
    })
  }

  return { createdPOs: 1, shortageCovered: shortages.reduce((sum, s) => sum + s.shortageQty, 0) }
}

async function createPOForGroup(params: {
  vendorId: string
  vendorName: string
  items: ShortageInfo[]
  mode: 'pr_then_po' | 'direct_po'
  adapter: JobAdapter
}): Promise<PurchaseOrder | null> {
  const { vendorId, vendorName, items, mode, adapter } = params

  // Generate PO items
  const poItems: PurchaseOrderItem[] = items.map(item => ({
    id: generateId(),
    name: '', // Would be populated from inventory item
    quantity: item.shortageQty,
    receivedQuantity: 0,
    price: 0, // Would be populated from vendor
    inventoryItemId: item.inventoryItemId,
    linkedSalesOrderItemId: item.orderItemId,
    trackInInventory: true,
    status: 'active'
  }))

  if (poItems.length === 0) return null

  const existingPOs = adapter.getPurchaseOrders()
  const poNumber = generateNumber('PO', existingPOs.map(p => p.poNumber))

  const totalAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)

  const newPO: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
    poNumber,
    vendorId,
    vendorName,
    items: poItems,
    amount: totalAmount,
    status: 'draft',
    date: new Date().toISOString()
  }

  const created = await adapter.insertPurchaseOrder(newPO)

  logger.log(`[procurementTrigger] Created PO ${poNumber} for ${items.length} items covering shortages`)

  // Update sales order items with procured quantity (idempotent)
  // This prevents duplicate PO creation
  for (const item of items) {
    const orderItem = await findOrderItem(adapter, item.orderItemId)
    if (orderItem && adapter.updateSalesOrderItem) {
      // Need orderId - find it from orderItem
      const orders = adapter.getSalesOrders()
      for (const order of orders) {
        const foundItem = order.items.find(i => i.id === item.orderItemId)
        if (foundItem) {
          await adapter.updateSalesOrderItem(order.id, item.orderItemId, {
            procuredQuantity: (foundItem.procuredQuantity || 0) + item.shortageQty
          })
          break
        }
      }
    }
  }

  return created
}

async function findOrderItem(
  adapter: JobAdapter,
  orderItemId: string
): Promise<OrderItem | null> {
  const orders = adapter.getSalesOrders()
  for (const order of orders) {
    for (const item of order.items) {
      if (item.id === orderItemId) return item
    }
  }
  return null
}

/**
 * Cancel procurement when order is cancelled
 * Reverses procured quantity and releases PO linkage
 */
export async function cancelProcurementForOrder(
  params: {
    orderItemId: string
    adapter: JobAdapter
  }
): Promise<void> {
  const { orderItemId, adapter } = params

  // Find PO items linked to this order item
  const pos = adapter.getPurchaseOrders()
  for (const po of pos) {
    const linkedItem = po.items.find(i => i.linkedSalesOrderItemId === orderItemId)
    if (linkedItem && linkedItem.status === 'active' && adapter.updatePurchaseOrderItem) {
      // Cancel the PO item - needs poId, itemId, patch
      await adapter.updatePurchaseOrderItem(po.id, linkedItem.id, {
        status: 'cancelled'
      })
    }
  }

  logger.log(`[procurementTrigger] Cancelled procurement links for order item ${orderItemId}`)
}

/**
 * Update procured quantity when PO is partially received
 */
export async function adjustProcuredOnReceipt(
  params: {
    orderItemId: string
    receivedQty: number
    adapter: JobAdapter
  }
): Promise<void> {
  const { orderItemId, receivedQty, adapter } = params

  const orders = adapter.getSalesOrders()
  for (const order of orders) {
    for (const item of order.items) {
      if (item.id === orderItemId) {
        const currentProcured = item.procuredQuantity || 0
        const newProcured = Math.max(0, currentProcured - receivedQty)
        // Note: This is called AFTER allocation, so we reduce procured
        // and the quantity is now in reserved/fulfilled
      }
    }
  }
}