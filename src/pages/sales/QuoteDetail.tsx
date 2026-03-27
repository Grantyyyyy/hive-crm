import { useState, useMemo, useRef } from "react"
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
  Receipt,
  MoreVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext } from "@/lib/CRMContext"
import type { Quote, QuoteStatus } from "@/lib/types"
import {
  acceptQuote,
  sendQuoteEmail,
  sendFollowUpReminder,
  reserveStockForQuote,
  releaseQuoteStock,
} from "@/services/quoteService"
import { useUser } from "@clerk/clerk-react"

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

const STATUS_CONFIG: Record<QuoteStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
  sent: { label: "Sent", badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800", dot: "bg-blue-500" },
  accepted: { label: "Accepted", badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800", dot: "bg-emerald-500" },
  expired: { label: "Expired", badge: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800", dot: "bg-rose-400" },
}

const TIMELINE_STEPS: { status: QuoteStatus; label: string; icon: React.ElementType }[] = [
  { status: "draft", label: "Draft Created", icon: FileText },
  { status: "sent", label: "Sent", icon: Send },
  { status: "accepted", label: "Accepted", icon: CheckCircle2 },
]
const PROGRESS_ORDER: QuoteStatus[] = ["draft", "sent", "accepted"]

export function QuoteDetail() {
  const [, params] = useRoute("/quotes/:id")
  const [, navigate] = useLocation()
  const quoteId = params?.id ?? ""
  const ctx = useCRMContext()
  const { user } = useUser()

  const { data: quotes, isLoaded, deleteItem } = useCRMResource<Quote>("quotes")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const quote = useMemo(() => quotes.find(q => q.id === quoteId), [quotes, quoteId])

  const nowRef = useRef(Date.now())
  const daysUntilExpiry = useMemo(() => {
    const validUntil = quote?.validUntil
    if (!validUntil) return null
    return Math.ceil((new Date(validUntil).getTime() - nowRef.current) / 86400000)
  }, [quote?.validUntil])

  const handleMarkSent = async () => {
    if (!quote) return
    try {
      await reserveStockForQuote(quote, ctx, user?.id || 'system', user?.fullName || 'Unknown User')
      sendQuoteEmail(quote)
      toast.success("Quote Sent & Stock Reserved", { description: "Email dispatched. Inventory items are now 'Soft Reserved'." })
    } catch (e: unknown) {
      toast.error("Failed to send quote", { description: (e as Error).message })
    }
  }

  const handleAccept = async () => {
    if (!quote) return
    try {
      const order = await acceptQuote(quote, ctx)
      toast.success("Quote Accepted", {
        description: `Sales Order #${order.orderNumber} created. Reservation transferred.`,
        action: { label: "View Order", onClick: () => navigate(`/orders/${order.id}`) },
      })
    } catch (e: unknown) {
      toast.error("Failed to accept quote", { description: (e as Error).message })
    }
  }

  const handleFollowUp = async () => {
    if (!quote) return
    try {
      sendFollowUpReminder(quote)
      toast.success("Follow-up Sent", { description: "A follow-up reminder was sent to the customer." })
    } catch {
      toast.error("Failed to send follow-up.")
    }
  }

  const handleExpire = async () => {
    if (!quote) return
    try {
      await releaseQuoteStock(quote, ctx, user?.id || 'system', user?.fullName || 'Unknown User')
      toast.success("Quote Expired", { description: "Reservation released back to available stock." })
    } catch (e: unknown) {
      toast.error("Failed to expire quote", { description: (e as Error).message })
    }
  }

  const handleDelete = async () => {
    if (!quote) return
    try {
      await deleteItem(quote.id)
      navigate("/quotes")
    } catch (e: unknown) {
      toast.error("Failed to delete quote", { description: (e as Error).message })
    }
  }

  if (!isLoaded) return <PageSkeleton />

  if (!quote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <FileText className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">Quote not found.</h2>
        <Link href="/quotes">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotes
          </Button>
        </Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency || "USD", minimumFractionDigits: 2 }).format(n)

  const subtotal = quote.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const cfg = STATUS_CONFIG[quote.status]
  const progressIdx = PROGRESS_ORDER.indexOf(quote.status)
  const isExpired = quote.status === "expired"
  const initials = quote.customerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()



  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/quotes"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotes
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
                    #{quote.quoteNumber}
                  </h1>
                  <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{quote.customerName}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Created {relativeTime(quote.createdAt)} · {new Date(quote.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                {/* Expiry alert */}
                {daysUntilExpiry !== null && quote.status === "sent" && (
                  <div className={cn(
                    "mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold",
                    daysUntilExpiry <= 3
                      ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  )}>
                    <Clock className="w-3.5 h-3.5" />
                    {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}` : "Expires today"}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {quote.status === "draft" && (
                <Button variant="default" onClick={handleMarkSent} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" /> Send Quote
                </Button>
              )}
              {quote.status === "sent" && (
                <>
                  <Button variant="outlineNeutral" onClick={handleFollowUp}>
                    <Receipt className="w-4 h-4 mr-2 text-slate-400" /> Follow Up
                  </Button>
                  <Button variant="default" onClick={handleAccept} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Accept & Create Order
                  </Button>
                </>
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
                    {quote.status !== "expired" && quote.status !== "accepted" && (
                      <button
                        onClick={() => { setMoreOpen(false); handleExpire() }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4 shrink-0" /> Mark Expired
                      </button>
                    )}
                    <button
                      onClick={() => { setMoreOpen(false); setDeleteOpen(true) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4 shrink-0" /> Delete Quote
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress tracker (only for non-expired) */}
          {!isExpired && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Quote Progress</p>
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = progressIdx >= i
                  const active = progressIdx === i
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
                          {active && quote.status !== "accepted"
                            ? <span className="relative">{step.label}<span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /></span>
                            : step.label}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-2 rounded-full mb-5 transition-colors",
                          progressIdx > i ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
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
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Line Items</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">{quote.items.length} item{quote.items.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Qty</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quote.items.map((item, i) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                      </td>
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
                    <td colSpan={4} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Total</td>
                    <td className="px-6 py-4 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms */}
            {quote.terms && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <Gavel className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Terms & Conditions</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{quote.terms}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Quote Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Quote Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Quote Number</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">#{quote.quoteNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Customer</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{quote.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Issue Date</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(quote.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
                {quote.validUntil && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Valid Until</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        daysUntilExpiry !== null && daysUntilExpiry <= 3 && quote.status === "sent"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-700 dark:text-slate-300"
                      )}>
                        {new Date(quote.validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{relativeTime(quote.updatedAt)}</p>
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
                  <span className="font-bold text-slate-900 dark:text-white">{quote.items.length}</span>
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

              {/* CTA based on status */}
              {quote.status === "sent" && (
                <Button
                  className="w-full mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none"
                  onClick={handleAccept}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Accept & Create Order
                </Button>
              )}
              {quote.status === "draft" && (
                <Button
                  className="w-full mt-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-none"
                  onClick={handleMarkSent}
                >
                  <Send className="w-4 h-4 mr-2" /> Send to Customer
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
        title="Delete Quote"
        description={
          <>
            Are you sure you want to delete quote{" "}
            <strong className="text-slate-900 dark:text-slate-100">#{quote.quoteNumber}</strong>?
            This action cannot be undone.
          </>
        }
        onDelete={handleDelete}
        cancelText="Keep Quote"
        deleteText="Delete Quote"
      />
    </div>
  )
}
