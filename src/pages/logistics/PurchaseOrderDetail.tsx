import { useState, useMemo } from "react"
import { useRoute, useLocation, Link } from "wouter"
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  PackageCheck,
  XCircle,
  Hash,
  Package,
  Clock,
  FileText,
  User,
  Calendar,
  MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import type { PurchaseOrder, PurchaseOrderStatus, Quote, SalesOrder, InventoryItem, PurchaseRequest, InventoryTransaction } from "@/lib/types"
import { restockFromPO } from "@/services/procurementService"
import { useUser } from "@clerk/clerk-react"
import type { JobAdapter } from "@/services/types"

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
  pending: { label: "Pending", badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800", dot: "bg-amber-500" },
  sent: { label: "Sent", badge: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800", dot: "bg-indigo-500" },
  received: { label: "Received", badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800", dot: "bg-rose-400" },
}

const TIMELINE: { status: PurchaseOrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending", label: "PO Created", icon: FileText },
  { status: "sent", label: "Sent to Vendor", icon: Truck },
  { status: "received", label: "Received & Restocked", icon: PackageCheck },
]

const STATUS_ORDER: PurchaseOrderStatus[] = ["pending", "sent", "received"]

export function PurchaseOrderDetail() {
  const [, params] = useRoute("/purchase-orders/:id")
  const [, navigate] = useLocation()
  const poId = params?.id ?? ""
  const ctx = useCRMContext()
  const { user } = useUser()

  const { data: orders, isLoaded, deleteItem, refresh } = useCRMResource<PurchaseOrder>("purchase_orders")
  const { data: inventoryTransactions } = useCRMResource<InventoryTransaction>('inventory_transactions')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const order = useMemo(() => orders.find(o => o.id === poId), [orders, poId])

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0] as Quote),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0] as SalesOrder),
    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0] as PurchaseRequest),
    getPurchaseOrders: () => orders,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0] as PurchaseOrder),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0] as InventoryTransaction),
  }), [ctx, orders, inventoryTransactions])

  const handleSend = async () => {
    if (!order) return
    try {
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', order.id, { status: 'sent' })
      refresh()
      toast.success("PO Sent to Vendor")
    } catch (e: any) {
      toast.error("Failed to send", { description: e.message })
    }
  }

  const handleReceive = async () => {
    if (!order) return
    try {
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', order.id, { status: 'received' })
      await restockFromPO({ ...order, status: 'received' }, adapter, user?.id, user?.fullName || 'Unknown User')
      refresh()
      toast.success("Order Received", { description: "Inventory has been restocked automatically." })
    } catch (e: any) {
      toast.error("Receipt failed", { description: e.message })
    }
  }

  const handleCancel = async () => {
    if (!order) return
    try {
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', order.id, { status: 'cancelled' })
      refresh()
      toast.success("Order Cancelled")
    } catch (e: any) {
      toast.error("Cancellation failed", { description: e.message })
    }
  }

  const handleDelete = async () => {
    if (!order) return
    try {
      await deleteItem(order.id)
      navigate("/purchase-orders")
    } catch (e: any) {
      toast.error("Failed to delete", { description: e.message })
    }
  }

  if (!isLoaded) return <PageSkeleton />

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <ShoppingCart className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">PO not found.</h2>
        <Link href="/purchase-orders">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)

  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const currentStepIdx = STATUS_ORDER.indexOf(order.status)
  const cfg = STATUS_CONFIG[order.status]
  const initials = order.vendorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/purchase-orders"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchase Orders
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {order.poNumber}
                  </h1>
                  <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{order.vendorName}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Issued {relativeTime(order.createdAt)} · {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {order.status === "pending" && (
                <Button variant="default" onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                  <Truck className="w-4 h-4 mr-2" /> Send to Vendor
                </Button>
              )}
              {order.status === "sent" && (
                <Button variant="default" onClick={handleReceive} className="bg-emerald-600 hover:bg-emerald-700">
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark Received
                </Button>
              )}
              {/* More menu */}
              <div className="relative">
                <Button
                  variant="outlineNeutral"
                  size="icon"
                  onClick={() => setMoreOpen(v => !v)}
                  className="size-10 rounded-xl"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {moreOpen && (
                  <div
                    className="absolute right-0 top-11 z-50 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 overflow-hidden"
                    onMouseLeave={() => setMoreOpen(false)}
                  >
                    {order.status !== 'received' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => { setMoreOpen(false); handleCancel() }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4 shrink-0" /> Mark Cancelled
                      </button>
                    )}
                    <button
                      onClick={() => { setMoreOpen(false); setDeleteOpen(true) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4 shrink-0" /> Delete PO
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress tracker */}
          {order.status !== 'cancelled' && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Supply Chain Progress</p>
              <div className="flex items-center">
                {TIMELINE.map((step, i) => {
                  const done = currentStepIdx >= i
                  const active = currentStepIdx === i
                  const Icon = step.icon
                  return (
                    <div key={step.status} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "size-10 rounded-full flex items-center justify-center transition-all shrink-0",
                          done
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                          done ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                        )}>
                          {active ? <span className="relative">{step.label}<span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /></span> : step.label}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-2 rounded-full mb-5 transition-colors",
                          currentStepIdx > i ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">PO Items</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Qty</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-[10px) font-bold uppercase tracking-widest text-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, i) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">{fmt(item.price)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">{fmt(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">No items in this PO.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Subtotal</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Tax (10%)</td>
                    <td className="px-6 py-2 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">{fmt(tax)}</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td colSpan={4} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Total Approved</td>
                    <td className="px-6 py-4 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* PO Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">PO Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">PO Number</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{order.poNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Vendor</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.vendorName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Issue Date</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{relativeTime(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Financial Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tax</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">Total Value</span>
                  <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">{fmt(total)}</span>
                </div>
              </div>

              {/* CTA based on status */}
              {order.status === "sent" && (
                <Button
                  className="w-full mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none"
                  onClick={handleReceive}
                >
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark Received
                </Button>
              )}
              {order.status === "pending" && (
                <Button
                  className="w-full mt-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-none"
                  onClick={handleSend}
                >
                  <Truck className="w-4 h-4 mr-2" /> Send to Vendor
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Purchase Order"
        description={
          <>
            Are you sure you want to delete PO{" "}
            <strong className="text-slate-900 dark:text-slate-100">{order.poNumber}</strong>?
            This action cannot be undone.
          </>
        }
        onDelete={handleDelete}
        cancelText="Keep PO"
        deleteText="Delete PO"
      />
    </div>
  )
}
