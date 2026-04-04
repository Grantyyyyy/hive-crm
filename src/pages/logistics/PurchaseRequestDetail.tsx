import { useState, useMemo, useRef, useEffect } from "react"
import { useRoute, useLocation, Link } from "wouter"
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Hash,
  Package,
  Gavel,
  ShoppingCart,
  MoreVertical,
  User,
  Zap,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import type {
  PurchaseRequest,
  PurchaseRequestStatus,
  Quote,
  SalesOrder,
  InventoryItem,
  PurchaseOrder,
  InventoryTransaction,
  Task,
} from "@/lib/types"
import { approvePurchaseRequest } from "@/services/procurementService"
import type { JobAdapter } from "@/services/types"

// ---------- helpers ----------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n)

// ---------- config ----------

const STATUS_CONFIG: Record<
  PurchaseRequestStatus,
  { label: string; badge: string }
> = {
  draft: {
    label: "Draft",
    badge:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700",
  },
  pending_review: {
    label: "In Review",
    badge:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800",
  },
  approved: {
    label: "Approved",
    badge:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800",
  },
  rejected: {
    label: "Rejected",
    badge:
      "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800",
  },
  ordered: {
    label: "Ordered",
    badge:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800",
  },
}

const TIMELINE_STEPS: {
  status: PurchaseRequestStatus
  label: string
  icon: React.ElementType
}[] = [
    { status: "draft", label: "Draft Created", icon: FileText },
    { status: "pending_review", label: "In Review", icon: Send },
    { status: "approved", label: "Approved", icon: CheckCircle2 },
    { status: "ordered", label: "PO Created", icon: ShoppingCart },
  ]

const PROGRESS_ORDER: PurchaseRequestStatus[] = [
  "draft",
  "pending_review",
  "approved",
  "ordered",
]

// ---------- sub-components ----------

/** Confirmation modal for destructive status changes (reject, delete) */
function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  confirmClassName?: string
  onConfirm: () => void
  loading?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outlineNeutral"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={cn("font-bold", confirmClassName)}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------- main component ----------

