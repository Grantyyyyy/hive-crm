import type { StockLevel, PurchaseRequest } from "../lib/types";
import type { JobAdapter } from "./types";
import { STOCK_THRESHOLDS, generateNumber } from "./types";
import type { CRMContextValue } from "../lib/CRMContext";
import { insertRows } from "../lib/CRMContext";

/**
 * Calculates stock level based on Available-to-Promise (ATP) units.
 * ATP = Total Physical Stock - Reserved Units
 */
export function recalculateStockLevel(physicalQuantity: number, reservedQuantity: number = 0): StockLevel {
  const available = physicalQuantity - reservedQuantity;
  if (available <= STOCK_THRESHOLDS.out) return 'out_of_stock';
  if (available <= STOCK_THRESHOLDS.low) return 'low_stock';
  return 'in_stock';
}

/**
 * Scans inventory for low/out-of-stock items and auto-creates PRs.
 * Uses ATP (Physical - Reserved) for calculation.
 */
export async function checkAndAlertLowStock(adapter: JobAdapter, ctx: CRMContextValue): Promise<void> {
  const inventory = adapter.getInventoryItems();
  const existingPRs = adapter.getPurchaseRequests();

  for (const item of inventory) {
    const available = item.stockQuantity - (item.reservedQuantity || 0);
    const isOut = available <= STOCK_THRESHOLDS.out;
    const isLow = available <= STOCK_THRESHOLDS.low;

    if (isOut || isLow) {
      // Check for existing open PR for this item
      const hasOpenPR = existingPRs.some(pr => 
        pr.inventoryItemId === item.id && 
        pr.status !== 'rejected' && 
        pr.status !== 'ordered'
      );

      if (!hasOpenPR) {
        const prNumber = generateNumber('PR', existingPRs.map(p => p.requestNumber));
        const restockQty = Math.max(50, (STOCK_THRESHOLDS.low + 20) - available);

        const newPR: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'> = {
          requestNumber: prNumber,
          inventoryItemId: item.id,
          inventoryItemName: item.name,
          requestedQuantity: restockQty,
          estimatedPrice: item.price * 0.7,
          amount: restockQty * (item.price * 0.7),
          justification: `Auto-generated: ATP is ${available} units. (Physical: ${item.stockQuantity}, Reserved: ${item.reservedQuantity || 0})`,
          urgent: isOut,
          status: 'draft',
          priority: isOut ? 'urgent' : 'medium',
          date: new Date().toISOString(),
          requesterId: 'SYSTEM',
          requesterName: 'Automation Engine',
          department: 'Logistics',
          items: [{
            id: 'item-1',
            name: item.name,
            quantity: restockQty,
            estimatedPrice: item.price * 0.7,
            inventoryItemId: item.id
          }]
        };

        await insertRows<PurchaseRequest>(ctx, 'purchase_requests', [newPR as any]);
        console.log(`[inventoryService] PurchaseRequest ${prNumber} auto-created for ${item.name} (ATP: ${available})`);
      }
    }
  }
}
