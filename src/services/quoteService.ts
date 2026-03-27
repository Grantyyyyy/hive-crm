import type { Quote, SalesOrder, QuoteItem, OrderItem } from "../lib/types";
import type { JobAdapter } from "./types";
import { generateNumber } from "./types";

/**
 * Generates the next Quote number (QT-YYYY-XXXX).
 */
export function getNextQuoteNumber(adapter: JobAdapter): string {
  const existing = adapter.getQuotes().map(q => q.quoteNumber);
  return generateNumber('QT', existing);
}

/**
 * Checks for out-of-stock items in a list of quote/order items.
 * returns names of out-of-stock items.
 */
export function blockOutOfStockItems(items: (QuoteItem | OrderItem)[], adapter: JobAdapter): string[] {
  const inventory = adapter.getInventoryItems();
  const outOfStock: string[] = [];

  for (const item of items) {
    if (item.inventoryItemId) {
      const invItem = inventory.find(i => i.id === item.inventoryItemId);
      if (invItem && invItem.stockLevel === 'out_of_stock') {
        outOfStock.push(item.name);
      }
    }
  }

  return outOfStock;
}

/**
 * Converts a Quote to a Sales Order if all items are in stock.
 */
export async function acceptQuote(quoteId: string, adapter: JobAdapter): Promise<SalesOrder> {
  const quotes = adapter.getQuotes();
  const quote = quotes.find(q => q.id === quoteId);
  if (!quote) throw new Error("Quote not found");

  const outOfStock = blockOutOfStockItems(quote.items, adapter);
  if (outOfStock.length > 0) {
    throw new Error(`The following items are out of stock: ${outOfStock.join(', ')}. Remove them before proceeding.`);
  }

  // Generate SO Number
  const existingOrders = adapter.getSalesOrders().map(o => o.orderNumber);
  const orderNumber = generateNumber('SO', existingOrders);

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
    stockDeducted: false
  };

  await adapter.updateQuote(quote.id, { status: 'accepted' });
  
  return await adapter.insertSalesOrder(newOrder);
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
