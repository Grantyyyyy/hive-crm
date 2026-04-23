import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, AlertCircle, PackageX, Truck, ShieldAlert, Hash } from "lucide-react"
import { useCRMResource } from "@/lib/hooks"
import { createReturnToSupplier } from "@/services/procurementService"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import { useUser } from "@/lib/AuthContext"
import { toast } from "sonner"
import type { JobAdapter } from "@/services/types"
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, InventoryTransaction, Task, PurchaseReceipt, PurchaseReceiptItem, PurchaseOrder, ReturnToSupplier } from "@/lib/types"

interface ReturnToSupplierModalProps {
  lineItem: any // The row from PurchaseOrderDetail historyRows
  onClose: () => void
  onSuccess: () => void
}

export function ReturnToSupplierModal({ lineItem, onClose, onSuccess }: ReturnToSupplierModalProps) {
  const { user } = useUser()
  const ctx = useCRMContext()
  const [, navigate] = useLocation()
  
  const { data: receipts } = useCRMResource<PurchaseReceipt>('purchase_receipts')
  const { data: receiptItems } = useCRMResource<PurchaseReceiptItem>('purchase_receipt_items')
  const { data: inventory } = useCRMResource<InventoryItem>('inventory')
  const { data: rtsList } = useCRMResource<ReturnToSupplier>('return_to_suppliers')

  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [vendorReference, setVendorReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Maximum quantity that can be returned from this specific receipt line
  const availableToReturn = lineItem.quantityAccepted - (lineItem.returnedQuantity || 0)

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0]),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    updateSalesOrderItem: async (orderId, itemId, patch) => {
      const order = ctx.getResource<SalesOrder>('orders').data.find(o => o.id === orderId);
      if (!order) return;
      const updatedItems = order.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<SalesOrder>(ctx, 'orders', orderId, { items: updatedItems });
    },
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0]),
    getInventoryItems: () => inventory,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0]),
    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    updatePurchaseOrderItem: async (poId, itemId, patch) => {
      const po = ctx.getResource<PurchaseOrder>('purchase_orders').data.find(p => p.id === poId);
      if (!po) return;
      const updatedItems = po.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', poId, { items: updatedItems as any });
    },
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0]),
    getPurchaseReceipts: () => receipts,
    getPurchaseReceiptItems: () => receiptItems,
    insertPurchaseReceipt: (receipt) => insertRows<PurchaseReceipt>(ctx, 'purchase_receipts', [receipt as any]).then(rows => rows[0]),
    insertPurchaseReceiptItem: (item) => insertRows<PurchaseReceiptItem>(ctx, 'purchase_receipt_items', [item as any]).then(rows => rows[0]),
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),
    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
    getReturnToSuppliers: () => rtsList,
    insertReturnToSupplier: (rts) => insertRows<ReturnToSupplier>(ctx, 'return_to_suppliers', [rts as any]).then(rows => rows[0]),
    updateReturnToSupplier: (id, patch) => updateRow<ReturnToSupplier>(ctx, 'return_to_suppliers', id, patch),
    runAtomicUpdate: (ops) => ctx.runAtomicUpdate(ops),
  }), [ctx, receipts, receiptItems, inventory, rtsList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (quantity < 1) {
        toast.error("Invalid quantity", { description: "You must return at least 1 unit." });
        return;
    }
    if (quantity > availableToReturn) {
        toast.error("Return limit exceeded", { description: `You can only return up to ${availableToReturn} units from this receipt.` });
        return;
    }

    setIsSubmitting(true)
    try {
      await createReturnToSupplier({
        receiptItemId: lineItem.id,
        quantity,
        reason,
        vendorReference,
        userId: user.id,
        userName: user.email || 'System User'
      }, adapter)
      
      toast.success("Return initiated", {
        description: `${quantity} units of ${lineItem.itemName} have been deducted from inventory.`
      })
      onSuccess()
    } catch (e: any) {
      const isStockError = e.message.includes("units in stock") // matches our new shortened message
      toast.error(isStockError ? "Stock Level Conflict" : "Process Failed", { 
        description: e.message,
        action: isStockError ? {
          label: "Verify Stock",
          onClick: () => navigate(`/inventory/${lineItem.inventoryItemId}`)
        } : undefined,
        // High-contrast custom styles for the internal action button if possible, 
        // but sonner usually handles action styling. We'll ensure it's not hidden.
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-md border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="px-6 py-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <RotateCcw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Return to Supplier</DialogTitle>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Inventory Reverse Credit</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Context */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
            <div className="size-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
               <PackageX className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Returning Part</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{lineItem.itemName}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {lineItem.receiptNumber}</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {fmt(lineItem.unitCost)} / unit</span>
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Return Quantity</Label>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">Available: {availableToReturn}</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max={availableToReturn}
                  value={quantity === 0 ? "" : quantity}
                  placeholder="Enter quantity..."
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value)
                    setQuantity(Math.min(val, availableToReturn))
                  }}
                  className="pl-3 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">RMA / Vendor Ref # (Optional)</Label>
              <Input
                placeholder="Ex: RMA-12345"
                value={vendorReference}
                onChange={e => setVendorReference(e.target.value)}
                className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Reason for Return</Label>
              <Textarea
                placeholder="Ex: Defective batch, wrong specification..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="min-h-[100px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Warning Flag */}
          <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
             <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
             <p className="text-[10px] leading-relaxed text-orange-700 dark:text-orange-400 font-medium">
               <strong>Financial Impact:</strong> Returning this stock will immediately decrease your inventory ledger and trigger a Moving Average Cost (MAC) recalculation. This action is irreversible.
             </p>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outlineNeutral"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl h-11 text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || quantity < 1 || quantity > availableToReturn}
              className="rounded-xl h-11 text-xs font-bold uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 dark:shadow-none"
            >
              {isSubmitting ? "Processing..." : "Confirm Return"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
