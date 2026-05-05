import { logger } from "../lib/logger";
import type { SalesOrder, InventoryItem, InventoryTransaction, OrderItem } from "../lib/types";
import { recalculateStockLevel } from "./inventoryService";
import type { CRMContextValue, AtomicOp } from "../lib/CRMContext";
import { createShipmentTransaction, createReleaseTransaction, createReservationTransaction, createReturnTransaction } from "./inventoryTransactionService";
import { calculateSalesOrderStatus } from "./inventoryAllocationService";

/**
 * Order Service - Updated for Partial Fulfillment
 * 
 * Key concepts:
 * - quantity: total ordered
 * - fulfilledQuantity: already shipped
 * - reservedQuantity: currently held from stock
 * - procuredQuantity: on PO awaiting receipt
 * - pending = quantity - fulfilled - reserved - procured
 */

/**
 * Adapter for audit trail operations in order service
 */
interface OrderAuditAdapter {
  getInventoryTransactions: () => InventoryTransaction[];
  insertInventoryTransaction: (tx: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<InventoryTransaction>;
}

/**
 * Reserve available stock for an order
 * - Reserves what's available (ATP)
 * - Leaves shortage as pending (for procurement)
 */
export async function reserveAvailableStock(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<{ reservedItems: number; shortages: Array<{ itemId: string; shortageQty: number }> }> {
  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];
  const shortages: Array<{ itemId: string; shortageQty: number }> = [];
  let reservedItems = 0;

  const updatedOrderItems = [...order.items];

  for (let i = 0; i < updatedOrderItems.length; i++) {
    const item = updatedOrderItems[i];
    if (!item.inventoryItemId) continue;
    
    const invItem = inventory.find(inv => inv.id === item.inventoryItemId);
    if (!invItem) {
      shortages.push({ itemId: item.id, shortageQty: item.quantity });
      continue;
    }

    const available = invItem.stockQuantity - (invItem.reservedQuantity || 0);
    const needed = item.quantity;
    const alreadyReserved = item.reservedQuantity || 0;
    
    // We can reserve anything that isn't already reserved or fulfilled.
    // Even if it's marked "procured", if we have ATP *now*, we claim it and reduce procured.
    const alreadyFulfilled = item.fulfilledQuantity || 0;
    const canReserve = Math.min(available, needed - alreadyReserved - alreadyFulfilled);
    
    if (canReserve > 0) {
      const newReservedOnItem = (item.reservedQuantity || 0) + canReserve;
      const newInvReserved = (invItem.reservedQuantity || 0) + canReserve;
      const currentProcuredOnItem = item.procuredQuantity || 0;
      const newProcuredOnItem = Math.max(0, currentProcuredOnItem - canReserve);

      // INVARIANT: never reserve more than physical stock
      if (newInvReserved > invItem.stockQuantity) {
        throw new Error(`Would exceed stock for ${invItem.name}`);
      }

      // Update local item copy
      updatedOrderItems[i] = { 
        ...item, 
        reservedQuantity: newReservedOnItem,
        procuredQuantity: newProcuredOnItem 
      };

      updates.push({
        resource: 'inventory',
        id: invItem.id,
        patch: {
          reservedQuantity: newInvReserved,
          stockLevel: recalculateStockLevel(invItem.stockQuantity, newInvReserved, invItem.reorderThreshold)
        }
      });

      reservedItems++;
    }

    // Calculate remaining shortage for procurement
    const pending = needed - (updatedOrderItems[i].reservedQuantity || 0) - (updatedOrderItems[i].procuredQuantity || 0) - (updatedOrderItems[i].fulfilledQuantity || 0);
    if (pending > 0) {
      shortages.push({ itemId: item.id, shortageQty: pending });
    }
  }

  if (updates.length > 0) {
    // Calculate new order status based on updated items
    const newStatus = calculateSalesOrderStatus(updatedOrderItems, order.status);
    
    // Update order with items and status
    updates.push({
      resource: 'orders',
      id: order.id,
      patch: { 
        items: updatedOrderItems,
        status: newStatus,
        stockReserved: updatedOrderItems.some(i => (i.reservedQuantity || 0) > 0)
      }
    });

    await ctx.runAtomicUpdate(updates);
  }
  
  return { reservedItems, shortages };
}

/**
 * Ship/fulfill an order (partial fulfillment supported)
 * - Validates reservation exists
 * - Deducts stock (physical)
 * - Updates fulfilled_quantity per line
 */
export async function fulfillOrderStock(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];
  const updatedOrderItems = [...order.items];

  // Track if anything was fulfilled
  let anyFulfilled = false;

