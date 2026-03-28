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
 * Restocks inventory when a Purchase Order is marked as Received.
 * Creates audit trail entries for each stock change.
 */
export async function restockFromPO(
  po: PurchaseOrder,
  adapter: JobAdapter,
  userId?: string,
  userName?: string
): Promise<void> {
  if (po.status !== 'received' || po.stockReceived === true) return;

  const inventory = adapter.getInventoryItems();

  for (const item of po.items) {
    if (!item.trackInInventory) continue;

    const invItem = inventory.find(i => i.id === item.inventoryItemId);
    if (invItem) {
      const oldQty = invItem.stockQuantity;
      const newQty = oldQty + item.quantity;
      const newLevel = recalculateStockLevel(newQty, invItem.reservedQuantity, invItem.reorderThreshold);

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
      }

      console.log(`[procurementService] Inventory restocked: ${invItem.name} +${item.quantity} units → new qty: ${newQty}`);
    } else {
      // Create new inventory item
      const newItem = await adapter.insertInventoryItem({
        name: item.name,
        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category: 'Uncategorized',
        price: item.price,
        stockQuantity: item.quantity,
        reservedQuantity: 0,
        stockLevel: recalculateStockLevel(item.quantity, 0, undefined),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      try {
        await createReceiptTransaction({
          inventoryItemId: newItem.id,
          inventoryItemName: newItem.name,
          quantityChange: item.quantity,
          quantityBefore: 0,
          quantityAfter: item.quantity,
          referenceId: po.id,
          referenceNumber: po.poNumber,
          reason: `New item created from PO ${po.poNumber}`,
          userId: userId || 'system',
          userName: userName || 'System'
        }, adapter);
      } catch (e) {
        console.error('[procurementService] Failed to create audit trail for new receipt:', e);
      }

      console.log(`[procurementService] New inventory item created: ${newItem.name} with ${item.quantity} units`);
    }
  }

  // Mark PO as processed to prevent double-receipt
  await adapter.updatePurchaseOrder(po.id, { stockReceived: true });
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
