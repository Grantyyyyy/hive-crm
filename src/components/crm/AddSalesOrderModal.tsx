import {
  Dialog,
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
            <ShoppingBag className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-normal">
              Create New Sales Order
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium">
              Log a new transaction and initiate fulfillment
            </p>
          </div>
        </div>
      </DialogHeader>

      <SalesOrderForm
        onSave={handleSave}
        onCancel={() => onOpenChange(false)}
        contacts={contacts}
        inventory={inventory}
        className="flex-1 overflow-auto"
      />
    </Dialog>
  )
}