  for (let i = 0; i < updatedOrderItems.length; i++) {
    const item = updatedOrderItems[i];
    if (!item.inventoryItemId) continue;
    
    // Skip if nothing to fulfill
    const canFulfill = item.reservedQuantity || 0;
    if (canFulfill <= 0) continue;

    const invItem = inventory.find(inv => inv.id === item.inventoryItemId);
    if (!invItem) {
      throw new Error(`Inventory item not found for ${item.name}`);
    }

    // RESILIENCE: If there's an out-of-sync mismatch between 
    // the order's reservation and the inventory master's reservation,
    // we allow the shipment as long as PHYSICAL stock exists.
    if (canFulfill > (invItem.reservedQuantity || 0)) {
      logger.warn(`[orderService] Reservation mismatch detected for ${invItem.name}. Expected ${canFulfill}, but master only has ${invItem.reservedQuantity}. Auto-correcting...`);
    }

    // ACTUAL INVARIANT: Must have enough PHYSICAL stock
    if (canFulfill > invItem.stockQuantity) {
      throw new Error(`Insufficient physical stock for ${invItem.name}. (Available: ${invItem.stockQuantity}, Needed: ${canFulfill})`);
    }

    // Deduct physical stock
    const newPhysical = invItem.stockQuantity - canFulfill;
    // Correct the reserved count by subtracting what we fulfill, clamped at 0
    const newInvReserved = Math.max(0, (invItem.reservedQuantity || 0) - canFulfill);

    // Update order item: reserved -> fulfilled
    updatedOrderItems[i] = {
      ...item,
      reservedQuantity: 0,
      fulfilledQuantity: (item.fulfilledQuantity || 0) + canFulfill
    };

    updates.push({
      resource: 'inventory',
      id: invItem.id,
      patch: {
        stockQuantity: newPhysical,
        reservedQuantity: newInvReserved,
        stockLevel: recalculateStockLevel(newPhysical, newInvReserved, invItem.reorderThreshold)
      }
    });

    anyFulfilled = true;
  }

  if (!anyFulfilled) {
    throw new Error('No stock reserved - cannot fulfill');
  }

  // Calculate new order status
  const newStatus = calculateSalesOrderStatus(updatedOrderItems, order.status);

  updates.push({
    resource: 'orders',
    id: order.id,
    patch: {
      items: updatedOrderItems,
      status: newStatus,
      stockDeducted: true,
      stockReserved: updatedOrderItems.some(i => (i.reservedQuantity || 0) > 0)
    }
  });

