import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { InventoryItemForm } from "./InventoryItemForm"
import { useCRMContext, updateRow } from "@/lib/CRMContext"
import type { InventoryItem } from "@/lib/types"
import { toast } from "sonner"

interface EditInventorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onSuccess?: (item: InventoryItem) => void
}

export function EditInventorySheet({ open, onOpenChange, item, onSuccess }: EditInventorySheetProps) {
  const ctx = useCRMContext()

  const handleSave = async (updatedItem: InventoryItem) => {
    try {
      // We only want to send the changed fields or the whole object minus id/createdAt if updateRow handles it.
      // Actually updateRow in CRMContext.tsx takes a patch.
      const { id, createdAt, updatedAt, ...patch } = updatedItem as any
      await updateRow<InventoryItem>(ctx, 'inventory', item.id, patch)

      onOpenChange(false)
      if (onSuccess) onSuccess(updatedItem)
      toast.success("Product Updated", {
        description: `${updatedItem.name} has been updated successfully.`
      })
    } catch (error: any) {
      toast.error("Failed to update product", { description: error.message })
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
              Edit Product Details
            </SheetTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
              SKU: {item.sku}
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative">
          <InventoryItemForm
            initialData={item}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
