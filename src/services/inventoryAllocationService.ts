import { logger } from '../lib/logger'
import type { InventoryItem, OrderItem, SalesOrder, InventoryTransaction, SalesOrderStatus } from '../lib/types'
import { recalculateStockLevel } from './inventoryService'
import { createReceiptTransaction } from './inventoryTransactionService'
import type { JobAdapter, AtomicOp } from './types'

/**
 * FIFO Allocation Algorithm
 * 
 * When inventory is received, allocates available stock to pending order items
 * based on order date (earliest first = First In First Out)
 * 
 * INVARIANTS maintained:
 * - reserved_quantity ≤ stock_quantity (never over-reserve)
 * - Allocations only pull from available stock
 */
export async function allocateInventoryToPendingOrders(
  params: {
    inventoryItemId: string
    receivedQuantity: number
    poItemId: string
    poNumber: string
    receiptNumber: string
    userId: string
    userName: string
  },
  adapter: JobAdapter
): Promise<{ allocatedQuantity: number; updatedItems: number }> {
  const inventory = adapter.getInventoryItems()
  const orders = adapter.getSalesOrders()
  const invItem = inventory.find(i => i.id === params.inventoryItemId)
  if (!invItem) {
    throw new Error(`Inventory item ${params.inventoryItemId} not found`)
  }

  // Calculate available stock for allocation
  const currentReserved = invItem.reservedQuantity || 0
  const availableForAllocation = invItem.stockQuantity - currentReserved
  if (availableForAllocation <= 0) {
    logger.log('[allocation] No available stock to allocate')
    return { allocatedQuantity: 0, updatedItems: 0 }
  }

  // Get all order items for this inventory with pending quantity, ordered by order date (FIFO)
  const pendingOrderItems: Array<{
    orderItem: OrderItem
    salesOrder: SalesOrder
    pendingQty: number
  }> = []

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'fulfilled' || order.status === 'delivered') {
      continue
    }
    for (const item of order.items) {
      if (item.inventoryItemId !== params.inventoryItemId) continue
      // We want to allocate to anything that isn't yet fulfilled or reserved.
      // Even if it was 'procured' (ordered), arrival of stock means we move it from Procured -> Reserved.
      const pendingQty = item.quantity - (item.fulfilledQuantity || 0) - (item.reservedQuantity || 0)
      if (pendingQty > 0) {
        pendingOrderItems.push({
          orderItem: item,
          salesOrder: order,
          pendingQty
        })
      }
    }
  }

  // Sort by order date (FIFO - earliest first)
  pendingOrderItems.sort((a, b) =>
    new Date(a.salesOrder.orderDate).getTime() - new Date(b.salesOrder.orderDate).getTime()
  )

  const updates: AtomicOp[] = []
  let allocatedQty = 0
  let updatedCount = 0
  let remaining = Math.min(availableForAllocation, params.receivedQuantity)

  // Allocate to pending orders
  for (const pending of pendingOrderItems) {
    if (remaining <= 0) break

    const allocateQty = Math.min(pending.pendingQty, remaining)
    if (allocateQty <= 0) continue

    // SAFE: Add to reservedQuantity (not exceeding stock)
    const currentReservedOnInv = invItem.reservedQuantity || 0
    const newReservedOnInv = currentReservedOnInv + allocateQty
    // Invariant check: never exceed physical stock
    if (newReservedOnInv > invItem.stockQuantity) {
      logger.warn('[allocation] Would exceed stock, capping allocation')
      continue
    }

    // 1. Update Inventory Reservation
    updates.push({
      resource: 'inventory',
      id: params.inventoryItemId,
      patch: {
        reservedQuantity: newReservedOnInv,
        stockLevel: recalculateStockLevel(invItem.stockQuantity, newReservedOnInv, invItem.reorderThreshold)
      }
    });

    // 2. Update Sales Order Item Quantities
    const currentReservedOnItem = pending.orderItem.reservedQuantity || 0;
    const newReservedOnItem = currentReservedOnItem + allocateQty;
    // Decrement procuredQuantity as it is now satisfied by incoming stock (clamped at 0)
    const currentProcuredOnItem = pending.orderItem.procuredQuantity || 0;
    const newProcuredOnItem = Math.max(0, currentProcuredOnItem - allocateQty);

    // We update the item on the order object locally first to calculate new status
    const updatedItems = pending.salesOrder.items.map(i =>
      i.id === pending.orderItem.id
        ? { ...i, reservedQuantity: newReservedOnItem, procuredQuantity: newProcuredOnItem }
        : i
    );

    const newStatus = calculateSalesOrderStatus(updatedItems, pending.salesOrder.status);

    updates.push({
      resource: 'orders',
      id: pending.salesOrder.id,
      patch: {
        items: updatedItems,
        status: newStatus,
        stockReserved: updatedItems.some(i => (i.reservedQuantity || 0) > 0)
      }
    });

    remaining -= allocateQty;
    allocatedQty += allocateQty;
    updatedCount++;
    // Update local invItem reference for next iteration's calculation
    invItem.reservedQuantity = newReservedOnInv;
  }

  // Run all inventory updates atomically
  if (updates.length > 0) {
    await adapter.runAtomicUpdate(updates)
  }

  logger.log(`[allocation] Allocated ${allocatedQty} units to ${updatedCount} order items`)
  return { allocatedQuantity: allocatedQty, updatedItems: updatedCount }
}

