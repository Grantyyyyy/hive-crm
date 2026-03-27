import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InventoryItemForm } from "./InventoryItemForm"
import { useCRMContext, insertRows } from "@/lib/CRMContext"
import type { InventoryItem } from "@/lib/types"
import { Package, X } from "lucide-react"
import { toast } from "sonner"

interface AddInventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (item: InventoryItem) => void
}

export function AddInventoryModal({ open, onOpenChange, onSuccess }: AddInventoryModalProps) {
  const ctx = useCRMContext()

  const handleSave = async (item: InventoryItem) => {
    try {
      const [newItem] = await insertRows<InventoryItem>(ctx, 'inventory', [item])
      
      onOpenChange(false)
      if (onSuccess) onSuccess(newItem)
      toast.success("Product Created Successfully", {
        description: `${newItem.name} has been added to the catalog.`
      })
    } catch (error: any) {
      toast.error("Failed to create product", { description: error.message })
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      className="max-w-[800px] w-[95vw] h-[80vh] max-h-[80vh] flex flex-col bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-0"
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-8 z-50 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="size-5" />
      </button>

      <DialogHeader className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 shadow-sm">
            <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-normal">
              New Inventory Product
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              Product Catalog Management
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-hidden relative">
        <InventoryItemForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
        />
      </div>
    </Dialog>
  )
}
