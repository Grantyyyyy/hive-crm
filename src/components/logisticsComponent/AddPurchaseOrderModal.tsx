import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PurchaseOrderForm } from "./PurchaseOrderForm"
import { useCRMContext, insertRows } from "@/lib/CRMContext"
import { useCRMResource } from "@/lib/hooks"
import type { PurchaseOrder, InventoryItem } from "@/lib/types"
import { ScrollText, X } from "lucide-react"
import { toast } from "sonner"
import { generateNumber } from "@/services/types"

interface AddPurchaseOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (order: PurchaseOrder) => void
}

export function AddPurchaseOrderModal({ open, onOpenChange, onSuccess }: AddPurchaseOrderModalProps) {
  const ctx = useCRMContext()
  const { data: inventoryItems, isLoaded } = useCRMResource<InventoryItem>('inventory')
  const { data: purchaseOrders } = useCRMResource<PurchaseOrder>('purchase_orders')

  const handleSave = async (order: PurchaseOrder) => {
    try {
      const existingNumbers = purchaseOrders.map(o => o.poNumber)
      order.poNumber = generateNumber('PO', existingNumbers)

      const [newOrder] = await insertRows<PurchaseOrder>(ctx, 'purchase_orders', [order])

      onOpenChange(false)
      if (onSuccess) onSuccess(newOrder)
      toast.success("Purchase Order Created Successfully", {
        description: `Order ${newOrder.poNumber} has been saved.`
      })
    } catch (error: any) {
      toast.error("Failed to create PO", { description: error.message })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[1100px] w-[95vw] h-[85vh] max-h-[85vh] flex flex-col bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-0"
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-8 z-50 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="size-5" />
      </button>

      <DialogHeader className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0 shadow-sm">
            <ScrollText className="size-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-normal">
              New Purchase Order
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
              Inventory Procurement Management
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-hidden relative">
        {isLoaded ? (
          <PurchaseOrderForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            inventoryItems={inventoryItems}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
            INITIALIZING PROCUREMENT SYSTEM...
          </div>
        )}
      </div>
    </Dialog>
  )
}
