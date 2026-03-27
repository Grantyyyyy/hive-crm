import type { StockLevel, PurchaseRequest } from "../lib/types";
import type { JobAdapter } from "./types";
import { STOCK_THRESHOLDS, generateNumber } from "./types";

/**
 * Calculates stock level based on quantity and thresholds.
 */
export function recalculateStockLevel(quantity: number): StockLevel {
  if (quantity <= STOCK_THRESHOLDS.out) return 'out_of_stock';
  if (quantity <= STOCK_THRESHOLDS.low) return 'low_stock';
  return 'in_stock';
}

/**
 * Scans inventory for low/out-of-stock items and auto-creates PRs.
 */
export async function checkAndAlertLowStock(adapter: JobAdapter): Promise<void> {
  const inventory = adapter.getInventoryItems();
  const existingPRs = adapter.getPurchaseRequests();

  for (const item of inventory) {
    if (item.stockLevel === 'low_stock' || item.stockLevel === 'out_of_stock') {
      // Check for existing open PR for this item
      const hasOpenPR = existingPRs.some(pr => 
        pr.inventoryItemId === item.id && 
        pr.status !== 'rejected' && 
        pr.status !== 'ordered'
      );

      if (!hasOpenPR) {
        const prNumber = generateNumber('PR', existingPRs.map(p => p.requestNumber));
        
        const newPR: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'> = {
          requestNumber: prNumber,
          inventoryItemId: item.id,
          inventoryItemName: item.name,
          requestedQuantity: 50, // Configurable default
          estimatedPrice: item.price * 0.7, // Estimate lower than selling price
          amount: 50 * (item.price * 0.7),
          justification: `Auto-generated: stock level is ${item.stockLevel}`,
          urgent: item.stockLevel === 'out_of_stock',
          status: 'draft',
          priority: item.stockLevel === 'out_of_stock' ? 'urgent' : 'medium',
          date: new Date().toISOString(),
          requesterId: 'SYSTEM',
          requesterName: 'Automation Engine',
          department: 'Logistics',
          items: [{
            id: 'item-1',
            name: item.name,
            quantity: 50,
            estimatedPrice: item.price * 0.7,
            inventoryItemId: item.id
          }]
        };

        await adapter.insertPurchaseRequest(newPR);
        console.log(`[inventoryService] PurchaseRequest ${prNumber} auto-created for ${item.name} (${item.stockLevel})`);
      }
    }
  }
}
