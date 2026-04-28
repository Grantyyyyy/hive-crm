import type { InventoryItem, PurchaseRequest, PurchaseRequestItem } from "@/lib/types"
import type { JobAdapter } from "./types"

export async function createReorderDraft(
  items: InventoryItem[],
  adapter: JobAdapter,
  userId: string,
  userName: string
): Promise<PurchaseRequest> {
  if (items.length === 0) throw new Error("No items selected for reorder")

  const prItems: PurchaseRequestItem[] = items.map(item => ({
    id: crypto.randomUUID(),
    name: item.name,
    description: `Auto-reorder for SKU: ${item.sku}`,
    quantity: item.reorderQuantity || Math.max(0, (item.reorderThreshold || 0) * 2 - item.stockQuantity),
    estimatedPrice: item.price,
    inventoryItemId: item.id,
    trackInInventory: true
  }))

  const totalAmount = prItems.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)

  const newPR: Omit<PurchaseRequest, 'id'> = {
    requestNumber: `PR-RE-${Math.floor(1000 + Math.random() * 9000)}`,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return await adapter.insertPurchaseRequest(newPR as any)
}
