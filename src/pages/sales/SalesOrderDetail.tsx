import { useState, useMemo } from "react"
import { useRoute, useLocation, Link } from "wouter"
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  PackageCheck,
  XCircle,
  Receipt,
  Building2,
  Calendar,
  Hash,
  Package,
  Clock,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { InvoiceModal } from "@/components/crm/InvoiceModal"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext, updateRow } from "@/lib/CRMContext"
import type { SalesOrder, SalesOrderStatus } from "@/lib/types"
import { 
  fulfillOrderStock, 
  releaseOrderStock, 
  sendShippingNotification, 
  generateInvoice 
} from "@/services/orderService"

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

const STATUS_CONFIG: Record<SalesOrderStatus, { label: string; badge: string; dot: string }> = {
  pending:   { label: "Pending",   badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800",   dot: "bg-amber-500" },
  shipped:   { label: "Shipped",   badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800",     dot: "bg-blue-500" },
  delivered: { label: "Delivered", badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
}

const TIMELINE: { status: SalesOrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending",   label: "Order Placed",  icon: ShoppingCart },
  { status: "shipped",   label: "Shipped",        icon: Truck },
  { status: "delivered", label: "Delivered",      icon: PackageCheck },
]

const STATUS_ORDER: SalesOrderStatus[] = ["pending", "shipped", "delivered"]

export function SalesOrderDetail() {
  const [, params] = useRoute("/orders/:id")
  useLocation()
  const orderId = params?.id ?? ""
  const ctx = useCRMContext()

  const { data: orders, isLoaded } = useCRMResource<SalesOrder>("orders")

  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId])

  const handleShip = async () => {
    if (!order) return
    try {
      await fulfillOrderStock(order, ctx)
      sendShippingNotification(order)
      toast.success("Order Marked as Shipped", { description: `#${order.orderNumber} — stock physical/reserved updated.` })
    } catch (e: unknown) {
      toast.error("Failed to ship order", { description: (e as Error).message })
    }
  }

  const handleDeliver = async () => {
    if (!order) return
    try {
      generateInvoice(order)
      await updateRow<SalesOrder>(ctx, "orders", order.id, { status: "delivered" })
      toast.success("Order Delivered", { description: `Invoice generated for ${order.customerName}.` })
      setInvoiceOpen(true)
    } catch {
      toast.error("Failed to update order.")
    }
  }

  const handleCancel = async () => {
    if (!order) return
    try {
      await releaseOrderStock(order, ctx)
      toast.success("Order Cancelled", { description: `#${order.orderNumber} — stock reservation released.` })
    } catch (e: unknown) {
      toast.error("Failed to cancel order", { description: (e as Error).message })
    }
  }


  if (!isLoaded) return <PageSkeleton />

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <ShoppingCart className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">Order not found.</h2>
        <Link href="/orders">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "USD", minimumFractionDigits: 2 }).format(n)

  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const currentStepIdx = STATUS_ORDER.indexOf(order.status)
  const cfg = STATUS_CONFIG[order.status]

  const initials = order.customerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-[1400px] space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/orders"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    #{order.orderNumber}
                  </h1>
                  <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Placed {relativeTime(order.orderDate)} · {new Date(order.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {order.status === "pending" && (
                <Button variant="outlineNeutral" onClick={handleShip}>
                  <Truck className="w-4 h-4 mr-2 text-amber-500" /> Mark Shipped
                </Button>
              )}
              {order.status === "shipped" && (
                <Button variant="default" onClick={handleDeliver} className="bg-emerald-600 hover:bg-emerald-700">
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark Delivered
                </Button>
              )}
              <Button variant="outlineNeutral" onClick={() => setInvoiceOpen(true)}>
                <Receipt className="w-4 h-4 mr-2 text-indigo-500" /> View Invoice
              </Button>
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                </Button>
              )}
            </div>
          </div>

          {/* Fulfillment Timeline */}
          {order.status !== "cancelled" && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Fulfillment Progress</p>
              <div className="flex items-center gap-0">
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

          {/* Left — Line Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Order Items</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Qty</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Total</th>
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
                    <td colSpan={4} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Total Due</td>
                    <td className="px-6 py-4 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-6">

            {/* Order Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Order Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Order Number</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">#{order.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Customer</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Order Date</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(order.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
                <div className="flex items-start gap-3">
                  <Pencil className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Currency</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.currency || "USD"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Items</span>
                  <span className="font-bold text-slate-900 dark:text-white">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tax (10%)</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">Total</span>
                  <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">{fmt(total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                onClick={() => setInvoiceOpen(true)}
              >
                <Receipt className="w-4 h-4 mr-2" /> View Invoice
              </Button>
            </div>

            {/* Danger Zone */}
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 pb-3 mb-4">Danger Zone</h2>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mb-4 leading-relaxed">
                  Cancelling this order cannot be undone and will stop all fulfillment processes.
                </p>
                <Button
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={() => setDeleteOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal order={invoiceOpen ? order : null} onClose={() => setInvoiceOpen(false)} />

      {/* Cancel / Delete Confirmation */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Cancel Order"
        description={
          <>
            Are you sure you want to cancel order{" "}
            <strong className="text-slate-900 dark:text-slate-100">#{order.orderNumber}</strong>?
            This will stop all fulfillment and cannot be undone.
          </>
        }
        onDelete={handleCancel}
        cancelText="Keep Order"
        deleteText="Cancel Order"
      />
    </div>
  )
}
