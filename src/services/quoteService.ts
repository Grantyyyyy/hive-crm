import { logger } from "../lib/logger";
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
 * Atomically reserves stock for a quote with partial fulfillment support.
 * NO LONGER BLOCKS on shortage - computes shortage and allows quote to save.
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
  const shortages: Record<string, number> = {};

  // 1. Tally requirements and reserve what's available (non-blocking)
  for (const item of quote.items) {
    if (!item.inventoryItemId) continue;
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (!invItem) {
      // Item not in inventory - treat as full shortage
      shortages[item.inventoryItemId] = (shortages[item.inventoryItemId] || 0) + item.quantity;
      continue;
    }

    const available = invItem.stockQuantity - (invItem.reservedQuantity || 0);
    const needed = item.quantity;
    
    // Reserve what's available, track shortage for rest
    const toReserve = Math.min(needed, available);
    const shortage = needed - toReserve;
    
    if (toReserve > 0) {
      pendingTally[item.inventoryItemId] = (pendingTally[item.inventoryItemId] || 0) + toReserve;
    }
    if (shortage > 0) {
      shortages[item.inventoryItemId] = (shortages[item.inventoryItemId] || 0) + shortage;
    }
  }

  // 2. Build Atomic Updates (only if there's stock to reserve)
  if (Object.keys(pendingTally).length > 0) {
    Object.keys(pendingTally).forEach(itemId => {
      const invItem = inventory.find(i => i.id === itemId);
      if (!invItem) return;
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
  }

  // 3. Update quote status
  const hasActualReservation = Object.keys(pendingTally).length > 0
  const hasShortage = Object.keys(shortages).length > 0
  const newStatus = 'sent'
  const patch: Record<string, unknown> = { stockReserved: hasActualReservation, status: newStatus }
  
  // If shortage exists, update items with shortageQuantity
  if (hasShortage) {
    const updatedItems = quote.items.map(item => {
      const shortage = shortages[item.inventoryItemId || ''] || 0;
      return { ...item, shortageQuantity: shortage };
    });
    patch.items = updatedItems;
  }
  
  updates.push({ resource: 'quotes', id: quote.id, patch });

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
    if (invItem && pendingTally[item.inventoryItemId]) {
      const actualReserved = pendingTally[item.inventoryItemId];
      await createReservationTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: actualReserved,
        reservedBefore: invItem.reservedQuantity || 0,
        reservedAfter: (invItem.reservedQuantity || 0) + actualReserved,
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
      const toRelease = Math.min(item.quantity, currentReserved);
      if (toRelease <= 0) continue;
      const newReserved = currentReserved - toRelease;
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
      const currentReserved = (invItem.reservedQuantity || 0);
      const toRelease = Math.min(item.quantity, currentReserved);
      if (toRelease <= 0) continue;
      await createReleaseTransaction({
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        reservedChange: -toRelease,
        reservedBefore: currentReserved,
        reservedAfter: currentReserved - toRelease,
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
 * Sends a quote email notification.
 * Email dispatch is not implemented — use generateQuotePDF() from pdfService for manual download.
 */
export async function sendQuoteEmail(_quote: Quote): Promise<void> {
  logger.log("[quoteService] sendQuoteEmail — email dispatch not implemented. User can download PDF manually.");
}

/**
 * Sends a follow-up reminder.
 * Email dispatch is not implemented — use generateQuotePDF() from pdfService for manual download.
 */
export async function sendFollowUpReminder(_quote: Quote): Promise<void> {
  logger.log("[quoteService] sendFollowUpReminder — email dispatch not implemented. User can download PDF manually.");
}
