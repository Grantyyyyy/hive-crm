import type { SalesOrder, InventoryItem, InventoryTransaction } from "../lib/types";
import { recalculateStockLevel } from "./inventoryService";
import type { CRMContextValue, AtomicOp } from "../lib/CRMContext";
import { createShipmentTransaction, createReleaseTransaction, createReservationTransaction, createReturnTransaction } from "./inventoryTransactionService";

/**
 * Adapter for audit trail operations in order service
 */
interface OrderAuditAdapter {
  getInventoryTransactions: () => InventoryTransaction[];
  insertInventoryTransaction: (tx: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<InventoryTransaction>;
}

/**
 * Atomically deducts physical stock and releases the reservation for a shipped order.
 * Throws error if physical stock is insufficient (Hard-stop).
 */
export async function fulfillOrderStock(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  if (order.stockDeducted) return;

  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];

  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (!invItem) {
      throw new Error(
        `Inventory item not found for "${item.name}" (ID: ${item.inventoryItemId}). It may have been deleted. Cannot fulfill order.`
      );
    }

    // Hard stop: Cannot ship what you don't have
    if (invItem.stockQuantity < item.quantity) {
      throw new Error(`Execution Blocked: Insufficient physical stock for ${invItem.name}.`);
    }

    const newPhysical = invItem.stockQuantity - item.quantity;
    const currentReserved = (invItem.reservedQuantity || 0);
    if (order.stockReserved && currentReserved < item.quantity) {
      throw new Error(`Inventory Inconsistency: Release of ${item.quantity} for ${invItem.name} results in negative reservation. (Current: ${currentReserved})`);
    }
    const newReserved = order.stockReserved
      ? currentReserved - item.quantity
      : currentReserved;

    updates.push({
      resource: 'inventory',
      id: invItem.id,
      patch: {
        stockQuantity: newPhysical,
        reservedQuantity: newReserved,
        stockLevel: recalculateStockLevel(newPhysical, newReserved, invItem.reorderThreshold)
      }
    });
  }

  updates.push({
    resource: 'orders',
    id: order.id,
    patch: {
      stockDeducted: true,
      stockReserved: false,
      status: 'shipped'
    }
  });

  await ctx.runAtomicUpdate(updates);

  // Create audit trail entries AFTER successful atomic update
  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      const quantityBefore = invItem.stockQuantity;
      const quantityAfter = quantityBefore - item.quantity;

      await createShipmentTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        quantityChange: -item.quantity,
        quantityBefore,
        quantityAfter,
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `Shipped for Order ${order.orderNumber}`,
        userId,
        userName
      }, auditAdapter as any);
    }
  }
}

/**
 * Releases reserved stock if an order is cancelled before fulfillment.
 */
export async function releaseOrderStock(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  if (order.status === 'cancelled' || order.stockDeducted) return;

  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];

  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);

    if (invItem && order.stockReserved) {
      const currentReserved = (invItem.reservedQuantity || 0);
      if (currentReserved < item.quantity) {
        throw new Error(`Inventory Inconsistency: Cancellation release of ${item.quantity} for ${invItem.name} exceeds reservation. (Current: ${currentReserved})`);
      }
      const newReserved = currentReserved - item.quantity;
      updates.push({
        resource: 'inventory',
        id: invItem.id,
        patch: {
          reservedQuantity: newReserved,
          stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved, invItem.reorderThreshold)
        }
      });
    }
  }

  updates.push({
    resource: 'orders',
    id: order.id,
    patch: {
      stockReserved: false,
      status: 'cancelled'
    }
  });

  await ctx.runAtomicUpdate(updates);

  // Create audit trail entries
  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem && order.stockReserved) {
      await createReleaseTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: -item.quantity,
        reservedBefore: invItem.reservedQuantity || 0,
        reservedAfter: (invItem.reservedQuantity || 0) - item.quantity,
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `Order ${order.orderNumber} cancelled - releasing reservation`,
        userId,
        userName
      }, auditAdapter as any);
    }
  }
}

/**
 * Atomically creates a direct order with ATP check and reservation.
 */
