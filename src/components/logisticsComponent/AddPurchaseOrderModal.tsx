import { useState } from "react"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
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
  const [isSaving, setIsSaving] = useState(false)
  const ctx = useCRMContext()
  const { data: inventoryItems, isLoaded } = useCRMResource<InventoryItem>('inventory')
  const { data: purchaseOrders } = useCRMResource<PurchaseOrder>('purchase_orders')

  const handleSave = async (order: PurchaseOrder) => {
    setIsSaving(true)
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
      toast.error("Process Failed", { 
        description: error.message || "Failed to create order. Please retry." 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 bg-slate-50 dark:bg-slate-950 border-none rounded-md overflow-hidden shadow-2xl flex flex-col">
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-8 z-50 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="size-5" />
      </button>

      <DialogHeader className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-xl bg-accent-dim flex items-center justify-center shrink-0 shadow-sm">
            <ScrollText className="size-5 text-accent" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-normal">
              New Purchase Order
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
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
            isSaving={isSaving}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
            INITIALIZING PROCUREMENT SYSTEM...
          </div>
        )}
      </div>
      </DialogContent>
    </Dialog>
  )
}
