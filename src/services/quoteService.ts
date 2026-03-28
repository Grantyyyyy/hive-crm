import type { Quote, SalesOrder, OrderItem, InventoryItem, InventoryTransaction } from "../lib/types";
import { generateNumber } from "./types";
import { recalculateStockLevel } from "./inventoryService";
import type { CRMContextValue, AtomicOp } from "../lib/CRMContext";
import { createReservationTransaction, createReleaseTransaction } from "./inventoryTransactionService";

/**
 * Adapter for audit trail operations in quote service
 */
interface QuoteAuditAdapter {
  getInventoryTransactions: () => InventoryTransaction[];
  insertInventoryTransaction: (tx: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<InventoryTransaction>;
}

/**
 * Atomically reserves stock for a quote with duplicate item protection.
 */
export async function reserveStockForQuote(
  quote: Quote,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  if (quote.stockReserved || quote.status === 'accepted') return;

  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];
  const pendingTally: Record<string, number> = {};

  // 1. Tally requirements and check availability
  for (const item of quote.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (!invItem) {
      throw new Error(
        `Inventory item not found for "${item.name}" (ID: ${item.inventoryItemId}). It may have been deleted.`
      );
    }
    const currentRequested = (pendingTally[item.inventoryItemId] || 0) + item.quantity;

    const available = invItem.stockQuantity - (invItem.reservedQuantity || 0);
    if (currentRequested > available) {
      throw new Error(`Insufficient Available Stock for ${invItem.name}. Available: ${available}, Total in Quote: ${currentRequested}`);
    }
    pendingTally[item.inventoryItemId] = currentRequested;
  }

  // 2. Build Atomic Updates
  Object.keys(pendingTally).forEach(itemId => {
    const invItem = inventory.find(i => i.id === itemId)!;
    const newReserved = (invItem.reservedQuantity || 0) + pendingTally[itemId];
    updates.push({
      resource: 'inventory',
      id: itemId,
      patch: {
        reservedQuantity: newReserved,
        stockLevel: recalculateStockLevel(invItem.stockQuantity, newReserved, invItem.reorderThreshold)
      }
    });
  });

  updates.push({
    resource: 'quotes',
    id: quote.id,
    patch: { stockReserved: true, status: 'sent' }
  });

  await ctx.runAtomicUpdate(updates);

  // Create audit trail entries
  const auditAdapter: QuoteAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const item of quote.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      await createReservationTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: item.quantity,
        reservedBefore: invItem.reservedQuantity || 0,
        reservedAfter: (invItem.reservedQuantity || 0) + item.quantity,
        referenceId: quote.id,
        referenceNumber: quote.quoteNumber,
        reason: `Reserved for Quote ${quote.quoteNumber}`,
        userId,
        userName
      }, auditAdapter as any);
    }
  }
}

/**
 * Releases reserved stock if a quote is rejected or expired.
 */
export async function releaseQuoteStock(
  quote: Quote,
  ctx: CRMContextValue,
  userId: string,
  userName: string
): Promise<void> {
  if (!quote.stockReserved || quote.status === 'accepted') return;

  const inventory = ctx.getResource<InventoryItem>('inventory').data;
  const updates: AtomicOp[] = [];

  for (const item of quote.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      const currentReserved = (invItem.reservedQuantity || 0);
      if (currentReserved < item.quantity) {
        throw new Error(`Inventory Inconsistency: Cannot release ${item.quantity} units for ${invItem.name}. Only ${currentReserved} units reserved.`);
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
    resource: 'quotes',
    id: quote.id,
    patch: { stockReserved: false, status: quote.status === 'expired' ? 'expired' : 'rejected' }
  });

  await ctx.runAtomicUpdate(updates);

  // Create audit trail entries
  const auditAdapter: QuoteAuditAdapter = {
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: async (tx) => {
      const { insertRows } = await import('../lib/CRMContext');
      return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]);
    }
  };

  for (const item of quote.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      await createReleaseTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: -item.quantity,
        reservedBefore: invItem.reservedQuantity || 0,
        reservedAfter: (invItem.reservedQuantity || 0) - item.quantity,
        referenceId: quote.id,
        referenceNumber: quote.quoteNumber,
        reason: `Quote ${quote.quoteNumber} ${quote.status === 'expired' ? 'expired' : 'rejected'} - releasing reservation`,
        userId,
        userName
      }, auditAdapter as any);
    }
  }
}

/**
 * Converts a Quote to a Sales Order. The reservation transfers from Quote to Order.
 */
export async function acceptQuote(quote: Quote, ctx: CRMContextValue): Promise<SalesOrder> {
  const existingOrders = ctx.getResource<SalesOrder>('orders').data;
  const orderNumber = generateNumber('SO', existingOrders.map(o => o.orderNumber));

  const orderItems: OrderItem[] = quote.items.map(qi => ({
    id: qi.id,
    name: qi.name,
    quantity: qi.quantity,
    price: qi.price,
    inventoryItemId: qi.inventoryItemId
  }));

  const newOrder: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'> = {
    orderNumber,
    quoteId: quote.id,
    customerId: quote.customerId,
    customerName: quote.customerName,
    totalValue: quote.amount,
    currency: quote.currency,
    status: 'pending',
    orderDate: new Date().toISOString(),
    items: orderItems,
    stockDeducted: false,
    stockReserved: quote.stockReserved // Handoff the reservation
  };

  // Atomic Phase: Update Quote and Insert Order in one UI-committed batch
  const ops = [
    {
      resource: 'quotes',
      id: quote.id,
      patch: { status: 'accepted', stockReserved: false }
    },
    {
      resource: 'orders',
      action: 'insert' as const,
      patch: newOrder
    }
  ];

  const results = await ctx.runAtomicUpdate(ops);
  const created = results.find(r => r.resource === 'orders' && r.action === 'insert');
  if (!created) throw new Error("Failed to create order — insert result missing.");
  return created.patch as unknown as SalesOrder;
}

/**
 * PDF generation and email stub.
 */
export function sendQuoteEmail(quote: Quote) {
  // TODO: Implement actual PDF generation and email sending
  console.log(`[quoteService] Sending Quote Email to ${quote.customerName} for ${quote.quoteNumber}`);
}

/**
 * Reminder email stub.
 */
export function sendFollowUpReminder(quote: Quote) {
  // TODO: Implement actual email sending
  console.log(`[quoteService] Sending Follow-Up Reminder for Quote ${quote.quoteNumber}`);
}