export async function createOrderWithReservation(
  order: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>,
  ctx: CRMContextValue
): Promise<SalesOrder> {
  const inventory = (ctx.getResource<InventoryItem>('inventory').data);
  const ops: AtomicOp[] = [];
  const pendingTally: Record<string, number> = {};

  // 1. Availability Check (ATP)
  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    const requested = (pendingTally[item.inventoryItemId] || 0) + item.quantity;

    if (invItem) {
      const available = invItem.stockQuantity - (invItem.reservedQuantity || 0);
      if (requested > available) {
        throw new Error(`Availability Error: ${invItem.name} is out of stock. Required: ${requested}, Available: ${available}`);
      }
      pendingTally[item.inventoryItemId] = requested;
    }
  }

  // 2. Build Inventory Reservation Updates
  Object.keys(pendingTally).forEach(itemId => {
    const invItem = inventory.find(i => i.id === itemId)!;
    const newReserved = (invItem.reservedQuantity || 0) + pendingTally[itemId];
    ops.push({
      resource: 'inventory',
      id: itemId,
      patch: {
        reservedQuantity: newReserved,
        stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved, invItem.reorderThreshold)
      }
    });
  });

  // 3. Insert and Mark as Reserved
  ops.push({
    resource: 'orders',
    action: 'insert',
    patch: { ...order, stockReserved: true }
  });

  const results = await ctx.runAtomicUpdate(ops);
  const created = results.find(r => r.resource === 'orders' && r.action === 'insert');
  if (!created) throw new Error("Failed to create order — insert result missing.");

  // Create audit trail entries for the reservation
  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const [itemId, quantity] of Object.entries(pendingTally)) {
    const invItem = inventory.find(i => i.id === itemId);
    if (!invItem) continue;
    const reservedBefore = invItem.reservedQuantity || 0;
    const reservedAfter = reservedBefore + quantity;
    await createReservationTransaction({
      inventoryItemId: invItem.id,
      inventoryItemName: invItem.name,
      reservedChange: quantity,
      reservedBefore,
      reservedAfter,
      referenceId: created.patch.id,
      referenceNumber: created.patch.orderNumber,
      reason: `Reserved for direct order ${created.patch.orderNumber}`,
      userId: ctx.userId,
      userName: 'System'
    }, auditAdapter as any);
  }

  return created.patch as unknown as SalesOrder;
}

/**
 * Returns stock to inventory when a shipped order is cancelled.
 * Increments stockQuantity and creates return audit trail entries.
 */
export async function returnShippedOrderStock(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  if (!order.stockDeducted) {
    throw new Error('Cannot return stock for an order that has not been shipped');
  }

  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];
  const auditItems: { invItem: InventoryItem; newPhysical: number; quantity: number }[] = [];

  for (const item of order.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (!invItem) {
      console.warn(`[orderService] Inventory item ${item.inventoryItemId} not found for return - skipping`);
      continue;
    }

    const newPhysical = invItem.stockQuantity + item.quantity;
    auditItems.push({ invItem, newPhysical, quantity: item.quantity });

    updates.push({
      resource: 'inventory',
      id: invItem.id,
      patch: {
        stockQuantity: newPhysical,
        stockLevel: recalculateStockLevel(
          newPhysical,
          invItem.reservedQuantity ?? 0,
          invItem.reorderThreshold
        ),
      },
    });
  }

  updates.push({
    resource: 'orders',
    id: order.id,
    patch: {
      status: 'cancelled',
      stockDeducted: false,
    },
  });

  await ctx.runAtomicUpdate(updates);

  // Create audit trail entries
  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    },
  };

  for (const { invItem, newPhysical, quantity } of auditItems) {
    await createReturnTransaction({
      inventoryItemId: invItem.id,
      inventoryItemName: invItem.name,
      quantityBefore: invItem.stockQuantity,
      quantityAfter: newPhysical,
      quantityChange: quantity,
      reservedBefore: invItem.reservedQuantity ?? 0,
      reservedAfter: invItem.reservedQuantity ?? 0,
      referenceId: order.id,
      referenceNumber: order.orderNumber,
      reason: `Stock return from cancelled order ${order.orderNumber}`,
      userId,
      userName,
    }, auditAdapter as any);
  }
}

