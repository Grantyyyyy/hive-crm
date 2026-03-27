import type { SalesOrder, InventoryItem, InventoryTransaction } from "../lib/types";
import { recalculateStockLevel } from "./inventoryService";
import type { CRMContextValue, AtomicOp } from "../lib/CRMContext";
import { createShipmentTransaction, createReleaseTransaction } from "./inventoryTransactionService";

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

    if (invItem) {
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
          stockLevel: recalculateStockLevel(newPhysical, newReserved)
        }
      });
    }
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
      await createShipmentTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        quantityChange: -item.quantity,
        quantityBefore: invItem.stockQuantity,
        quantityAfter: invItem.stockQuantity - item.quantity,
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
          stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved)
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
        stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved)
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
  return created.patch as unknown as SalesOrder;
}

/**
 * Sends a shipping notification email stub.
 */
export function sendShippingNotification(order: SalesOrder) {
  // TODO: Implement actual email sending
  console.log(`[orderService] Sending Shipping Notification for Order ${order.orderNumber}`);
}

/**
 * Generates an invoice and emails the customer.
 */
export function generateInvoice(order: SalesOrder) {
  // TODO: Implement PDF generation and email dispatch
  console.log(`[orderService] Generating Invoice for Delivered Order ${order.orderNumber}`);
}
