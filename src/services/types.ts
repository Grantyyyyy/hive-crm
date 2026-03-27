import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, PurchaseOrder, InventoryTransaction } from "../lib/types";

export const STOCK_THRESHOLDS = {
  low: 10,   // stockQuantity <= 10 → low_stock
  out: 0,    // stockQuantity <= 0  → out_of_stock
};

/**
 * All service functions must accept a JobAdapter instead of importing React context directly.
 * This keeps service files free of React dependencies and makes them portable.
 */
export interface JobAdapter {
  // Quotes
  getQuotes: () => Quote[];
  updateQuote: (id: string, patch: Partial<Quote>) => Promise<void>;
  insertQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Quote>;

  // Sales Orders
  getSalesOrders: () => SalesOrder[];
  updateSalesOrder: (id: string, patch: Partial<SalesOrder>) => Promise<void>;
  insertSalesOrder: (order: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SalesOrder>;

  // Inventory
  getInventoryItems: () => InventoryItem[];
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => Promise<void>;

  // Purchase Requests
  getPurchaseRequests: () => PurchaseRequest[];
  updatePurchaseRequest: (id: string, patch: Partial<PurchaseRequest>) => Promise<void>;
  insertPurchaseRequest: (pr: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseRequest>;

  // Purchase Orders
  getPurchaseOrders: () => PurchaseOrder[];
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => Promise<void>;
  insertPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseOrder>;

  // Inventory Transactions (Audit Trail)
  getInventoryTransactions: () => InventoryTransaction[];
  insertInventoryTransaction: (tx: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<InventoryTransaction>;
}

/**
 * Generates a collision-safe, year-scoped document number.
 * Derives from the max existing sequence for the current year.
 */
export function generateNumber(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{4})$`);
  const max = existing.reduce((acc, n) => {
    const match = n.match(pattern);
    return match ? Math.max(acc, parseInt(match[1])) : acc;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
}
