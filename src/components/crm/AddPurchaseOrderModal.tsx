import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PurchaseOrderForm } from "./PurchaseOrderForm"
import { purchaseOrdersApi } from "@/lib/api"
import type { PurchaseOrder } from "@/lib/types"
import { ScrollText } from "lucide-react"

interface AddPurchaseOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (order: PurchaseOrder) => void
}

export function AddPurchaseOrderModal({ open, onOpenChange, onSuccess }: AddPurchaseOrderModalProps) {
  const handleSave = async (order: Partial<PurchaseOrder>) => {
    try {
      const response = await purchaseOrdersApi.create(order as any)
      if (response.success && response.data) {
        onOpenChange(false)
        if (onSuccess) onSuccess(response.data)
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-8 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
              <ScrollText className="size-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                New Purchase Order
              </SheetTitle>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">
                Procurement Management System
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden relative">
          <PurchaseOrderForm 
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
