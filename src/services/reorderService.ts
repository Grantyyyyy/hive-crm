import type { InventoryItem, PurchaseRequest, PurchaseRequestItem } from "@/lib/types"
import type { JobAdapter } from "./types"

export function prepareReorderDraftData(
  items: InventoryItem[],
  userId: string,
  userName: string
): Partial<PurchaseRequest> {
  const prItems: PurchaseRequestItem[] = items.map(item => ({
    id: crypto.randomUUID(),
    name: item.name,
    description: `Auto-reorder for SKU: ${item.sku}`,
    quantity: item.reorderQuantity || Math.max(0, (item.reorderThreshold || 0) * 2 - item.stockQuantity),
    estimatedPrice: item.price,
    inventoryItemId: item.id,
    trackInInventory: true,
    vendorId: "",
    vendorName: ""
  }))

  const totalAmount = prItems.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)

  return {
    requesterId: userId,
    requesterName: userName,
    amount: totalAmount,
    status: 'draft',
    date: new Date().toISOString(),
    department: 'Inventory Management',
    items: prItems,
    justification: `Automated reorder for ${items.length} low-stock items.`,
    urgent: items.some(i => i.stockQuantity === 0),
    purpose: 'Stock Replenishment',
    priority: items.some(i => i.stockQuantity === 0) ? 'high' : 'medium',
  }
}

export async function createReorderDraft(
  items: InventoryItem[],
  adapter: JobAdapter,
  userId: string,
  userName: string
): Promise<PurchaseRequest> {
  if (items.length === 0) throw new Error("No items selected for reorder")
  const newPR = prepareReorderDraftData(items, userId, userName)
  return await adapter.insertPurchaseRequest(newPR as any)
}

