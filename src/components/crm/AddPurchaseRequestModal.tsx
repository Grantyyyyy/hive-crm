import { useUser } from "@clerk/clerk-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PurchaseRequestForm } from "./PurchaseRequestForm"
import { createPurchaseRequest } from "@/lib/storage"
import type { PurchaseRequest } from "@/lib/types"
import { Layers } from "lucide-react"

interface AddPurchaseRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (request: PurchaseRequest) => void
}

export function AddPurchaseRequestModal({ open, onOpenChange, onSuccess }: AddPurchaseRequestModalProps) {
  const { user } = useUser()
  const userId = user?.id ?? ""
  
  const handleSave = (request: PurchaseRequest) => {
    createPurchaseRequest(userId, request)
    onOpenChange(false)
    if (onSuccess) onSuccess(request)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-8 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Layers className="size-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Submit Purchase Request
              </SheetTitle>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium italic">
                Get approval for new procurement needs
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden relative">
          <PurchaseRequestForm 
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
