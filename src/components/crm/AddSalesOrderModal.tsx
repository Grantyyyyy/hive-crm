import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SalesOrderForm } from "./SalesOrderForm"
import { getContacts, createOrder } from "@/lib/storage"
import type { Contact, SalesOrder } from "@/lib/types"
import { ShoppingBag } from "lucide-react"

interface AddSalesOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (order: SalesOrder) => void
}

export function AddSalesOrderModal({ open, onOpenChange, onSuccess }: AddSalesOrderModalProps) {
  const { user } = useUser()
  const userId = user?.id ?? ""
  
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (open && userId) {
      setContacts(getContacts(userId))
    }
  }, [open, userId])

  const handleSave = (order: SalesOrder) => {
    createOrder(userId, order)
    onOpenChange(false)
    if (onSuccess) onSuccess(order)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-8 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <ShoppingBag className="size-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Create New Sales Order
              </SheetTitle>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                Log a new transaction and initiate fulfillment
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <SalesOrderForm 
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            contacts={contacts}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
