import { useState, useMemo, useRef, useEffect } from "react"
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
  Download,
  Mail,
  ChevronDown,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { InvoiceModal } from "@/components/crmComponent/InvoiceModal"
import { DeleteModal } from "@/components/ui/delete-modal"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext } from "@/lib/CRMContext"
import type { JobAdapter, AtomicOp } from "@/services/types"
import type { SalesOrder, SalesOrderStatus, Contact, OrderItem, PurchaseRequest, InventoryItem, PurchaseOrder, InventoryTransaction, Task, PurchaseReceipt, PurchaseReceiptItem, PurchaseOrderItem } from "@/lib/types"
import { getPendingQuantity } from "@/lib/types"
import {
  fulfillOrderStock,
  releaseOrderStock,
  returnShippedOrderStock,
  cancelOrderWithStockReversal,
  sendShippingNotification,
  reserveAvailableStock
} from "@/services/orderService"
import { SendEmailModal } from "@/components/crmComponent/SendEmailModal"
import { AddPurchaseRequestModal } from "@/components/logisticsComponent/AddPurchaseRequestModal"
import { useUser } from "@/lib/AuthContext"
import { updateRow } from "@/lib/CRMContext"

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
  draft: { label: "Draft", badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
  pending: { label: "Pending", badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800", dot: "bg-amber-500" },
  pending_stock: { label: "Awaiting Stock", badge: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800", dot: "bg-orange-500" },
  partially_fulfilled: { label: "Partial", badge: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-200 dark:ring-yellow-800", dot: "bg-yellow-500" },
  fulfilled: { label: "Fulfilled", badge: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 ring-1 ring-teal-200 dark:ring-teal-800", dot: "bg-teal-500" },
  shipped: { label: "Shipped", badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800", dot: "bg-blue-500" },
  delivered: { label: "Delivered", badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
}

const TIMELINE: { status: SalesOrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending", label: "Order Placed", icon: ShoppingCart },
  { status: "fulfilled", label: "Fulfilled", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: PackageCheck },
]

const STATUS_ORDER: SalesOrderStatus[] = ["pending", "fulfilled", "shipped", "delivered"]

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string
  icon?: React.ElementType
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

function ActionsDropdown({ items }: { items: DropdownItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-9 px-3 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">More</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none z-50 overflow-hidden">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick(); setOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  item.danger
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SalesOrderDetail() {
  const [, params] = useRoute("/orders/:id")
  const [, navigate] = useLocation()
  const orderId = params?.id ?? ""
  const ctx = useCRMContext()
  const { user, isLoaded: userLoaded } = useUser()

  const { data: orders, isLoaded, deleteItem, updateItem } = useCRMResource<SalesOrder>("orders")
  const { data: contacts } = useCRMResource<Contact>("contacts")

  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [isShipping, setIsShipping] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [confirmDeliver, setConfirmDeliver] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isProcuring, setIsProcuring] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const [shortagePRModalOpen, setShortagePRModalOpen] = useState(false)
  const [shortageData, setShortageData] = useState<Partial<PurchaseRequest> | undefined>()
  const [sendEmailOpen, setSendEmailOpen] = useState(false)

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId])

  const customerEmail = useMemo(() => {
    if (!order?.customerId) return undefined
    const contact = contacts?.find(c => c.id === order.customerId)
    return contact?.email
  }, [order?.customerId, contacts])



  const handleFulfill = async () => {
    if (!order || isShipping) return
    setIsShipping(true)
    try {
      await fulfillOrderStock(order, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      toast.success("Order Fulfilled", { description: `#${order.orderNumber} — stock deducted.` })
    } catch (e: unknown) {
      toast.error("Failed to fulfill order", { description: (e as Error).message })
    } finally {
      setIsShipping(false)
    }
  }

  const handleReserveStock = async () => {
    if (!order || isReserving) return
    setIsReserving(true)
    try {
      const { reservedItems } = await reserveAvailableStock(order, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      if (reservedItems > 0) {
        toast.success("Stock Reserved", { description: `Reserved stock for ${reservedItems} items.` })
      } else {
        toast.info("No stock available", { description: "All items are either already reserved or out of stock." })
      }
    } catch (e: unknown) {
      toast.error("Failed to reserve stock", { description: (e as Error).message })
    } finally {
      setIsReserving(false)
    }
  }

  const handleShip = async () => {
    if (!order || isUpdatingStatus) return
    setIsUpdatingStatus(true)
    try {
      await updateItem(order.id, { status: 'shipped', updatedAt: new Date().toISOString() })
      sendShippingNotification(order)
      toast.success("Order Marked as Shipped", { description: `#${order.orderNumber} is on its way.` })
    } catch (e: unknown) {
      toast.error('Failed to update order', { description: (e as Error).message })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeliver = async () => {
    if (!order || isUpdatingStatus) return
    setIsUpdatingStatus(true)
    try {
      await updateItem(order.id, { status: 'delivered', updatedAt: new Date().toISOString() })
      toast.success('Order Delivered', { description: `#${order.orderNumber} marked as delivered.` })
    } catch (e: unknown) {
      toast.error('Failed to update order', { description: (e as Error).message })
    } finally {
      setIsUpdatingStatus(false)
      setConfirmDeliver(false)
    }
  }

  const handleCancel = async () => {
    if (!order || isUpdatingStatus) return
    setIsUpdatingStatus(true)
    try {
      const { itemsReversed, type } = await cancelOrderWithStockReversal(
        order, ctx,
        user?.id ?? 'system',
        user?.user_metadata?.full_name ?? 'Unknown'
      )
      let description = `#${order.orderNumber} has been cancelled.`
      if (type === 'mixed' && itemsReversed > 0) {
        description += ` Stock released for ${itemsReversed} item${itemsReversed !== 1 ? 's' : ''}.`
      }
      toast.success('Order Cancelled', { description })
    } catch (e: unknown) {
      toast.error('Failed to cancel order', { description: (e as Error).message })
    } finally {
      setIsUpdatingStatus(false)
      setConfirmCancel(false)
    }
  }

  const handleSendEmail = () => {
    if (!order) return
    setSendEmailOpen(true)
  }

  const handleClearProcurement = async () => {
    if (!order) return
    try {
      const updatedOrderItems = order.items.map(item => ({ ...item, procuredQuantity: 0 }))
      await updateItem(order.id, { items: updatedOrderItems })
      toast.success("Procurement Status Reset", { description: "You can now use 'Procure Shortages' again." })
    } catch (e: any) {
      toast.error("Failed to reset status", { description: e.message })
    }
  }

  const handleProcureShortages = async (force: boolean = false) => {
    if (!order) return
    const shortages = force ? order.items : order.items.filter(item => getPendingQuantity(item) > 0)
    
    if (shortages.length === 0 && !force) {
      toast.info("Nothing to procure", { description: "All items are already reserved or fulfilled." })
      return
    }

    const prItems = shortages.map(item => {
      const needed = force ? item.quantity : getPendingQuantity(item)
      if (needed <= 0 && !force) return null
      return {
        id: crypto.randomUUID(),
        name: item.name,
        description: `Additional Procurement for Sales Order ${order.orderNumber}`,
        quantity: force ? item.quantity : needed,
        estimatedPrice: item.price,
        inventoryItemId: item.inventoryItemId,
        trackInInventory: true
      }
    }).filter(Boolean)

    if (prItems.length === 0) {
      toast.info("No items to add to PR")
      return
    }

    setShortageData({
      items: prItems as any,
      justification: `Automated shortage procurement for Sales Order ${order.orderNumber}`,
      urgent: true,
      priority: 'high',
      department: 'Sales Fulfillment'
    })
    setShortagePRModalOpen(true)
  }

  const handleProcureSuccess = async (pr: PurchaseRequest) => {
    if (!order) return
    try {
      const updatedOrderItems = order.items.map(item => {
        const shortageLine = pr.items.find(p => p.inventoryItemId === item.inventoryItemId)
        if (!shortageLine) return item
        return { ...item, procuredQuantity: (item.procuredQuantity || 0) + shortageLine.quantity }
      })
      await updateRow<SalesOrder>(ctx, 'orders', order.id, { items: updatedOrderItems })
      toast.success("Order Updated", { description: "Shortages marked as procured." })
    } catch (e: any) {
      toast.error("Failed to update order status", { description: e.message })
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order) return
    try {
      const { generateInvoicePDF } = await import("@/services/pdfService")
      await generateInvoicePDF(order)
      toast.success("Invoice PDF Downloaded")
    } catch (e: unknown) {
      toast.error("Failed to generate invoice PDF", { description: (e as Error).message })
    }
  }

  const handleDelete = async () => {
    if (!order || isDeleting) return
    setIsDeleting(true)
    try {
      if (order.stockDeducted) {
        toast.error("Cannot delete a shipped order")
        return
      }
      if (order.stockReserved) {
        await releaseOrderStock(order, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      }
      await deleteItem(order.id)
      navigate("/orders")
    } catch (e: unknown) {
      toast.error("Failed to delete order", { description: (e as Error).message })
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  const handleReturn = async () => {
    if (!order || isReturning) return
    setIsReturning(true)
    try {
      await returnShippedOrderStock(order, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      toast.success("Order Returned", { description: `#${order.orderNumber} — stock returned to inventory.` })
      setReturnOpen(false)
    } catch (e: unknown) {
      toast.error("Failed to return order", { description: (e as Error).message })
    } finally {
      setIsReturning(false)
    }
  }

  if (!userLoaded || !isLoaded) return <DetailSkeleton />

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

  const statusOrderMap: Record<SalesOrderStatus, number> = {
    cancelled: -1,
    draft: -1,
    pending_stock: 0,
    pending: 0,
    partially_fulfilled: 1,
    fulfilled: 1,
    shipped: 2,
    delivered: 3,
  }
  const currentStepIdx = statusOrderMap[order.status]
  const cfg = STATUS_CONFIG[order.status]
  const initials = order.customerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  // ── Action Buttons Logic ──────────────────────────────────────────────────
  const canDownloadInvoice = ["shipped", "delivered", "fulfilled"].includes(order.status)

  const primaryAction = (() => {
    // 1. Awaiting stock reservation
    if (order.status === "pending_stock") return (
      <Button variant="brand" onClick={handleReserveStock} disabled={isReserving} className="rounded-xl h-9 px-4">
        <Package className="w-4 h-4 mr-2" /> {isReserving ? 'Reserving...' : 'Reserve Stock'}
      </Button>
    )

    // 2. Ready to fulfill (either fully pending or partially fulfilled with new stock)
    const canFulfillMore = order.items.some(i => (i.reservedQuantity || 0) > 0);
    if (order.status === "pending" || (order.status === "partially_fulfilled" && canFulfillMore)) return (
      <Button variant="brand" onClick={handleFulfill} disabled={isShipping} className="rounded-xl h-9 px-4">
        <Package className="w-4 h-4 mr-2" /> {isShipping ? 'Fulfilling...' : order.status === 'partially_fulfilled' ? 'Fulfill Remaining' : 'Fulfill Order'}
      </Button>
    )

    // 3. Ready to ship (either fully fulfilled or partially fulfilled with nothing more to deduct right now)
    if (order.status === "fulfilled" || (order.status === "partially_fulfilled" && order.stockDeducted)) return (
      <Button variant="brand" onClick={handleShip} disabled={isUpdatingStatus} className="rounded-xl h-9 px-4">
        <Truck className="w-4 h-4 mr-2" /> {isUpdatingStatus ? 'Updating...' : order.status === 'partially_fulfilled' ? 'Ship Partial' : 'Mark Shipped'}
      </Button>
    )

    // 4. Out for delivery
    if (order.status === "shipped") return (
      <Button variant="brand" onClick={() => setConfirmDeliver(true)} disabled={isUpdatingStatus} className="rounded-xl h-9 px-4">
        <PackageCheck className="w-4 h-4 mr-2" /> Mark Delivered
      </Button>
    )

    return null
  })()

  const dropdownItems: DropdownItem[] = []

  dropdownItems.push({ label: "View Invoice", icon: Receipt, onClick: () => setInvoiceOpen(true) })

  if (canDownloadInvoice) {
    dropdownItems.push(
      { label: "Download Invoice", icon: Download, onClick: handleDownloadInvoice },
      { label: "Send to Customer", icon: Mail, onClick: handleSendEmail }
    )
  }

  const hasShortages = order.items.some(item => getPendingQuantity(item) > 0)

  if (hasShortages) {
    dropdownItems.push({ label: "Procure Shortages", icon: Package, onClick: handleProcureShortages, disabled: isProcuring })
  }

  if (!["delivered", "cancelled"].includes(order.status)) {
    dropdownItems.push({ label: "Additional Purchase Request", icon: Plus, onClick: () => handleProcureShortages(true) })
  }

  if (order.items.some(i => (i.procuredQuantity || 0) > 0)) {
    dropdownItems.push({ label: "Clear Procurement Status", icon: XCircle, onClick: handleClearProcurement, danger: true })
  }

  if (["shipped", "fulfilled"].includes(order.status) && order.stockDeducted) {
    dropdownItems.push({ label: "Return & Cancel", icon: XCircle, onClick: () => setReturnOpen(true), danger: true })
  }

  if (!["delivered", "cancelled"].includes(order.status)) {
    dropdownItems.push({ label: "Cancel Order", icon: XCircle, onClick: () => setConfirmCancel(true), danger: true })
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

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
              <div className="size-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xl font-black shrink-0 shadow-sm">
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
            <div className="flex items-center gap-2 shrink-0">
              {primaryAction}
              <ActionsDropdown items={dropdownItems} />
            </div>
          </div>

          {/* Fulfillment Timeline */}
          {
            order.status !== "cancelled" && (
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
                              ? "bg-teal-600 text-white shadow-lg shadow-teal-200 dark:shadow-none"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                            done ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                          )}>
                            {active
                              ? <span className="relative">{step.label}<span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /></span>
                              : step.label
                            }
                          </span>
                        </div>
                        {i < TIMELINE.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-2 rounded-full mb-5 transition-colors",
                            currentStepIdx > i ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-800"
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
        </div >

        {/* Main Grid */}
        < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >

          {/* Left — Line Items */}
          < div className="lg:col-span-2 space-y-6" >
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
                  {order.items.map((item, i) => {
                    const reserved = item.reservedQuantity || 0
                    const procured = item.procuredQuantity || 0
                    const fulfilled = item.fulfilledQuantity || 0
                    const pending = item.quantity - (reserved + procured + fulfilled)

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{String(i + 1).padStart(2, "0")}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {fulfilled > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                {fulfilled} Fulfilled
                              </span>
                            )}
                            {reserved > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                                {reserved} Reserved
                              </span>
                            )}
                            {procured > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                {procured} Ordered
                              </span>
                            )}
                            {pending > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-100 dark:border-slate-800">
                                {pending} Shortage
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">{fmt(item.price)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">{fmt(item.quantity * item.price)}</td>
                      </tr>
                    )
                  })}
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
                    <td className="px-6 py-4 text-right text-lg font-black text-teal-600 dark:text-teal-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div >

          {/* Right — Sidebar */}
          < div className="space-y-6" >

            {/* Order Details */}
            < div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6" >
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Order Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Order Number</p>
                    <p className="text-sm font-bold text-teal-600 dark:text-teal-400">#{order.orderNumber}</p>
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
            </div >

            {/* Summary */}
            < div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6" >
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
                  <span className="font-black text-xl text-teal-600 dark:text-teal-400">{fmt(total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-100 dark:shadow-none"
                onClick={() => setInvoiceOpen(true)}
              >
                <Receipt className="w-4 h-4 mr-2" /> View Invoice
              </Button>
            </div >
          </div >
        </div >
      </div >

      {/* Modals */}
      < InvoiceModal order={invoiceOpen ? order : null} onClose={() => setInvoiceOpen(false)
      } />

      < DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Cancel Order"
        description={<> Are you sure you want to cancel order < strong className="text-slate-900 dark:text-slate-100" >#{order.orderNumber}</strong >? This cannot be undone.</>}
        onDelete={handleDelete}
        cancelText="Keep Order"
        deleteText="Cancel Order"
        loading={isDeleting}
      />

      <ConfirmModal
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title="Return & Cancel Order"
        description={<>Are you sure you want to return and cancel <strong className="text-slate-900 dark:text-slate-100">#{order.orderNumber}</strong>? Stock will be returned to inventory.</>}
        confirmLabel="Return & Cancel"
        cancelLabel="Keep Order"
        confirmClassName="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleReturn}
        loading={isReturning}
      />

      <ConfirmModal
        open={confirmDeliver}
        onOpenChange={setConfirmDeliver}
        title="Mark as delivered?"
        description="This confirms the order has been received by the customer."
        confirmLabel="Mark Delivered"
        onConfirm={handleDeliver}
      />

      <ConfirmModal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description="This will cancel the order. Stock will not be automatically returned — adjust inventory manually if needed."
        confirmLabel="Cancel Order"
        confirmClassName="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleCancel}
      />

      <SendEmailModal
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        document={order ? { type: "invoice" as const, data: order } : null}
        customerEmail={customerEmail}
      />

      <AddPurchaseRequestModal
        open={shortagePRModalOpen}
        onOpenChange={setShortagePRModalOpen}
        onSuccess={handleProcureSuccess}
        initialData={shortageData}
      />
    </div >
  )
}