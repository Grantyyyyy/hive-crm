import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { PurchaseRequest, InventoryItem } from "@/lib/types"
import { Layers, Package, User, Calendar, AlertTriangle, CheckCircle2, XCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface PurchaseRequestReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: PurchaseRequest | null
  onApprove: (request: PurchaseRequest) => Promise<void>
  onReject: (request: PurchaseRequest) => Promise<void>
  inventoryItems?: InventoryItem[]
}

export function PurchaseRequestReviewModal({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject,
  inventoryItems = []
}: PurchaseRequestReviewModalProps) {
  if (!request) return null

  const totalEstimate = request.items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)

  // Find linked inventory item from the first item with an inventoryItemId
  const firstLinkedItemId = request.items.find(i => i.inventoryItemId)?.inventoryItemId
  const inventoryItem = firstLinkedItemId ? inventoryItems.find(i => i.id === firstLinkedItemId) : undefined
  const atp = inventoryItem ? inventoryItem.stockQuantity - (inventoryItem.reservedQuantity || 0) : null

  const handleApprove = async () => {
    await onApprove(request)
    onOpenChange(false)
  }

  const handleReject = async () => {
    await onReject(request)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-accent-dim flex items-center justify-center">
                <Layers className="size-6 text-accent" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  Review Purchase Request
                </SheetTitle>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                  {request.requestNumber} • Submitted {new Date(request.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 pb-40">

          {/* Requester Info */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <User className="size-3.5" />
                Requester Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{request.requesterName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{request.department}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar className="size-3.5" />
                Timeline
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {new Date(request.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </section>

          {/* Inventory Context (if linked) */}
          {inventoryItem && (
            <section className="p-5 rounded-2xl bg-accent-dim border border-accent/10 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                <Package className="size-3.5" />
                Linked Inventory Item
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Item</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{inventoryItem.name}</p>
                  <p className="text-[10px] text-slate-500">SKU: {inventoryItem.sku}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current ATP</p>
                  <p className={cn(
                    "text-lg font-black",
                    atp && atp <= 0 ? "text-rose-600" :
                      atp && atp <= 10 ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {atp} units
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {inventoryItem.stockQuantity} physical / {inventoryItem.reservedQuantity || 0} reserved
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock Level</p>
                  <StockLevelBadge level={inventoryItem.stockLevel} />
                </div>
              </div>
            </section>
          )}

          {/* Requested Items */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Package className="size-3.5" />
              Requested Items
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3 w-24 text-center">Quantity</th>
                    <th className="px-5 py-3 w-32 text-right">Est. Price</th>
                    <th className="px-5 py-3 w-32 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {request.items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                        {item.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.quantity}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          ${item.estimatedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ${(item.quantity * item.estimatedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td colSpan={3} className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Total Estimated Amount
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-lg font-black text-accent">
                        ${totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Justification */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <FileText className="size-3.5" />
              Justification
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {request.justification || request.purpose || "No justification provided."}
              </p>
            </div>
          </section>

          {/* Policy Alert for High-Value Requests */}
          {request.amount >= 5000 && (
            <section className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex items-start gap-4">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  High-Value Request
                </p>
                <p className="text-xs text-amber-800/70 dark:text-amber-300/60 font-medium leading-relaxed">
                  This request exceeds $5,000 and requires CFO approval before processing. Please verify budget availability.
                </p>
              </div>
            </section>
          )}

          {/* Urgent Alert */}
          {request.urgent && (
            <section className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 flex items-start gap-4">
              <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wide text-rose-700 dark:text-rose-400">
                  Urgent Request
                </p>
                <p className="text-xs text-rose-800/70 dark:text-rose-300/60 font-medium leading-relaxed">
                  This request has been marked as urgent. Immediate attention is recommended.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 px-8 py-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              ${totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outlineNeutral"
              onClick={handleReject}
              className="rounded-xl px-6 font-bold text-[11px] uppercase tracking-widest border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <XCircle className="size-4 mr-2" /> Reject
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={request.status !== 'pending_review'}
              className="rounded-xl px-8 font-bold text-[11px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="size-4 mr-2" /> Approve
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatusBadge({ status }: { status: PurchaseRequest['status'] }) {
  const styles: Record<PurchaseRequest['status'], string> = {
    pending_review: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    approved: "bg-accent-dim text-accent border-accent/20",
    rejected: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    ordered: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  }

  const labels: Record<PurchaseRequest['status'], string> = {
    pending_review: "Pending Review",
    draft: "Draft",
    approved: "Approved",
    rejected: "Rejected",
    ordered: "Ordered",
  }

  return (
    <span className={cn(
      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
      styles[status]
    )}>
      {labels[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: PurchaseRequest['priority'] }) {
  const styles: Record<PurchaseRequest['priority'], string> = {
    low: "text-slate-400",
    medium: "text-amber-500",
    high: "text-orange-600",
    urgent: "text-rose-600"
  }
  return (
    <span className={cn(
      "text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
      styles[priority]
    )}>
      {priority === 'urgent' && <AlertTriangle className="size-3" />}
      {priority}
    </span>
  )
}

function StockLevelBadge({ level }: { level: 'in_stock' | 'low_stock' | 'out_of_stock' }) {
  const styles = {
    in_stock: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    low_stock: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    out_of_stock: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  }
  const labels = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  }
  return (
    <span className={cn(
      "px-2 py-1 rounded-md text-[10px] font-bold",
      styles[level]
    )}>
      {labels[level]}
    </span>
  )
}
