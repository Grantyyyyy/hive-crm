import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { InventoryItemForm } from "./InventoryItemForm"
import { useCRMContext, insertRows } from "@/lib/CRMContext"
import type { InventoryItem } from "@/lib/types"
import { toast } from "sonner"

interface AddInventorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (item: InventoryItem) => void
}

export function AddInventorySheet({ open, onOpenChange, onSuccess }: AddInventorySheetProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
      >
        <SheetHeader className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
              New Inventory Product
            </SheetTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              Product Catalog Management
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative">
          <InventoryItemForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