  await ctx.runAtomicUpdate(updates);
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
  const updatedItems = [...order.items];

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];
    const reservedOnItem = item.reservedQuantity || 0;
    if (reservedOnItem <= 0 || !item.inventoryItemId) continue;

    const invItem = inventory.find(inv => inv.id === item.inventoryItemId);

    if (invItem) {
      const currentReservedOnInv = (invItem.reservedQuantity || 0);
      
      // Safety check
      const toRelease = Math.min(reservedOnItem, currentReservedOnInv);
      const newReservedOnInv = currentReservedOnInv - toRelease;
      
      updates.push({
        resource: 'inventory',
        id: invItem.id,
        patch: {
          reservedQuantity: newReservedOnInv,
          stockLevel: recalculateStockLevel(invItem.stockQuantity, newReservedOnInv, invItem.reorderThreshold)
        }
      });

      // Clear the item reservation
      updatedItems[i] = { ...item, reservedQuantity: 0 };
    }
  }

  updates.push({
    resource: 'orders',
    id: order.id,
    patch: {
      items: updatedItems,
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
    const reservedOnItem = item.reservedQuantity || 0;
    
    if (invItem && reservedOnItem > 0) {
      await createReleaseTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: -reservedOnItem,
        reservedBefore: invItem.reservedQuantity || 0,
        reservedAfter: (invItem.reservedQuantity || 0) - reservedOnItem,
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
  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const ops: AtomicOp[] = [];
  
  // Track reservations to update inventory and create transactions
  const reservationTally: Record<string, number> = {};
  const updatedItems = [...order.items];

  // 1. Partial Reservation Logic
  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];
    if (!item.inventoryItemId) continue;

    const invItem = inventory.find(inv => inv.id === item.inventoryItemId);
    const alreadyReservedInThisOrder = reservationTally[item.inventoryItemId] || 0;

    if (invItem) {
      const available = invItem.stockQuantity - (invItem.reservedQuantity || 0) - alreadyReservedInThisOrder;
      const canReserve = Math.max(0, Math.min(item.quantity, available));
      
      if (canReserve > 0) {
        reservationTally[item.inventoryItemId] = alreadyReservedInThisOrder + canReserve;
        updatedItems[i] = { 
          ...item, 
          reservedQuantity: canReserve,
          fulfilledQuantity: 0,
          procuredQuantity: 0
        };
      } else {
        updatedItems[i] = { 
          ...item, 
          reservedQuantity: 0,
          fulfilledQuantity: 0,
          procuredQuantity: 0
        };
      }
    }
  }

  // 2. Determine Order Status
  const newStatus = calculateSalesOrderStatus(updatedItems, order.status);

  // 3. Build Inventory Reservation Updates
  Object.keys(reservationTally).forEach(itemId => {
    const invItem = inventory.find(i => i.id === itemId)!;
    const reservedAmt = reservationTally[itemId];
    const newReservedOnInv = (invItem.reservedQuantity || 0) + reservedAmt;
    
    ops.push({
      resource: 'inventory',
      id: itemId,
      patch: {
        reservedQuantity: newReservedOnInv,
        stockLevel: recalculateStockLevel(invItem.stockQuantity, newReservedOnInv, invItem.reorderThreshold)
      }
    });
  });

  // 4. Insert Order
  ops.push({
    resource: 'orders',
    action: 'insert',
    patch: { 
      ...order, 
      items: updatedItems,
      status: newStatus,
      stockReserved: Object.keys(reservationTally).length > 0 
    }
  });

  const results = await ctx.runAtomicUpdate(ops);
  const created = results.find(r => r.resource === 'orders' && r.action === 'insert');
  if (!created) throw new Error("Failed to create order — insert result missing.");

  const createdOrder = created.patch as SalesOrder;


  // Create audit trail entries for the reservation
  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const [itemId, quantity] of Object.entries(reservationTally)) {
    const invItem = inventory.find(i => i.id === itemId);
    if (!invItem) continue;
    
    // We didn't have the updated invItem state here, so we calculate based on the initial state
    const reservedBefore = invItem.reservedQuantity || 0;
    const reservedAfter = reservedBefore + quantity;
    
    await createReservationTransaction({
      inventoryItemId: invItem.id,
      inventoryItemName: invItem.name,
      reservedChange: quantity,
      reservedBefore,
      reservedAfter,
      referenceId: createdOrder.id,
      referenceNumber: createdOrder.orderNumber,
      reason: `Reserved for direct order ${createdOrder.orderNumber}`,
      userId: (order as any).userId || 'system',
      userName: (order as any).userName || 'System'
    }, auditAdapter as any);
  }

  return createdOrder;
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
      logger.warn(`[orderService] Inventory item ${item.inventoryItemId} not found for return - skipping`);
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
 * - Releases reservations for each item
 * - Restores fulfilled quantities to physical stock
 */
export async function cancelOrderWithStockReversal(
  order: SalesOrder,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<{ itemsReversed: number; type: 'mixed' | 'none' }> {
  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];
  const updatedItems = [...order.items];
  let itemsReversed = 0;

  const auditAdapter: OrderAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];
    if (!item.inventoryItemId) continue;

    const invItem = inventory.find(inv => inv.id === item.inventoryItemId);
    const reservedOnItem = item.reservedQuantity || 0;
    const fulfilledOnItem = item.fulfilledQuantity || 0;

    if (invItem && (reservedOnItem > 0 || fulfilledOnItem > 0)) {
      const newPhysical = invItem.stockQuantity + fulfilledOnItem;
      const newReservedOnInv = Math.max(0, (invItem.reservedQuantity || 0) - reservedOnItem);
      
      updates.push({
        resource: 'inventory',
        id: invItem.id,
        patch: {
          stockQuantity: newPhysical,
          reservedQuantity: newReservedOnInv,
          stockLevel: recalculateStockLevel(newPhysical, newReservedOnInv, invItem.reorderThreshold)
        }
      });

      if (fulfilledOnItem > 0) {
        await createReturnTransaction({
          inventoryItemId: invItem.id,
          inventoryItemName: invItem.name,
          quantityChange: fulfilledOnItem,
          quantityBefore: invItem.stockQuantity,
          quantityAfter: newPhysical,
          reservedBefore: invItem.reservedQuantity || 0,
          reservedAfter: newReservedOnInv,
          referenceId: order.id,
          referenceNumber: order.orderNumber,
          reason: `Order cancelled - stock return`,
          userId,
          userName
        }, auditAdapter as any);
      }

      if (reservedOnItem > 0) {
        await createReleaseTransaction({
          inventoryItemId: invItem.id,
          inventoryItemName: invItem.name,
          reservedChange: -reservedOnItem,
          reservedBefore: invItem.reservedQuantity || 0,
          reservedAfter: newReservedOnInv,
          referenceId: order.id,
          referenceNumber: order.orderNumber,
          reason: `Order cancelled - reservation release`,
          userId,
          userName
        }, auditAdapter as any);
      }
      
      updatedItems[i] = { ...item, reservedQuantity: 0, fulfilledQuantity: 0 };
      itemsReversed++;
    }
  }

  if (itemsReversed > 0) {
    updates.push({
      resource: 'orders',
      id: order.id,
      patch: { status: 'cancelled', stockReserved: false, stockDeducted: false, items: updatedItems }
    });
    await ctx.runAtomicUpdate(updates);
  }

  return { itemsReversed, type: itemsReversed > 0 ? 'mixed' : 'none' };
}

/**
 * Sends a shipping notification.
 * Email dispatch is not implemented — use generateInvoicePDF() from pdfService for manual download.
 */
export async function sendShippingNotification(_order: SalesOrder): Promise<void> {
  logger.log("[orderService] sendShippingNotification — email dispatch not implemented. User can download PDF manually.");
}

/**
 * Generates an invoice for the order.
 * PDF/email dispatch is not implemented — use generateInvoicePDF() from pdfService for manual download.
 */
export async function generateInvoice(_order: SalesOrder): Promise<void> {
  logger.log("[orderService] generateInvoice — email dispatch not implemented. User can download PDF manually.");
}
