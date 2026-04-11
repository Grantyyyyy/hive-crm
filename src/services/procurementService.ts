import type { PurchaseRequest, PurchaseRequestItem, PurchaseOrder, Vendor } from "../lib/types";
import type { JobAdapter } from "./types";
import { generateNumber } from "./types";
import { recalculateStockLevel } from "./inventoryService";
import { createReceiptTransaction } from "./inventoryTransactionService";
import { generateId } from "../lib/helpers";

/**
 * Approves a Purchase Request and converts it to Purchase Orders.
 * Groups items by item-level vendorId and generates one PO per vendor.
 * Items with no vendorId are grouped into a single 'TBD' PO.
 */
export async function approvePurchaseRequest(
  requestId: string,
  adapter: JobAdapter
): Promise<PurchaseOrder[]> {
  const requests = adapter.getPurchaseRequests();
  const request: PurchaseRequest | undefined = requests.find(r => r.id === requestId);
  if (!request) throw new Error("Purchase Request not found");
  if (!request.items || request.items.length === 0) {
    throw new Error("PR has no items — cannot generate PO");
  }

  // Group items by vendorId (undefined/empty → 'unassigned')
  const byVendor = request.items.reduce<Record<string, PurchaseRequestItem[]>>(
    (acc, item) => {
      const key = item.vendorId ?? 'unassigned';
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    },
    {}
  );

  const existingPOs = adapter.getPurchaseOrders().map(p => p.poNumber);
  const createdPOs: PurchaseOrder[] = [];

  await adapter.updatePurchaseRequest(request.id, { status: 'approved' });

  for (const [vendorId, items] of Object.entries(byVendor)) {
    const poNumber = generateNumber('PO', existingPOs);
    existingPOs.push(poNumber);

    const poItems = items.map((item) => ({
      id: generateId(),
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.estimatedPrice,
      inventoryItemId: item.inventoryItemId,
      trackInInventory: item.trackInInventory ?? !!item.inventoryItemId,
    }));

    const totalAmount = poItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

    const newPO: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      poNumber,
      referenceId: request.id,
      vendorId: vendorId === 'unassigned' ? '' : vendorId,
      vendorName: items[0].vendorName ?? 'TBD',
      items: poItems,
      amount: totalAmount,
      status: 'draft',
      date: new Date().toISOString(),
    };

    const created = await adapter.insertPurchaseOrder(newPO);
    createdPOs.push(created);

    console.log(`[procurementService] PO ${poNumber} created from PR ${request.requestNumber} for vendor "${items[0].vendorName ?? 'TBD'}" with ${poItems.length} item(s).`);
  }

  await adapter.updatePurchaseRequest(request.id, { status: 'ordered' });

  return createdPOs;
}

/**
 * Calculates current PO fulfillment based on historical receipts.
 * Returns a projection of total ordered vs total accepted per line item,
 * and the overall PO status.
 */
export function calculatePOFulfillment(
  po: PurchaseOrder,
  receiptItems: import('../lib/types').PurchaseReceiptItem[]
): {
  items: Record<string, { ordered: number, accepted: number, received: number, remaining: number }>;
  status: import('../lib/types').PurchaseOrderStatus;
} {
  const fulfillment: Record<string, { ordered: number, accepted: number, received: number, remaining: number }> = {};

  po.items.forEach(item => {
    fulfillment[item.id] = { ordered: item.quantity, accepted: 0, received: 0, remaining: item.quantity };
  });

  const matchingReceiptItems = receiptItems.filter(ri => fulfillment[ri.poItemId]);

  matchingReceiptItems.forEach(ri => {
    fulfillment[ri.poItemId].accepted += ri.quantityAccepted;
    fulfillment[ri.poItemId].received += ri.quantityReceived;
    fulfillment[ri.poItemId].remaining -= ri.quantityAccepted; // Only accepted items reduce the remaining quantity to receive correctly
  });

  let fullyReceived = true;
  let partiallyReceived = false;

  po.items.forEach(item => {
    const f = fulfillment[item.id];
    // We base status strictly on accepted amounts fulfilling the ordered quantities
    if (f.accepted > 0) partiallyReceived = true;
    if (f.accepted < f.ordered) fullyReceived = false;
  });

  let newStatus = po.status;
  if (fullyReceived) newStatus = 'fully_received';
  else if (partiallyReceived) newStatus = 'partially_received';

  return { items: fulfillment, status: newStatus };
}

/**
 * Creates a new purchase receipt and logs associated inventory updates.
 * Implements strict locks and optimistic concurrency checks.
 */
