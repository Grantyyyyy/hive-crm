import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SalesOrderForm } from "./SalesOrderForm"
import { useCRMContext } from "@/lib/CRMContext"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, SalesOrder, InventoryItem } from "@/lib/types"
import { generateNumber } from "@/services/types"
import { createOrderWithReservation } from "@/services/orderService"
import { toast } from "sonner"
import { ShoppingBag, X } from "lucide-react"

interface AddSalesOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (order: SalesOrder) => void
}

export function AddSalesOrderModal({ open, onOpenChange, onSuccess }: AddSalesOrderModalProps) {

  const ctx = useCRMContext()
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: inventory } = useCRMResource<InventoryItem>('inventory')
  const { data: orders } = useCRMResource<SalesOrder>('orders')

  const handleSave = async (order: SalesOrder) => {
    try {
      const existingNumbers = orders.map(v => v.orderNumber)
      order.orderNumber = generateNumber('SO', existingNumbers)
      
      await createOrderWithReservation(order, ctx)
      
      onOpenChange(false)
      if (onSuccess) onSuccess(order)
    } catch (error: any) {
      toast.error("Failed to create order", { 
        description: error.message || "An unexpected error occurred." 
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 bg-slate-50 dark:bg-slate-950 border-none rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 z-50 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="size-5" />
        </button>

        <DialogHeader className="px-10 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shrink-0 m-0">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-3xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0 border border-teal-100/50 dark:border-teal-800/50 shadow-inner">
              <ShoppingBag className="size-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight italic">
                Compose Order
              </DialogTitle>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">
                Log a new transaction and initiate high-efficiency fulfillment
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          <SalesOrderForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            contacts={contacts}
            inventory={inventory}
            className="flex-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}