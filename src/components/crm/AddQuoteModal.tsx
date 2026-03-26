import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QuoteForm } from "./QuoteForm"
import { useCRMContext, insertRows } from "@/lib/CRMContext"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Quote, InventoryItem } from "@/lib/types"
import { FileText, X } from "lucide-react"

interface AddQuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (quote: Quote) => void
}

export function AddQuoteModal({ open, onOpenChange, onSuccess }: AddQuoteModalProps) {
  const ctx = useCRMContext()
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: inventory } = useCRMResource<InventoryItem>('inventory')

  const handleSave = async (quote: Quote) => {
    try {
      await insertRows(ctx, 'quotes', [quote])
      onOpenChange(false)
      if (onSuccess) onSuccess(quote)
    } catch (error) {
      console.error("Failed to save quote:", error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[1100px] w-[95vw] h-[85vh] max-h-[85vh] flex flex-col bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-0"
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-8 z-50 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="size-5" />
      </button>

      <DialogHeader className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
            <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-normal">
              Create New Quote
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium">
              Draft a new sales proposal for your customer
            </p>
          </div>
        </div>
      </DialogHeader>

      <QuoteForm
        onSave={handleSave}
        onCancel={() => onOpenChange(false)}
        contacts={contacts}
        inventory={inventory}
        className="flex-1 overflow-auto"
      />
    </Dialog>
  )
}