export async function createPurchaseReceipt(
  params: {
    po: PurchaseOrder;
    receiptNumber: string;
    vendorReference?: string;
    notes?: string;
    userId: string;
    userName?: string;
    items: Array<{
      poItemId: string;
      inventoryItemId?: string;
      quantityReceived: number;
      quantityAccepted: number;
      quantityRejected: number;
      rejectionReason?: import('../lib/types').RejectionReason;
      isReturnable: boolean;
      unitCost: number;
      currency: string;
    }>;
  },
  adapter: JobAdapter
): Promise<void> {
  // 1. Transaction scope - (Simulated here with adapter, but in prod Supabase this would be an RPC with row-locks)
  // FULL PO LOCK scope
  const existingReceipts = adapter.getPurchaseReceipts();

  // 3. IDEMPOTENCY CHECK
  if (existingReceipts.some(r => r.receiptNumber === params.receiptNumber)) {
    throw new Error(`Receipt number ${params.receiptNumber} already exists.`);
  }

  const allReceiptItems = adapter.getPurchaseReceiptItems();

  // 4 & 5. AGGREGATE READ & VALIDATION
  const fulfillment = calculatePOFulfillment(params.po, allReceiptItems);

  params.items.forEach(input => {
    // Math invariant
    if (input.quantityReceived !== input.quantityAccepted + input.quantityRejected) {
      throw new Error(`Invariant violation: Received must equal Accepted + Rejected for item ${input.poItemId}`);
    }
    if (input.quantityReceived < 0 || input.quantityAccepted < 0 || input.quantityRejected < 0) {
      throw new Error(`Invariant violation: Quantities cannot be negative for item ${input.poItemId}`);
    }

    // Limits validation
    const lineFulfillment = fulfillment.items[input.poItemId];
    if (!lineFulfillment) throw new Error(`PO Item ${input.poItemId} not found on PO.`);

    if (lineFulfillment.accepted + input.quantityAccepted > lineFulfillment.ordered) {
      throw new Error(`Aggregate validation failed: Cannot accept more than ordered for item ${input.poItemId}`);
    }
  });

  // 6. WRITE LOG
  const insertedReceipt = await adapter.insertPurchaseReceipt({
    id: generateId(),
    poId: params.po.id,
    receiptNumber: params.receiptNumber,
    vendorReference: params.vendorReference,
    date: new Date().toISOString(),
    notes: params.notes,
    createdBy: params.userId,
  });

  const inventory = adapter.getInventoryItems();

  for (const input of params.items) {
    await adapter.insertPurchaseReceiptItem({
      id: generateId(),
      receiptId: insertedReceipt.id,
      poItemId: input.poItemId,
      inventoryItemId: input.inventoryItemId,
      quantityReceived: input.quantityReceived,
      quantityAccepted: input.quantityAccepted,
      quantityRejected: input.quantityRejected,
      rejectionReason: input.rejectionReason,
      isReturnable: input.isReturnable,
      unitCost: input.unitCost,
      currency: input.currency
    });

    // 7. VALUATION & INVENTORY UPDATE (Only for accepted items!)
    if (input.quantityAccepted > 0 && input.inventoryItemId) {
      const invItem = inventory.find(i => i.id === input.inventoryItemId);
      if (invItem) {
        const oldQty = invItem.stockQuantity;
        const newQty = oldQty + input.quantityAccepted;
        const currentAvg = invItem.movingAverageCost || invItem.price || 0;

        // Zero-Division Guard & MA calculation
        let newAvgCost = input.unitCost;
        if (newQty > 0 && oldQty >= 0) { // Safety: If recovering from negative, just take incoming cost. Or if new is 0...
          newAvgCost = (oldQty * currentAvg + input.quantityAccepted * input.unitCost) / newQty;
        } else {
          console.warn(`[procurementService] Anomaly detected: Negative stock or zero sum encountered. Resetting Moving Average Cost to incoming Unit Cost for item ${invItem.id}`);
        }

        const newLevel = recalculateStockLevel(newQty, invItem.reservedQuantity, invItem.reorderThreshold);

        await adapter.updateInventoryItem(invItem.id, {
          stockQuantity: newQty,
          movingAverageCost: newAvgCost,
          stockLevel: newLevel
        });

        // Log transaction IN
        try {
          await createReceiptTransaction({
            inventoryItemId: invItem.id,
            inventoryItemName: invItem.name,
            quantityChange: input.quantityAccepted,
            quantityBefore: oldQty,
            quantityAfter: newQty,
            unitCost: input.unitCost,
            totalCost: input.quantityAccepted * input.unitCost,
            currency: input.currency,
            referenceId: insertedReceipt.id,
            referenceNumber: params.receiptNumber,
            reason: `PO Receipt ${params.receiptNumber}`,
            userId: params.userId,
            userName: params.userName || params.userId // Fallback to userId if userName not provided
          }, adapter);
        } catch (e) {
          console.error('[procurementService] Failed to log inventory transaction:', e);
        }
      } else {
        console.warn(`[procurementService] Inventory item ${input.inventoryItemId} mapped but not found in DB.`);
      }
    }
  }

  // 8. PO PROJECTION SYNC
  // We compute based on historicals PLUS what we just added.
  const updatedAllItems = [...allReceiptItems, ...params.items.map(i => ({ ...i, id: 'temp', receiptId: insertedReceipt.id }))];
  const { status: newStatus } = calculatePOFulfillment(params.po, updatedAllItems as any);

  if (newStatus !== params.po.status) {
    await adapter.updatePurchaseOrder(params.po.id, { status: newStatus, updatedAt: new Date().toISOString() });
  }
}