/**
 * Check if procurement is needed for an order item
 * Returns the shortage quantity that should be procured
 */
export function calculateShortage(
  orderItem: OrderItem,
  inventoryItem: InventoryItem | null
): number {
  if (!inventoryItem) return orderItem.quantity // No inventory = full shortage
  const available = inventoryItem.stockQuantity - (inventoryItem.reservedQuantity || 0)
  const needed = orderItem.quantity
  const alreadyReserved = orderItem.reservedQuantity || 0
  const alreadyProcured = orderItem.procuredQuantity || 0

  // Shortage = total needed - what's already available - what's already on PO
  const shortage = needed - alreadyReserved - alreadyProcured

  return Math.max(0, shortage) // Never return negative
}

/**
 * Validate order item quantities (Invariant checks)
 */
export function validateOrderItemQuantities(
  orderItem: OrderItem,
  inventoryItem: InventoryItem | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const fulfilled = orderItem.fulfilledQuantity || 0
  const reserved = orderItem.reservedQuantity || 0
  const procured = orderItem.procuredQuantity || 0

  // Invariant 1: fulfilled + reserved + procured ≤ quantity
  const totalAssigned = fulfilled + reserved + procured
  if (totalAssigned > orderItem.quantity) {
    errors.push(`Total assigned (${totalAssigned}) exceeds quantity (${orderItem.quantity})`)
  }
  // Invariant 2: reserved ≤ stock (if inventory exists)
  if (inventoryItem && reserved > inventoryItem.stockQuantity) {
    errors.push(`Reserved (${reserved}) exceeds stock (${inventoryItem.stockQuantity})`)
  }
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Determine correct sales order status based on item quantities
 */
/**
 * Determine correct sales order status based on item quantities
 */
export function calculateSalesOrderStatus(
  orderItems: OrderItem[],
  currentStatus?: SalesOrderStatus
): SalesOrderStatus {
  // Terminal statuses should be preserved unless explicitly changed
  if (currentStatus === 'cancelled' || currentStatus === 'delivered' || currentStatus === 'shipped') {
    return currentStatus;
  }

  const totalItems = orderItems.length;
  if (totalItems === 0) return currentStatus || 'pending';

  let fullyFulfilledCount = 0;
  let partiallyFulfilledCount = 0;
  let hasShortage = false;
  let hasReservation = false;

  for (const item of orderItems) {
    const fulfilled = item.fulfilledQuantity || 0;
    const reserved = item.reservedQuantity || 0;
    const procured = item.procuredQuantity || 0;
    const quantity = item.quantity;

    if (fulfilled >= quantity) {
      fullyFulfilledCount++;
    } else if (fulfilled > 0) {
      partiallyFulfilledCount++;
    }

    if (fulfilled + reserved + procured < quantity) {
      hasShortage = true;
    }
    
    if (reserved > 0) {
      hasReservation = true;
    }
  }

  // 1. All items fully fulfilled -> fulfilled
  if (fullyFulfilledCount === totalItems) {
    return 'fulfilled';
  }

  // 2. Some items fulfilled or partially fulfilled -> partially_fulfilled
  if (fullyFulfilledCount > 0 || partiallyFulfilledCount > 0) {
    return 'partially_fulfilled';
  }

  // 3. No fulfillment, but some shortages -> pending_stock
  if (hasShortage) {
    return 'pending_stock';
  }

  // 4. No fulfillment, no shortages -> pending (ready to fulfill)
  return 'pending';
}