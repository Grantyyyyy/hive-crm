import type { SalesOrder } from "../lib/types";
import type { JobAdapter } from "./types";
import { checkAndAlertLowStock, recalculateStockLevel } from "./inventoryService";

/**
 * Deducts stock from inventory for a shipped Sales Order.
 */
export async function deductStock(order: SalesOrder, adapter: JobAdapter): Promise<void> {
  if (order.stockDeducted) return;

  const inventory = adapter.getInventoryItems();

  for (const item of order.items) {
    let invItem = null;
    if (item.inventoryItemId) {
      invItem = inventory.find(i => i.id === item.inventoryItemId);
    } else {
      // Fallback: match by name for legacy data or loose items
      invItem = inventory.find(i => i.name === item.name);
    }

    if (invItem) {
      const newQty = Math.max(0, invItem.stockQuantity - item.quantity);
      const newLevel = recalculateStockLevel(newQty);
      
      await adapter.updateInventoryItem(invItem.id, {
        stockQuantity: newQty,
        stockLevel: newLevel
      });
      
      console.log(`[orderService] Stock deducted for ${invItem.name}: -${item.quantity} units → new qty: ${newQty}`);
    } else {
      console.warn(`[orderService] Could not find inventory item for "${item.name}" (ID: ${item.inventoryItemId})`);
    }
  }

  await adapter.updateSalesOrder(order.id, { stockDeducted: true });
  await checkAndAlertLowStock(adapter);
}

/**
 * Restores stock to inventory for a cancelled Sales Order.
 */
export async function restoreStock(order: SalesOrder, adapter: JobAdapter): Promise<void> {
  if (!order.stockDeducted) return;

  const inventory = adapter.getInventoryItems();

  for (const item of order.items) {
    let invItem = null;
    if (item.inventoryItemId) {
      invItem = inventory.find(i => i.id === item.inventoryItemId);
    } else {
      invItem = inventory.find(i => i.name === item.name);
    }

    if (invItem) {
      const newQty = invItem.stockQuantity + item.quantity;
      const newLevel = recalculateStockLevel(newQty);

      await adapter.updateInventoryItem(invItem.id, {
        stockQuantity: newQty,
        stockLevel: newLevel
      });
      
      console.log(`[orderService] Stock restored for ${invItem.name}: +${item.quantity} units → new qty: ${newQty}`);
    }
  }

  await adapter.updateSalesOrder(order.id, { stockDeducted: false });
}

/**
 * Sends a shipping notification email stub.
 */
export function sendShippingNotification(order: SalesOrder) {
  // TODO: Implement actual email sending
  console.log(`[orderService] Sending Shipping Notification for Order ${order.orderNumber}`);
}

/**
 * Generates an invoice and emails the customer.
 */
export function generateInvoice(order: SalesOrder) {
  // TODO: Implement PDF generation and email dispatch
  console.log(`[orderService] Generating Invoice for Delivered Order ${order.orderNumber}`);
}