export function PurchaseRequestDetail() {
  const [, params] = useRoute("/purchase-requests/:id")
  const [, navigate] = useLocation()
  const requestId = params?.id ?? ""
  const ctx = useCRMContext()

  const {
    data: requests,
    isLoaded,
    deleteItem,
  } = useCRMResource<PurchaseRequest>("purchase_requests")

  const { data: inventoryTransactions } =
    useCRMResource<InventoryTransaction>("inventory_transactions")

  const { data: purchaseOrders } =
    useCRMResource<PurchaseOrder>("purchase_orders")

  // modal states
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // loading guards — prevent double-fire on async actions
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // close more-menu on outside click
  const moreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [moreOpen])

  const request = useMemo(
    () => requests.find((r) => r.id === requestId),
    [requests, requestId]
  )

  // find all POs linked to this PR (for "ordered" status)
  const linkedPOs = useMemo(
    () =>
      purchaseOrders.filter(
        (po) =>
          po.referenceId === requestId
      ),
    [purchaseOrders, requestId]
  )

  // stable adapter — only recreate when IDs-level data changes, not ctx reference
  const adapter = useMemo<JobAdapter>(
    () => ({
      getQuotes: () => ctx.getResource<Quote>("quotes").data,
      updateQuote: (id, patch) => updateRow<Quote>(ctx, "quotes", id, patch),
      insertQuote: (q) =>
        insertRows<Quote>(ctx, "quotes", [q as any]).then(
          (rows) => rows[0] as Quote
        ),
      getSalesOrders: () => ctx.getResource<SalesOrder>("orders").data,
      updateSalesOrder: (id, patch) =>
        updateRow<SalesOrder>(ctx, "orders", id, patch),
      insertSalesOrder: (o) =>
        insertRows<SalesOrder>(ctx, "orders", [o as any]).then(
          (rows) => rows[0] as SalesOrder
        ),
      getInventoryItems: () =>
        ctx.getResource<InventoryItem>("inventory").data,
      updateInventoryItem: (id, patch) =>
        updateRow<InventoryItem>(ctx, "inventory", id, patch),
      insertInventoryItem: (item: Omit<InventoryItem, 'id'>) =>
        insertRows<InventoryItem>(ctx, "inventory", [item as any]).then(
          (rows) => rows[0] as InventoryItem
        ),
      getPurchaseRequests: () => requests,
      updatePurchaseRequest: (id, patch) =>
        updateRow<PurchaseRequest>(ctx, "purchase_requests", id, patch),
      insertPurchaseRequest: (pr) =>
        insertRows<PurchaseRequest>(ctx, "purchase_requests", [pr as any]).then(
          (rows) => rows[0] as PurchaseRequest
        ),
      getPurchaseOrders: () =>
        ctx.getResource<PurchaseOrder>("purchase_orders").data,
      updatePurchaseOrder: (id, patch) =>
        updateRow<PurchaseOrder>(ctx, "purchase_orders", id, patch),
      insertPurchaseOrder: (po) =>
        insertRows<PurchaseOrder>(ctx, "purchase_orders", [po as any]).then(
          (rows) => rows[0] as PurchaseOrder
        ),
      getInventoryTransactions: () => inventoryTransactions,
      insertInventoryTransaction: (tx) =>
        insertRows<InventoryTransaction>(ctx, "inventory_transactions", [
          tx as any,
        ]).then((rows) => rows[0] as InventoryTransaction),

      getTasks: () => ctx.getResource<Task>("tasks").data,
      updateTask: (id, patch) => updateRow<Task>(ctx, "tasks", id, patch),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, inventoryTransactions]
  )

  // ---------- handlers ----------

  const handleSubmitForReview = async () => {
    if (!request || submitting) return
    setSubmitting(true)
    try {
      await updateRow<PurchaseRequest>(ctx, "purchase_requests", request.id, {
        status: "pending_review",
      })
      toast.success("Submitted for Review", {
        description: "Department heads have been notified.",
      })
    } catch (e: any) {
      toast.error("Failed to submit", { description: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!request || approving) return
    setApproving(true)
    try {
      await approvePurchaseRequest(request.id, adapter)
      toast.success("Request Approved", {
        description: "Purchase Order(s) created automatically.",
      })
    } catch (e: any) {
      toast.error("Approval failed", { description: e.message })
    } finally {
      setApproving(false)
    }
  }

  const handleRejectConfirmed = async () => {
    if (!request || rejecting) return
    setRejecting(true)
    try {
      await updateRow<PurchaseRequest>(ctx, "purchase_requests", request.id, {
        status: "rejected",
      })
      toast.success("Request Rejected")
      setRejectOpen(false)
    } catch (e: any) {
      toast.error("Rejection failed", { description: e.message })
    } finally {
      setRejecting(false)
    }
  }

  const handleDelete = async () => {
    if (!request) return
    try {
      await deleteItem(request.id)
      navigate("/purchase-requests")
    } catch (e: any) {
      toast.error("Failed to delete", { description: e.message })
    }
  }

  // ---------- render guards ----------

  if (!isLoaded) return <DetailSkeleton />

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <FileText className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">
          Request not found.
        </h2>
        <Link href="/purchase-requests">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Requests
          </Button>
        </Link>
      </div>
    )
  }

  // ---------- derived display values ----------

  const cfg = STATUS_CONFIG[request.status]
  const progressIdx = PROGRESS_ORDER.indexOf(request.status)
  const isRejected = request.status === "rejected"
  const initials = request.requesterName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // ---------- JSX ----------

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/purchase-requests"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchase Requests
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

            {/* Identity */}
            <div className="flex items-start gap-5">
              <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {request.requestNumber}
                  </h1>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      cfg.badge
                    )}
                  >
                    {cfg.label}
                  </span>
                  {request.urgent && (
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 fill-rose-600 dark:fill-rose-400" />{" "}
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  {request.requesterName} · {request.department}
                </p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Created {relativeTime(request.createdAt)} ·{" "}
                  {new Date(request.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Actions — single source of truth, no duplication in sidebar */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {request.status === "draft" && (
                <Button
                  variant="default"
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Submitting…" : "Submit for Review"}
                </Button>
              )}

              {request.status === "pending_review" && (
                <>
                  <Button
                    variant="outlineNeutral"
                    onClick={() => setRejectOpen(true)}
                    disabled={approving}
                  >
                    <XCircle className="w-4 h-4 mr-2 text-rose-500" /> Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleApprove}
                    disabled={approving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {approving ? "Approving…" : "Approve Request"}
                  </Button>
                </>
              )}

              {/* More menu */}
              <div className="relative" ref={moreRef}>
                <Button
                  variant="outlineNeutral"
                  size="icon"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="size-10 rounded-xl"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {moreOpen && (
                  <div className="absolute right-0 top-11 z-50 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 overflow-hidden">
                    <button
                      onClick={() => {
                        setMoreOpen(false)
                        setDeleteOpen(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4 shrink-0" /> Delete Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Linked PO banner — shown when status is "ordered" */}
          {request.status === "ordered" && linkedPOs.length > 0 && (
            <div className="mt-6 space-y-2">
              {linkedPOs.map((po) => (
                <div key={po.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="font-black">{po.poNumber}</span>
                      {" · "}{po.vendorName || "TBD"}
                      {" · "}{po.items.length} item{po.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link href={`/purchase-orders/${po.id}`}>
                    <Button
                      size="sm"
                      variant="outlineNeutral"
                      className="shrink-0 text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                      View PO <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Progress tracker */}
          {!isRejected && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">
                Workflow Progress
              </p>
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = progressIdx >= i
                  const active = progressIdx === i
                  const Icon = step.icon
                  return (
                    <div
                      key={step.status}
                      className="flex items-center flex-1 last:flex-none"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            "size-10 rounded-full flex items-center justify-center transition-all shrink-0",
                            done
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                            done
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-slate-400"
                          )}
                        >
                          {active && request.status !== "ordered" ? (
                            <span className="relative">
                              {step.label}
                              <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            </span>
                          ) : (
                            step.label
                          )}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 mx-2 rounded-full mb-5 transition-colors",
                            progressIdx > i
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-800"
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rejected state indicator */}
          {isRejected && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                This request was rejected and is no longer active.
              </p>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Requested Items */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <Package className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Requested Items
                </h2>
              </div>

              {/* Multi-item table — items[] is the single source of truth */}
              {Array.isArray(request.items) && request.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Item
                        </th>
                        <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Vendor
                        </th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Qty
                        </th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Unit Price
                        </th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.items.map((item, idx: number) => (
                        <tr
                          key={item.id || idx}
                          className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {item.name || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {item.vendorName || <span className="text-slate-300 italic">Unassigned</span>}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                            {fmt(item.estimatedPrice ?? 0)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                            {fmt(
                              (item.quantity ?? 0) *
                              (item.estimatedPrice ?? 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-slate-400">
                  No items on this request.
                </div>
              )}
            </div>

            {/* Business Justification */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <Gavel className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Business Justification
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {request.justification || "No justification provided."}
              </p>
            </div>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-6">

            {/* Request Meta */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                Request Meta
              </h2>
              <div className="space-y-4">
                {[
                  {
                    icon: Hash,
                    label: "Reference ID",
                    value: (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {request.requestNumber}
                      </span>
                    ),
                  },
                  {
                    icon: User,
                    label: "Requested By",
                    value: request.requesterName,
                  },
                  {
                    icon: Building2,
                    label: "Department",
                    value: request.department,
                  },
                  {
                    icon: Calendar,
                    label: "Request Date",
                    value: new Date(request.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  },
                  {
                    icon: Clock,
                    label: "Last Updated",
                    value: relativeTime(request.updatedAt),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary — no action buttons here */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                Financial Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Estimated Amt
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {fmt(request.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Priority</span>
                  <span
                    className={cn(
                      "font-bold uppercase text-[10px] tracking-widest",
                      request.priority === "urgent"
                        ? "text-rose-600"
                        : "text-amber-600"
                    )}
                  >
                    {request.priority}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">
                    Budget Impact
                  </span>
                  <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">
                    {fmt(request.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject confirmation modal */}
      <ConfirmModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Purchase Request"
        description={
          <>
            Are you sure you want to reject{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {request.requestNumber}
            </strong>
            ? This will close the request and notify the requester.
          </>
        }
        confirmLabel="Reject Request"
        confirmClassName="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleRejectConfirmed}
        loading={rejecting}
      />

      {/* Delete confirmation modal */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Purchase Request"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {request.requestNumber}
            </strong>
            ? This action cannot be undone.
          </>
        }
        onDelete={handleDelete}
        cancelText="Keep Request"
        deleteText="Delete Request"
      />
    </div>
  )
}