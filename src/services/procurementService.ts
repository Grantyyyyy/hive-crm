import type { PurchaseRequest, PurchaseOrder, Vendor } from "../lib/types";
import type { JobAdapter } from "./types";
import { generateNumber } from "./types";
import { recalculateStockLevel } from "./inventoryService";
import { createReceiptTransaction } from "./inventoryTransactionService";

/**
 * Approves a Purchase Request and converts it to a Purchase Order.
 */
export async function approvePurchaseRequest(
  requestId: string,
  adapter: JobAdapter
): Promise<PurchaseOrder> {
  const requests = adapter.getPurchaseRequests();
  const request: PurchaseRequest | undefined = requests.find(r => r.id === requestId);
  if (!request) throw new Error("Purchase Request not found");

  // Generate PO Number
  const existingPOs = adapter.getPurchaseOrders().map(p => p.poNumber);
  const poNumber = generateNumber('PO', existingPOs);

  const newPO: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
    poNumber,
    referenceId: request.id, // Using generic reference_id column to link to the source PR
    vendorId: '00000000-0000-0000-0000-000000000000', // NIL UUID to satisfy NOT NULL constraint for draft POs
    vendorName: 'UNASSIGNED VENDOR', // To be filled by procurement team
    items: (request.items && request.items.length > 0)
      ? request.items.map((item, idx) => ({
          id: `po-item-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
          name: item.name || 'Unknown Item',
          description: item.description,
          quantity: item.quantity,
          price: item.estimatedPrice,
          inventoryItemId: item.inventoryItemId
        }))
      : [{
          id: 'po-item-1',
          inventoryItemId: request.inventoryItemId,
          name: request.inventoryItemName || 'Unknown Item',
          quantity: request.requestedQuantity,
          price: request.estimatedPrice
        }],
    amount: request.amount, // Using current types.ts field 'amount'
    status: 'draft',
    date: new Date().toISOString()
  };

  await adapter.updatePurchaseRequest(request.id, { status: 'approved' });
  await adapter.insertPurchaseOrder(newPO);
  await adapter.updatePurchaseRequest(request.id, { status: 'ordered' });

  console.log(`[procurementService] PurchaseOrder ${poNumber} created from PR ${request.requestNumber}`);

  return {
    ...newPO,
    id: 'generated-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as PurchaseOrder;
}

/**
 * Restocks inventory when a Purchase Order is marked as Received.
 * Creates audit trail entries for each stock change.
 */
export async function restockFromPO(
  po: PurchaseOrder,
  adapter: JobAdapter,
  userId?: string,
  userName?: string
): Promise<void> {
  if (po.status !== 'received') return;

  const inventory = adapter.getInventoryItems();

  for (const item of po.items) {
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      const oldQty = invItem.stockQuantity;
      const newQty = oldQty + item.quantity;
      const newLevel = recalculateStockLevel(newQty, invItem.reservedQuantity);

      await adapter.updateInventoryItem(invItem.id, {
        stockQuantity: newQty,
        stockLevel: newLevel
      });

      // Create audit trail entry
      try {
        await createReceiptTransaction({
          inventoryItemId: invItem.id,
          inventoryItemName: invItem.name,
          quantityChange: item.quantity,
          quantityBefore: oldQty,
          quantityAfter: newQty,
          referenceId: po.id,
          referenceNumber: po.poNumber,
          reason: `Received from PO ${po.poNumber}`,
          userId: userId || 'system',
          userName: userName || 'System'
        }, adapter);
      } catch (e) {
        console.error('[procurementService] Failed to create audit trail for receipt:', e);
        // Don't fail the receipt if audit trail fails - just log it
      }

      console.log(`[procurementService] Inventory restocked: ${invItem.name} +${item.quantity} units → new qty: ${newQty}`);
    }
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
  console.log(`[procurementService] RECIPIPIENT: ${vendor.email || 'system-default-procurement'}`);
  
  // 2. Update the PO status
  await adapter.updatePurchaseOrder(po.id, { 
    status: 'sent',
    updatedAt: new Date().toISOString()
  });

  // 3. Optional: link back to PR if needed
  if (po.purchaseRequestId) {
    await adapter.updatePurchaseRequest(po.purchaseRequestId, { status: 'ordered' });
  }

  console.log(`[procurementService] PO ${po.poNumber} successfully transmitted.`);
}
