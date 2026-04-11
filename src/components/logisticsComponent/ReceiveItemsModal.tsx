import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Hash, AlertCircle, FileText, CheckCircle2, XCircle, AlertTriangle, XOctagon, Timer, PackageX, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PurchaseOrder, PurchaseReceiptItem, RejectionReason } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { calculatePOFulfillment, createPurchaseReceipt } from "@/services/procurementService"
import { useCRMContext, insertRows, updateRow } from "@/lib/CRMContext"
import { useUser } from "@/lib/AuthContext"
import { toast } from "sonner"
import type { JobAdapter } from "@/services/types"
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, InventoryTransaction, Task, PurchaseReceipt } from "@/lib/types"

interface ReceiveItemsModalProps {
  order: PurchaseOrder | null
  onClose: () => void
  onSuccess: () => void
}

export function ReceiveItemsModal({ order, onClose, onSuccess }: ReceiveItemsModalProps) {
  const { user } = useUser()
  const ctx = useCRMContext()
  const { data: receipts } = useCRMResource<PurchaseReceipt>('purchase_receipts')
  const { data: receiptItems } = useCRMResource<PurchaseReceiptItem>('purchase_receipt_items')
  const { data: inventoryTransactions } = useCRMResource<InventoryTransaction>('inventory_transactions')

  // We need the adapter to pass to createPurchaseReceipt
  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0]),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0]),
    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0]),
    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0]),
    getPurchaseReceipts: () => receipts,
    getPurchaseReceiptItems: () => receiptItems,
    insertPurchaseReceipt: (receipt) => insertRows<PurchaseReceipt>(ctx, 'purchase_receipts', [receipt as any]).then(rows => rows[0]),
    insertPurchaseReceiptItem: (item) => insertRows<PurchaseReceiptItem>(ctx, 'purchase_receipt_items', [item as any]).then(rows => rows[0]),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),
    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
  }), [ctx, receipts, receiptItems, inventoryTransactions])

  const [vendorReference, setVendorReference] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Map of poItemId -> { received, accepted, reason }
  const [formData, setFormData] = useState<Record<string, { received: number, accepted: number, rejected: number, reason: RejectionReason }>>({})

  // Calculate remaining quantities using authoritative service logic
  const fulfillment = useMemo(() => {
    if (!order) return null
    return calculatePOFulfillment(order, receiptItems)
  }, [order, receiptItems])

  // Initialize form data when order opens
  useEffect(() => {
    if (order && fulfillment) {
      const initial: typeof formData = {}
      order.items.forEach(item => {
        const remaining = Math.max(0, fulfillment.items[item.id].remaining)
        initial[item.id] = { received: 0, accepted: 0, rejected: 0, reason: 'damaged' }
      })
      setFormData(initial)
      setVendorReference(order.poNumber + "-DEL")
      setNotes("")
    }
  }, [order, fulfillment])

  if (!order || !fulfillment) return null

  const handleReceivedChange = (itemId: string, value: string) => {
    const val = parseInt(value, 10) || 0
    const remaining = fulfillment.items[itemId].remaining
    const safeVal = Math.max(0, Math.min(val, remaining))
    const currentAccepted = formData[itemId]?.accepted || 0
    const newRejected = Math.max(0, safeVal - currentAccepted)

    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        received: safeVal,
        accepted: Math.min(currentAccepted, safeVal),
        rejected: newRejected
      }
    }))
  }

  const handleAcceptedChange = (itemId: string, value: string) => {
    const val = parseInt(value, 10) || 0
    const currentReceived = formData[itemId].received
    const safeVal = Math.max(0, Math.min(val, currentReceived))
    const newRejected = currentReceived - safeVal

    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        accepted: safeVal,
        rejected: newRejected
      }
    }))
  }

  const handleRejectedChange = (itemId: string, value: string) => {
    const val = parseInt(value, 10) || 0
    const currentReceived = formData[itemId].received
    const safeVal = Math.max(0, Math.min(val, currentReceived))
    const newAccepted = currentReceived - safeVal

    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rejected: safeVal,
        accepted: newAccepted
      }
    }))
  }

  const handleReasonChange = (itemId: string, reason: RejectionReason) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reason
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Filter only items being received
      const itemsToReceive = order.items.filter(i => formData[i.id].received > 0).map(i => {
        const data = formData[i.id]
        const rejected = data.rejected || (data.received - data.accepted)
        return {
          poItemId: i.id,
          inventoryItemId: i.inventoryItemId,
          quantityReceived: data.received,
          quantityAccepted: data.accepted,
          quantityRejected: rejected,
          rejectionReason: rejected > 0 ? data.reason : undefined,
          isReturnable: false, // Internal defaults per V8 spec
          unitCost: i.price,
          currency: 'USD'
        }
      })

      if (itemsToReceive.length === 0) {
        toast.error("Please enter quantities to receive.")
        setIsSubmitting(false)
        return
      }

      // Generate a unique system receipt number
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(5, '0')}`

      await createPurchaseReceipt({
        po: order,
        receiptNumber,
        vendorReference,
        notes,
        userId: user?.id || 'system',
        userName: user?.user_metadata?.full_name || 'Unknown User',
        items: itemsToReceive
      }, adapter)

      toast.success("Items received successfully", {
        description: `Receipt ${receiptNumber} logged. Missing/damaged items will not fulfill the PO.`
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error("Failed to process receipt", { description: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-950 border-none shadow-2xl">
        <DialogHeader className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Package className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Receive Items</DialogTitle>
              <p className="text-sm font-medium text-slate-500 mt-1">Log inward stock for PO {order.poNumber}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Vendor Reference / Packing Slip</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={vendorReference}
                  onChange={(e) => setVendorReference(e.target.value)}
                  placeholder="e.g. INV-2024-8891"
                  className="pl-9 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Delivery Notes</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery condition notes"
                  className="pl-9 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-start gap-4">
            <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-red-900 dark:text-red-200">Rejected items DO NOT reopen the PO</p>
              <p className="text-red-700/80 dark:text-red-400/80 font-medium">Any damaged or missing stock logged here will be excluded from inventory, but will not fulfill the line item. To replace lost stock, you must create a new Purchase Request.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Line Items</h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-teal-500" />
                  <span className="text-slate-600 dark:text-slate-400">Accepted → Inventory</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="size-3 text-red-500" />
                  <span className="text-slate-600 dark:text-slate-400">Rejected → Excluded</span>
                </span>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Remaining</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Received</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-teal-600 dark:text-teal-400">Accepted ✓</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-red-600 dark:text-red-400">Rejected ✗</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map(item => {
                    const status = fulfillment.items[item.id]
                    const data = formData[item.id] || { received: 0, accepted: 0, rejected: 0, reason: 'damaged' }
                    const remaining = Math.max(0, status.remaining)
                    const hasRejection = data.rejected > 0

                    return (
                      <tr key={item.id} className={cn(
                        "transition-colors",
                        remaining === 0 && "opacity-50 bg-slate-50/50 dark:bg-slate-900/50",
                        hasRejection && "bg-red-50/30 dark:bg-red-900/10"
                      )}>
                        <td className="px-4 py-4 min-w-[200px]">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Ordered: {status.ordered} • Received so far: {status.accepted}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-black text-slate-700 dark:text-slate-300">
                            {remaining}
                          </span>
                        </td>
                        <td className="px-4 py-4 w-28">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max={remaining}
                              disabled={remaining === 0}
                              value={data.received === 0 ? '' : data.received}
                              onChange={(e) => handleReceivedChange(item.id, e.target.value)}
                              className="h-11 text-center font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 w-28">
                          <Input
                            type="number"
                            min="0"
                            max={data.received}
                            disabled={remaining === 0 || data.received === 0}
                            value={data.accepted === 0 && data.received === 0 ? '' : data.accepted}
                            onChange={(e) => handleAcceptedChange(item.id, e.target.value)}
                            className={cn(
                              "h-11 text-center font-bold border-2 transition-all",
                              hasRejection
                                ? "bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                                : "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                            )}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-4 w-28">
                          <Input
                            type="number"
                            min="0"
                            max={data.received}
                            disabled={remaining === 0 || data.received === 0}
                            value={data.rejected === 0 && data.received === 0 ? '' : data.rejected}
                            onChange={(e) => handleRejectedChange(item.id, e.target.value)}
                            className={cn(
                              "h-11 text-center font-bold border-2 transition-all",
                              hasRejection
                                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400"
                            )}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-4 w-40">
                          {hasRejection ? (
                            <div className="flex items-center gap-2">
                              <div className="shrink-0">
                                {data.reason === 'damaged' && <AlertTriangle className="size-4 text-red-500" />}
                                {data.reason === 'wrong_item' && <XOctagon className="size-4 text-red-500" />}
                                {data.reason === 'expired' && <Timer className="size-4 text-red-500" />}
                                {data.reason === 'short_shipped' && <PackageX className="size-4 text-red-500" />}
                                {data.reason === 'other' && <HelpCircle className="size-4 text-red-500" />}
                              </div>
                              <select
                                className="h-11 flex-1 px-3 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-800 outline-none focus:ring-2 focus:ring-red-500/20 text-red-700 dark:text-red-400"
                                value={data.reason}
                                onChange={(e) => handleReasonChange(item.id, e.target.value as RejectionReason)}
                              >
                                <option value="damaged">Damaged</option>
                                <option value="wrong_item">Wrong Item</option>
                                <option value="expired">Expired</option>
                                <option value="short_shipped">Short Shipped</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="outlineNeutral" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.values(formData).every(d => d.received === 0)}
          >
            {isSubmitting ? "Processing..." : "Confirm Receipt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
