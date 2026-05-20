import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QuoteForm } from "./QuoteForm"
import { useCRMContext, insertRows } from "@/lib/CRMContext"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Quote, InventoryItem } from "@/lib/types"
import { sendQuoteEmail, reserveStockForQuote } from "@/services/quoteService"
import { generateNumber } from "@/services/types"
import { FileText, X } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/lib/AuthContext"

interface AddQuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (quote: Quote) => void
}

export function AddQuoteModal({ open, onOpenChange, onSuccess }: AddQuoteModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const ctx = useCRMContext()
  const { user } = useUser()
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: inventory } = useCRMResource<InventoryItem>('inventory')
  const { data: quotes } = useCRMResource<Quote>('quotes')

  const handleSave = async (quote: Quote) => {
    setIsSaving(true)
    try {
      const existingNumbers = quotes.map(q => q.quoteNumber)
      quote.quoteNumber = generateNumber('QT', existingNumbers)

      // 1. Insert the quote
      const [newQuote] = await insertRows<Quote>(ctx, 'quotes', [quote])

      // 2. If 'sent', trigger atomic reservation
      if (newQuote.status === 'sent') {
        sendQuoteEmail(newQuote)
        await reserveStockForQuote(newQuote, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      }

      toast.success("Quote Created", {
        description: `Estimate ${quote.quoteNumber} has been logged successfully.`,
      })

      onOpenChange(false)
      if (onSuccess) onSuccess(newQuote)
    } catch (error: any) {
      toast.error("Process Failed", { 
        description: error.message || "Failed to finalize quote. Please retry." 
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
          className="absolute right-6 top-6 z-50 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="size-5" />
        </button>

        <DialogHeader className="px-10 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shrink-0 m-0">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-3xl bg-accent-dim flex items-center justify-center shrink-0 border border-accent/10 shadow-inner">
              <FileText className="size-8 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight italic">
                Compose Quote
              </DialogTitle>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">
                Draft a new high-value sales estimate for your customer
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          {open && (
            <QuoteForm
              onSave={handleSave}
              onCancel={() => onOpenChange(false)}
              contacts={contacts}
              inventory={inventory}
              isSaving={isSaving}
              className="flex-1"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