/**
 * Sends a Purchase Order to a vendor and handles notifications.
 */
export async function sendPOToVendor(
  po: PurchaseOrder,
  vendor: Vendor,
  adapter: JobAdapter
): Promise<void> {
  if (po.status !== 'pending' && po.status !== 'draft') {
    throw new Error(`Cannot send PO in ${po.status} status`);
  }

  // 1. Simulate external communication (Email, API, etc.)
  console.log(`[procurementService] DISPATCHING PO ${po.poNumber} to ${vendor.name}`);
  console.log(`[procurementService] RECIPIENT: ${vendor.email || 'system-default-procurement'}`);

  // 2. Update the PO status
  await adapter.updatePurchaseOrder(po.id, {
    status: 'sent',
    updatedAt: new Date().toISOString()
  });

  // 3. Optional: link back to PR if needed
  if (po.referenceId) {
    await adapter.updatePurchaseRequest(po.referenceId, { status: 'ordered' });
  }

  console.log(`[procurementService] PO ${po.poNumber} successfully transmitted.`);
}

/**
 * Consolidates all approved PRs by item-level vendor and generates one PO per vendor.
 * Groups items across all approved PRs by item.vendorId, creating consolidated POs.
 * Items with no vendorId are grouped into a single 'TBD' PO.
 */
export async function consolidatePRsToPOs(
  adapter: JobAdapter
): Promise<{ vendorName: string; poNumber: string; itemCount: number }[]> {
  const prs = adapter.getPurchaseRequests().filter(
    pr => pr.status === 'approved'
  );

  if (prs.length === 0) return [];

  // Flatten all items across all approved PRs, tagging with source PR id
  const allItems = prs.flatMap(pr =>
    pr.items.map(item => ({ ...item, sourcePRId: pr.id }))
  );

  // Group by item-level vendorId
  const byVendor = allItems.reduce<Record<string, (PurchaseRequestItem & { sourcePRId: string })[]>>(
    (acc, item) => {
      const key = item.vendorId ?? 'unassigned';
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    },
    {}
  );

  const existingPOs = adapter.getPurchaseOrders().map(p => p.poNumber);
  const results: { vendorName: string; poNumber: string; itemCount: number }[] = [];

  for (const [vendorId, items] of Object.entries(byVendor)) {
    const poItems = items.map(item => ({
      id: generateId(),
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.estimatedPrice,
      inventoryItemId: item.inventoryItemId,
      trackInInventory: item.trackInInventory ?? !!item.inventoryItemId,
    }));

    const totalAmount = poItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const poNumber = generateNumber('PO', existingPOs);
    existingPOs.push(poNumber);

    await adapter.insertPurchaseOrder({
      poNumber,
      vendorId: vendorId === 'unassigned' ? '' : vendorId,
      vendorName: items[0].vendorName ?? 'TBD',
      status: 'draft',
      items: poItems,
      amount: totalAmount,
      date: new Date().toISOString(),
    });

    // Mark all source PRs as ordered
    const sourcePRIds = [...new Set(items.map(i => i.sourcePRId))];
    for (const prId of sourcePRIds) {
      await adapter.updatePurchaseRequest(prId, { status: 'ordered' });
    }

    results.push({
      vendorName: items[0].vendorName ?? vendorId,
      poNumber,
      itemCount: poItems.length,
    });

    console.log(`[procurementService] Consolidated PO ${poNumber} for vendor "${items[0].vendorName ?? 'TBD'}" with ${poItems.length} item(s) from ${sourcePRIds.length} PR(s).`);
  }

  return results;
}
