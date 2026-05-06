import { useState, useMemo, useEffect, useRef } from "react"
import { useRoute, useLocation } from "wouter"
import {
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
  MoreVertical,
  AlertTriangle,
  Building2,
  Search,
  Receipt,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ShieldX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"
import { VendorInvoiceModal } from "@/components/logisticsComponent/VendorInvoiceModal"
import { ReceiveItemsModal } from "@/components/logisticsComponent/ReceiveItemsModal"
import { ProcurementDataTable } from "@/components/reusables/ProcurementDataTable"
import { InitialsAvatar } from "@/components/reusables/InitialsAvatar"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { BackButton } from "@/components/reusables/BackButton"
import { ReturnToSupplierModal } from "@/components/logisticsComponent/ReturnToSupplierModal"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import type { PurchaseOrder, PurchaseOrderStatus, Quote, SalesOrder, InventoryItem, PurchaseRequest, InventoryTransaction, Vendor, Task, ReturnToSupplier } from "@/lib/types"
import { NIL_UUID, DEFAULT_TAX_RATE } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { sendPOToVendor, calculatePOFulfillment } from "@/services/procurementService"
import { useUser } from "@/lib/AuthContext"
import type { JobAdapter } from "@/services/types"
import type { PurchaseReceipt, PurchaseReceiptItem } from "@/lib/types"

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

// ─── Design-system-compliant status config (no indigo) ───────────────────────
const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  pending: { label: "Pending", badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  sent: { label: "Sent to Vendor", badge: "bg-accent-dim text-accent", dot: "bg-accent" },
  // was indigo — now teal (partial) to stay on-brand
  partially_received: { label: "Partially Received", badge: "bg-accent-dim text-accent", dot: "bg-accent" },
  fully_received: { label: "Fulfilled", badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400", dot: "bg-rose-400" },
}

const TIMELINE: { status: string; label: string; icon: React.ElementType }[] = [
  { status: "pending", label: "PO Created", icon: FileText },
  { status: "sent", label: "Sent to Vendor", icon: Truck },
  { status: "received", label: "Fulfilled", icon: PackageCheck },
]

type DetailTab = "items" | "history"

export function PurchaseOrderDetail() {
  const [, params] = useRoute("/purchase-orders/:id")
  const [, navigate] = useLocation()
  const poId = params?.id ?? ""
  const ctx = useCRMContext()
  const { isLoaded: userLoaded } = useUser()

  const { data: orders, isLoaded, updateItem, deleteItem, refresh } = useCRMResource<PurchaseOrder>("purchase_orders")
  const { data: inventoryTransactions } = useCRMResource<InventoryTransaction>("inventory_transactions")

  const [activeTab, setActiveTab] = useState<DetailTab>("items")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [vendorSelectorOpen, setVendorSelectorOpen] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [receiveItemsOpen, setReceiveItemsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rtsItem, setRtsItem] = useState<any | null>(null)
  const itemsPerPage = 8

  const moreDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [moreOpen])

  const { data: vendors } = useCRMResource<Vendor>("vendors")
  const { data: receiptItems } = useCRMResource<PurchaseReceiptItem>("purchase_receipt_items")
  const { data: receipts } = useCRMResource<PurchaseReceipt>("purchase_receipts")
  const { data: rtsList } = useCRMResource<ReturnToSupplier>("return_to_suppliers")

  const order = useMemo(() => orders.find(o => o.id === poId), [orders, poId])

  const fulfillment = useMemo(() => {
    if (!order) return null
    return calculatePOFulfillment(order, receiptItems)
  }, [order, receiptItems])

  // Receipts that belong to this PO, newest first
  const poReceipts = useMemo(() =>
    (receipts ?? [])
      .filter((r) => r.poId === poId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [receipts, poId]
  )

  // Flat rows for the history table (receipt-grouped)
  const historyRows = useMemo(() =>
    poReceipts.flatMap((receipt) => {
      const items = (receiptItems ?? []).filter((ri) => ri.receiptId === receipt.id)
      return items.map((item, idx) => {
        const poItem = order?.items.find((i) => i.id === item.poItemId)
        return {
          id: item.id,
          receiptId: receipt.id,
          isFirstInReceipt: idx === 0,
          receiptNumber: receipt.receiptNumber,
          receiptDate: receipt.date,
          vendorReference: receipt.vendorReference,
          receiptNotes: receipt.notes,
          itemName: poItem?.name ?? "Unknown Item",
          quantityReceived: item.quantityReceived,
          quantityAccepted: item.quantityAccepted,
          quantityRejected: item.quantityRejected,
          returnedQuantity: item.returnedQuantity || 0,
          rejectionReason: item.rejectionReason,
          isReturnable: item.isReturnable,
          inventoryItemId: item.inventoryItemId,
          unitCost: item.unitCost,
          currency: item.currency
        }
      })
    }),
    [poReceipts, receiptItems, order]
  )

  const currentStepIdx = useMemo(() => {
    if (!order) return 0
    if (order.status === "fully_received") return 2
    if (order.status === "partially_received" || order.status === "sent") return 1
    return 0
  }, [order])

  // ─── Adapter ────────────────────────────────────────────────────────────────
  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>("quotes").data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, "quotes", id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, "quotes", [q as Quote]).then((r) => r[0] as Quote),
    getSalesOrders: () => ctx.getResource<SalesOrder>("orders").data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, "orders", id, patch),
    updateSalesOrderItem: async (orderId, itemId, patch) => {
      const order = ctx.getResource<SalesOrder>("orders").data.find(o => o.id === orderId);
      if (!order) return;
      const updatedItems = order.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<SalesOrder>(ctx, "orders", orderId, { items: updatedItems });
    },
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, "orders", [o as SalesOrder]).then((r) => r[0] as SalesOrder),
    getInventoryItems: () => ctx.getResource<InventoryItem>("inventory").data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, "inventory", id, patch),
    insertInventoryItem: (item) => insertRows<InventoryItem>(ctx, "inventory", [item as InventoryItem]).then((r) => r[0] as InventoryItem),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>("purchase_requests").data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, "purchase_requests", id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, "purchase_requests", [pr as PurchaseRequest]).then((r) => r[0] as PurchaseRequest),
    getPurchaseOrders: () => orders,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, "purchase_orders", id, patch),
    updatePurchaseOrderItem: async (poId, itemId, patch) => {
      const po = orders.find(p => p.id === poId);
      if (!po) return;
      const updatedItems = po.items.map(item => item.id === itemId) ? (po.items.map(item => item.id === itemId ? { ...item, ...patch } : item)) : po.items;
      await updateRow<PurchaseOrder>(ctx, "purchase_orders", poId, { items: updatedItems as any });
    },
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, "purchase_orders", [po as PurchaseOrder]).then((r) => r[0] as PurchaseOrder),
    getPurchaseReceipts: () => ctx.getResource<PurchaseReceipt>("purchase_receipts").data,
    getPurchaseReceiptItems: () => ctx.getResource<PurchaseReceiptItem>("purchase_receipt_items").data,
    insertPurchaseReceipt: (receipt) => insertRows<PurchaseReceipt>(ctx, "purchase_receipts", [receipt as PurchaseReceipt]).then((r) => r[0] as PurchaseReceipt),
    insertPurchaseReceiptItem: (item) => insertRows<PurchaseReceiptItem>(ctx, "purchase_receipt_items", [item as PurchaseReceiptItem]).then((r) => r[0] as PurchaseReceiptItem),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, "inventory_transactions", [tx as InventoryTransaction]).then((r) => r[0] as InventoryTransaction),
    getTasks: () => ctx.getResource<Task>("tasks").data,
    updateTask: (id, patch) => updateRow<Task>(ctx, "tasks", id, patch),
    getReturnToSuppliers: () => rtsList,
    insertReturnToSupplier: (rts) => insertRows<ReturnToSupplier>(ctx, "return_to_suppliers", [rts as any]).then((r) => r[0] as ReturnToSupplier),
    updateReturnToSupplier: (id, patch) => updateRow<ReturnToSupplier>(ctx, "return_to_suppliers", id, patch),
    runAtomicUpdate: (ops) => ctx.runAtomicUpdate(ops),
  }), [ctx, orders, inventoryTransactions, rtsList, receiptItems, receipts])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!order) return
    const vendor = vendors.find((v) => v.id === order.vendorId)
    if (!vendor && order.vendorId !== NIL_UUID) { toast.error("Vendor not found"); return }
    toast.promise(sendPOToVendor(order, vendor || { id: NIL_UUID, name: order.vendorName } as Vendor, adapter), {
      loading: `Transmitting ${order.poNumber} to ${order.vendorName}…`,
      success: () => { refresh(); return `PO dispatched to ${order.vendorName}` },
      error: (e: Error) => `Failed to send: ${e.message}`,
    })
  }

  const handleCancel = async () => {
    if (!order) return
    try {
      await updateRow<PurchaseOrder>(ctx, "purchase_orders", order.id, { status: "cancelled" })
      refresh(); toast.success("Order cancelled")
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error")
      toast.error("Cancellation failed", { description: err.message })
    }
  }

  const handleDelete = async () => {
    if (!order) return
    try { await deleteItem(order.id); navigate("/purchase-orders") }
    catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error")
      toast.error("Failed to delete", { description: err.message })
    }
  }

  const handleSelectVendor = async (vendor: Vendor) => {
    if (!order) return
    try {
      await updateItem(order.id, { vendorId: vendor.id, vendorName: vendor.name })
      setVendorSelectorOpen(false)
      toast.success(`Vendor assigned: ${vendor.name}`)
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error")
      toast.error("Failed to assign vendor", { description: err.message })
    }
  }

  const toggleReturnable = async (row: any) => {
    try {
      await updateRow<PurchaseReceiptItem>(ctx, "purchase_receipt_items", row.id, { 
        isReturnable: !row.isReturnable 
      })
      toast.success(`Line is now ${!row.isReturnable ? 'returnable' : 'locked'}`)
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  const filteredVendors = useMemo(() =>
    vendors.filter(v =>
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.category?.toLowerCase().includes(vendorSearch.toLowerCase())
    ), [vendors, vendorSearch]
  )

  // ─── Guards ─────────────────────────────────────────────────────────────────
  if (!userLoaded || !isLoaded) return <DetailSkeleton />
  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <ShoppingCart className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">PO not found.</h2>
        <BackButton href="/purchase-orders" label="Back to Orders" />
      </div>
    )
  }

  // ─── Derived values ──────────────────────────────────────────────────────────
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.fully_received
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * DEFAULT_TAX_RATE
  const total = subtotal + tax

  const canReceive = (order.status === "sent" || order.status === "partially_received")
    && fulfillment
    && !Object.values(fulfillment.items).every(f => f.remaining <= 0)

  // Overall accepted vs ordered across all line items
  const totalOrdered = order.items.reduce((s, i) => s + i.quantity, 0)
  const totalAccepted = order.items.reduce((s, i) => s + (fulfillment?.items[i.id]?.accepted ?? 0), 0)
  const totalRejected = order.items.reduce((s, i) => s + (fulfillment?.items[i.id]?.rejected ?? 0), 0)
  const pctAccepted = totalOrdered > 0 ? Math.round((totalAccepted / totalOrdered) * 100) : 0

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      {receiveItemsOpen && (
        <ReceiveItemsModal
          order={order}
          onClose={() => setReceiveItemsOpen(false)}
          onSuccess={() => { refresh(); setReceiveItemsOpen(false) }}
        />
      )}

      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        <BackButton href="/purchase-orders" className="mb-2" />

        {/* ── Vendor unassigned banner ─────────────────────────────────────── */}
        {order.vendorId === NIL_UUID && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Vendor Unassigned</p>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400">
                  This PO was generated from a purchase request. Assign a vendor before sending.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setVendorSelectorOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 rounded-xl text-xs font-bold uppercase tracking-wider">
              Select Vendor
            </Button>
          </div>
        )}

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

            {/* Identity */}
            <div className="flex items-start gap-4">
              <InitialsAvatar
                name={order.vendorName || "?"}
                className="size-14 rounded-md shrink-0"
                textClassName="text-lg font-black"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {order.poNumber}
                  </h1>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    cfg.badge
                  )}>
                    <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle", cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.vendorName}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Issued {relativeTime(order.createdAt)} · {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(order.status === "pending" || order.status === "draft") && (
                <Button
                  variant="default"
                  onClick={handleSend}
                  disabled={order.vendorId === NIL_UUID}
                  className={cn(
                    "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 dark:shadow-none rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
                    order.vendorId === NIL_UUID && "opacity-50 cursor-not-allowed shadow-none"
                  )}
                >
                  <Truck className="w-4 h-4 mr-2" /> Send to Vendor
                </Button>
              )}
              {(order.status === "fully_received" || order.status === "partially_received") && (
                <Button variant="outlineNeutral" onClick={() => setInvoiceOpen(true)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Receipt className="w-4 h-4 text-slate-400" /> Generate Invoice
                </Button>
              )}
              {canReceive && (
                <Button variant="default" onClick={() => setReceiveItemsOpen(true)}
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 dark:shadow-none rounded-xl text-xs font-bold uppercase tracking-wider">
                  <PackageCheck className="w-4 h-4 mr-2" /> Receive Items
                </Button>
              )}
              {/* More dropdown */}
              <div className="relative" ref={moreDropdownRef}>
                <Button variant="outlineNeutral" size="icon" onClick={() => setMoreOpen(v => !v)}
                  className="size-9 rounded-xl border border-slate-200 dark:border-slate-800">
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {moreOpen && (
                  <div className="absolute right-0 top-11 z-50 w-48 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-xl py-1 overflow-hidden">
                    {order.status !== "fully_received" && order.status !== "cancelled" && (
                      <button
                        onClick={() => { setMoreOpen(false); handleCancel() }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <XCircle className="w-4 h-4 shrink-0" /> Mark Cancelled
                      </button>
                    )}
                    <button
                      onClick={() => { setMoreOpen(false); setDeleteOpen(true) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                      <XCircle className="w-4 h-4 shrink-0" /> Delete PO
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Supply chain progress tracker ──────────────────────────────── */}
          {order.status !== "cancelled" && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Supply Chain Progress</p>
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
                            ? "bg-accent text-white shadow-lg shadow-accent/20 dark:shadow-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                          done ? "text-accent" : "text-slate-400"
                        )}>
                          {active
                            ? <span className="relative">{step.label}<span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /></span>
                            : step.label}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-2 rounded-full mb-5 transition-colors",
                          currentStepIdx > i ? "bg-accent" : "bg-slate-200 dark:bg-slate-800"
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Overall fulfillment summary bar (only when receiving has started) */}
          {(order.status === "partially_received" || order.status === "fully_received") && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overall Fulfillment</p>
                <div className="flex items-center gap-4">
                  {totalRejected > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      {totalRejected} rejected · create new PR to reorder
                    </span>
                  )}
                  <span className={cn(
                    "text-xs font-black",
                    pctAccepted === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-accent"
                  )}>
                    {pctAccepted}% accepted
                  </span>
                </div>
              </div>
              {/* Stacked bar: accepted (teal) + rejected (rose) */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${pctAccepted}%` }}
                />
                {totalRejected > 0 && (
                  <div
                    className="h-full bg-rose-400 transition-all"
                    style={{ width: `${Math.round((totalRejected / totalOrdered) * 100)}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-accent inline-block" /> {totalAccepted} accepted
                </span>
                {totalRejected > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> {totalRejected} rejected
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium ml-auto">
                  {totalOrdered - totalAccepted} remaining of {totalOrdered} ordered
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: tabbed card (line items + history) ──────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

              {/* Tab bar */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-1">
                <div className="flex items-center">
                  {(["items", "history"] as DetailTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-5 py-4 text-sm font-bold tracking-wide transition-colors relative",
                        activeTab === tab
                          ? "text-accent"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      {tab === "items" && <><Package className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />PO Items</>}
                      {tab === "history" && <><Receipt className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />Receiving History
                        {poReceipts.length > 0 && (
                          <span className={cn(
                            "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            activeTab === "history"
                              ? "bg-accent-dim text-accent"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {poReceipts.length}
                          </span>
                        )}
                      </>}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>
                <span className="pr-4 text-xs font-bold text-slate-400">
                  {activeTab === "items" ? `${order.items.length} item${order.items.length !== 1 ? "s" : ""}` : `${poReceipts.length} receipt${poReceipts.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* ── Tab: PO Items ─────────────────────────────────────────── */}
              {activeTab === "items" && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">#</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">Description</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400 text-center">Qty Ordered</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400 text-center">Fulfillment</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400 text-right">Unit Price</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((item, i) => {
                      const accepted = fulfillment?.items[item.id]?.accepted ?? 0
                      const rejected = fulfillment?.items[item.id]?.rejected ?? 0
                      const remaining = fulfillment?.items[item.id]?.remaining ?? item.quantity
                      const pct = Math.min(100, (accepted / item.quantity) * 100)
                      const rjPct = Math.min(100 - pct, (rejected / item.quantity) * 100)
                      const isFull = remaining <= 0

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-l-4 border-transparent hover:border-accent">
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">{String(i + 1).padStart(2, "0")}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            {isFull && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Fulfilled
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-center text-slate-600 dark:text-slate-400">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1.5 w-full max-w-[140px] mx-auto">
                              {/* accepted / rejected / remaining labels */}
                              <div className="flex justify-between w-full text-[10px] font-bold">
                                <span className="text-accent">{accepted} acc.</span>
                                {rejected > 0 && <span className="text-rose-500">{rejected} rej.</span>}
                                <span className="text-slate-400">{remaining} left</span>
                              </div>
                              {/* stacked progress bar */}
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-accent transition-all rounded-l-full" style={{ width: `${pct}%` }} />
                                {rejected > 0 && (
                                  <div className="h-full bg-rose-400 transition-all" style={{ width: `${rjPct}%` }} />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">{fmt(item.price)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">{fmt(item.quantity * item.price)}</td>
                        </tr>
                      )
                    })}
                    {order.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm font-medium">
                          No items in this PO.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={5} className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Subtotal</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-6 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Tax ({Math.round(DEFAULT_TAX_RATE * 100)}%)</td>
                      <td className="px-6 py-2 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">{fmt(tax)}</td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <td colSpan={5} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Total Approved</td>
                      <td className="px-6 py-4 text-right text-lg font-black text-accent">{fmt(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ── Tab: Receiving History ────────────────────────────────── */}
              {activeTab === "history" && (
                <>
                  {historyRows.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <PackageCheck className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">No receiving history yet.</p>
                      {canReceive && (
                        <button
                          onClick={() => setReceiveItemsOpen(true)}
                          className="mt-3 text-xs font-bold text-accent hover:text-accent/80 underline underline-offset-2"
                        >
                          Record first receipt →
                        </button>
                      )}
                    </div>
                  ) : (
                    <ProcurementDataTable
                      data={historyRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      pagination={{
                        currentPage,
                        totalPages: Math.ceil(historyRows.length / itemsPerPage),
                        onPageChange: setCurrentPage,
                        totalItems: historyRows.length,
                        itemsPerPage,
                      }}
                      columns={[
                        {
                          header: "Receipt · Item",
                          render: (row) => (
                            <div className="py-1 space-y-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.itemName}</p>
                              {row.isFirstInReceipt ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <Receipt className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.receiptNumber}</span>
                                  {row.vendorReference && (
                                    <span className="text-[10px] text-slate-400 font-medium">· ref: {row.vendorReference}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 ml-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 inline-block" />
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.receiptNumber}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(row.receiptDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                {" · "}
                                {new Date(row.receiptDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          ),
                        },
                        {
                          header: "Received",
                          align: "center",
                          render: (row) => (
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.quantityReceived}</span>
                          ),
                        },
                        {
                          header: "Accepted",
                          align: "center",
                          render: (row) => (
                            <span className="text-sm font-black text-accent">{row.quantityAccepted}</span>
                          ),
                        },
                        {
                          header: "Rejected",
                          align: "center",
                          render: (row) => (
                            row.quantityRejected > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-sm font-black text-rose-600 dark:text-rose-400">{row.quantityRejected}</span>
                                {row.rejectionReason && (
                                  <span className="text-[10px] text-rose-400/70 italic leading-tight max-w-[80px] text-center line-clamp-1">
                                    {row.rejectionReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">—</span>
                            )
                          ),
                        },
                        {
                          header: "Notes",
                          render: (row) => (
                            row.isFirstInReceipt && row.receiptNotes ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-snug line-clamp-2">
                                "{row.receiptNotes}"
                              </p>
                            ) : null
                          ),
                        },
                        {
                          header: "Returnable",
                          align: "center",
                          className: "w-[135px]", // Fixed width prevents shifting
                          render: (row) => (
                            <div className="flex justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleReturnable(row) }}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all w-[100px] justify-center",
                                  row.isReturnable 
                                    ? "bg-accent-dim text-accent border border-accent/20 shadow-sm"
                                    : "bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-600 border border-slate-100 dark:border-slate-800"
                                )}
                              >
                                {row.isReturnable ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                                {row.isReturnable ? "Return Open" : "Locked"}
                              </button>
                            </div>
                          ),
                        },
                        {
                          header: "Returns",
                          align: "right",
                          className: "w-[120px]",
                          render: (row) => {
                            const available = row.quantityAccepted - (row.returnedQuantity || 0)
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  {row.returnedQuantity > 0 && (
                                    <span className="text-[10px] font-bold text-rose-500">
                                      {row.returnedQuantity} ret.
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-slate-400">
                                    {available} net
                                  </span>
                                </div>
                                {row.isReturnable && available > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRtsItem(row) }}
                                    className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 bg-accent-dim px-2 py-0.5 rounded border border-accent/20 hover:shadow-sm"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5 inline mr-1" /> Return Item
                                  </button>
                                )}
                              </div>
                            )
                          },
                        },
                      ]}
                      emptyState={{ message: "No receiving history for this PO yet." }}
                    />
                  )}
                  {/* Append-only disclaimer */}
                  <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium">Receipt log is append-only and cannot be edited.</p>
                    {canReceive && (
                      <button
                        onClick={() => setReceiveItemsOpen(true)}
                        className="text-[10px] font-black uppercase tracking-wider text-accent hover:text-accent/80 flex items-center gap-1"
                      >
                        + New Receipt <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* PO Details */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">PO Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">PO Number</p>
                    <p className="text-sm font-bold text-accent">{order.poNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Vendor</p>
                      {order.status === "pending" && (
                        <button
                          onClick={() => setVendorSelectorOpen(true)}
                          className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase text-accent hover:text-accent/80 transition-all underline underline-offset-2"
                        >
                          Change
                        </button>
                      )}
                    </div>
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

            {/* Financial summary */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Financial Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tax ({Math.round(DEFAULT_TAX_RATE * 100)}%)</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">Total Value</span>
                  <span className="font-black text-xl text-accent">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Rejection callout — only visible when there are rejects */}
            {totalRejected > 0 && (
              <div className="rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                      {totalRejected} unit{totalRejected !== 1 ? "s" : ""} rejected
                    </p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 leading-relaxed">
                      Rejected items do not count toward fulfillment. Create a new purchase request to reorder replacement stock.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Purchase Order"
        description={<>Are you sure you want to delete PO <strong className="text-slate-900 dark:text-slate-100">{order.poNumber}</strong>? This action cannot be undone.</>}
        onDelete={handleDelete}
        cancelText="Keep PO"
        deleteText="Delete PO"
      />

      <Dialog open={vendorSelectorOpen} onOpenChange={setVendorSelectorOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-md">
          <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle>Select Vendor</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search vendors…"
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
              {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelectVendor(vendor)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-md text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group",
                    order.vendorId === vendor.id && "bg-accent-dim ring-1 ring-accent/20"
                  )}
                >
                  <div className="size-10 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-accent transition-colors">
                    <Building2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{vendor.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                      {vendor.category || "General Vendor"} · {vendor.status}
                    </p>
                  </div>
                </button>
              )) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-400">No vendors found.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VendorInvoiceModal order={invoiceOpen ? order : null} onClose={() => setInvoiceOpen(false)} />

      {rtsItem && (
        <ReturnToSupplierModal
          lineItem={rtsItem}
          onClose={() => setRtsItem(null)}
          onSuccess={() => { refresh(); setRtsItem(null) }}
        />
      )}
    </div>
  )
}
