import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { QuoteForm } from "./QuoteForm"
import { contactsApi, quotesApi } from "@/lib/api"
import type { Contact, Quote } from "@/lib/types"
import { FileText } from "lucide-react"

interface AddQuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (quote: Quote) => void
}

export function AddQuoteModal({ open, onOpenChange, onSuccess }: AddQuoteModalProps) {
  const { user } = useUser()
  const userId = user?.id ?? ""
  
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    async function fetchData() {
      if (open && userId) {
        try {
          const contactsRes = await contactsApi.list({ limit: 100 })
          if (contactsRes.success && contactsRes.data) {
            setContacts(contactsRes.data)
          }
        } catch (error) {
          console.error('Error fetching contacts:', error)
        }
      }
    }
    fetchData()
  }, [open, userId])

  const handleSave = async (quote: Partial<Quote>) => {
    try {
      const response = await quotesApi.create(quote as any)
      if (response.success && response.data) {
        onOpenChange(false)
        if (onSuccess) onSuccess(response.data)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-8 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <FileText className="size-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Create New Quote
              </SheetTitle>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                Draft a new sales proposal for your customer
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <QuoteForm 
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            contacts={contacts}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