/**
 * Atomically cancels an order and reverses stock changes based on order state.
 * - If stockReserved: releases reservation (type: 'release')
 * - If stockDeducted: returns physical stock (type: 'return')
 * - If neither: no inventory changes (type: 'none')
 */
export async function cancelOrderWithStockReversal(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<{ itemsReversed: number; type: 'release' | 'return' | 'none' }> {
  // Determine reversal type based on order state
  const reversalType = order.stockDeducted
    ? 'return'
    : order.stockReserved
      ? 'release'
      : 'none'

  if (reversalType === 'none') {
    return { itemsReversed: 0, type: 'none' }
  }

  const inventory = ctx.getResource<InventoryItem>('inventory').data
  let itemsReversed = 0

  for (const lineItem of order.items) {
    if (!lineItem.inventoryItemId) continue

    const invItem = inventory.find(i => i.id === lineItem.inventoryItemId)
    if (!invItem) continue

    if (reversalType === 'release') {
      // CASE 1: Release reservation (pending order)
      const currentReserved = invItem.reservedQuantity || 0
      const newReserved = Math.max(0, currentReserved - lineItem.quantity)

      await ctx.runAtomicUpdate([{
        resource: 'inventory',
        action: 'update',
        id: invItem.id,
        patch: {
          reservedQuantity: newReserved,
          stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved, invItem.reorderThreshold)
        }
      }])

      // Create release transaction
      const auditAdapter: OrderAuditAdapter = {
        getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
        insertInventoryTransaction: async (tx) => {
          const { insertRows } = await import('../lib/CRMContext')
          return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0])
        }
      }

      await createReleaseTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: -lineItem.quantity,
        reservedBefore: currentReserved,
        reservedAfter: newReserved,
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `Order cancelled — reservation released`,
        userId,
        userName
      }, auditAdapter as any)

    } else if (reversalType === 'return') {
      // CASE 2: Return physical stock (shipped order)
      const newPhysical = invItem.stockQuantity + lineItem.quantity

      await ctx.runAtomicUpdate([{
        resource: 'inventory',
        action: 'update',
        id: invItem.id,
        patch: {
          stockQuantity: newPhysical,
          stockLevel: recalculateStockLevel(
            newPhysical,
            invItem.reservedQuantity ?? 0,
            invItem.reorderThreshold
          )
        }
      }])

      // Create return transaction
      const auditAdapter: OrderAuditAdapter = {
        getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
        insertInventoryTransaction: async (tx) => {
          const { insertRows } = await import('../lib/CRMContext')
          return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0])
        }
      }

      await createReturnTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        quantityBefore: invItem.stockQuantity,
        quantityAfter: newPhysical,
        quantityChange: lineItem.quantity,
        reservedBefore: invItem.reservedQuantity ?? 0,
        reservedAfter: invItem.reservedQuantity ?? 0,
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `Stock return from cancelled order ${order.orderNumber}`,
        userId,
        userName
      }, auditAdapter as any)
    }

    itemsReversed++
  }

  // Update order status and flags atomically
  const orderPatch = reversalType === 'return'
    ? { status: 'cancelled', stockDeducted: false }
    : { status: 'cancelled', stockReserved: false }

  await ctx.runAtomicUpdate([{
    resource: 'orders',
    action: 'update',
    id: order.id,
    patch: orderPatch
  }])

  return { itemsReversed, type: reversalType }
}

/**
 * Sends a shipping notification.
 * Email dispatch is not implemented — use generateInvoicePDF() from pdfService for manual download.
 */
export async function sendShippingNotification(_order: SalesOrder): Promise<void> {
  console.log("[orderService] sendShippingNotification — email dispatch not implemented. User can download PDF manually.");
}

/**
 * Generates an invoice for the order.
 * PDF/email dispatch is not implemented — use generateInvoicePDF() from pdfService for manual download.
 */
export async function generateInvoice(_order: SalesOrder): Promise<void> {
  console.log("[orderService] generateInvoice — email dispatch not implemented. User can download PDF manually.");
}
