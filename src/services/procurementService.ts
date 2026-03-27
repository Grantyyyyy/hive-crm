import type { PurchaseRequest, PurchaseOrder } from "../lib/types";
import type { JobAdapter } from "./types";
import { generateNumber } from "./types";
import { recalculateStockLevel } from "./inventoryService";

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
    purchaseRequestId: request.id,
    vendorId: '', // To be filled by procurement team
    vendorName: '', // To be filled by procurement team
    items: [{
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
 */
export async function restockFromPO(po: PurchaseOrder, adapter: JobAdapter): Promise<void> {
  if (po.status !== 'received') return;

  const inventory = adapter.getInventoryItems();

  for (const item of po.items) {
    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      const newQty = invItem.stockQuantity + item.quantity;
      const newLevel = recalculateStockLevel(newQty);

      await adapter.updateInventoryItem(invItem.id, {
        stockQuantity: newQty,
        stockLevel: newLevel
      });

      console.log(`[procurementService] Inventory restocked: ${invItem.name} +${item.quantity} units → new qty: ${newQty}`);
    }
  }
}
