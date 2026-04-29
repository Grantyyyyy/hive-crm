import type { StockLevel, PurchaseRequest } from "../lib/types";
import type { JobAdapter } from "./types";
import { STOCK_THRESHOLDS, generateNumber } from "./types";
import type { CRMContextValue } from "../lib/CRMContext";
import { insertRows } from "../lib/CRMContext";
import { generateId } from "../lib/helpers";

/**
 * Calculates stock level based on Available-to-Promise (ATP) units.
 * ATP = Total Physical Stock - Reserved Units
 * Uses per-item reorderThreshold if provided, otherwise falls back to global STOCK_THRESHOLDS.low.
 */
export function recalculateStockLevel(
  physicalQuantity: number,
  reservedQuantity: number = 0,
  reorderThreshold?: number
): StockLevel {
  const available = physicalQuantity - reservedQuantity;
  const threshold = reorderThreshold ?? STOCK_THRESHOLDS.low;
  if (available <= STOCK_THRESHOLDS.out) return 'out_of_stock';
  if (available <= threshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Scans inventory for low/out-of-stock items and auto-creates ONE consolidated PR.
 * Uses ATP (Physical - Reserved) for calculation.
 * Uses per-item reorderThreshold if set, otherwise falls back to STOCK_THRESHOLDS.low.
 * 
 * BATCHED: Collects all low-stock items first, then inserts exactly one PR at the end.
 */
export async function checkAndAlertLowStock(adapter: JobAdapter, ctx: CRMContextValue): Promise<void> {
  const inventory = adapter.getInventoryItems();
  const existingPRs = adapter.getPurchaseRequests();

  // Collect all low-stock items into a single batch
  const lowStockItems: PurchaseRequest['items'] = [];
  let hasUrgent = false;

  for (const item of inventory) {
    const available = item.stockQuantity - (item.reservedQuantity || 0);
    const threshold = item.reorderThreshold ?? STOCK_THRESHOLDS.low;
    const isOut = available <= STOCK_THRESHOLDS.out;
    const isLow = available <= threshold;

    if (isOut || isLow) {
      // Check for existing open PR that already covers this item
      const hasOpenPR = existingPRs.some(pr =>
        pr.items.some(prItem => prItem.inventoryItemId === item.id) &&
        pr.status !== 'rejected' &&
        pr.status !== 'ordered'
      );

      if (!hasOpenPR) {
        const restockQty = item.reorderQuantity ?? Math.max(50, (threshold + 20) - available);
        lowStockItems.push({
          id: generateId(),
          name: item.name,
          quantity: restockQty,
          estimatedPrice: item.price * 0.7,
          inventoryItemId: item.id,
        });

        if (isOut) hasUrgent = true;
      }
    }
  }

  // Only insert if there are items to restock
  if (lowStockItems.length === 0) return;

  const totalAmount = lowStockItems.reduce(
    (sum, i) => sum + i.quantity * i.estimatedPrice, 0
  );

  const prNumber = generateNumber('PR', existingPRs.map(p => p.requestNumber));

  const newPR: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'> = {
    requestNumber: prNumber,
    requesterId: 'SYSTEM',
    requesterName: 'Automation Engine',
    department: 'Logistics',
    items: lowStockItems,
    amount: totalAmount,
    justification: `Auto-generated: ${lowStockItems.length} item(s) below restock threshold.`,
    urgent: hasUrgent,
    status: 'draft',
    priority: hasUrgent ? 'urgent' : 'medium',
    date: new Date().toISOString(),
  };

  await insertRows<PurchaseRequest>(ctx, 'purchase_requests', [newPR as any]);
  console.log(`[inventoryService] Consolidated PurchaseRequest ${prNumber} auto-created for ${lowStockItems.length} item(s).`);
}

