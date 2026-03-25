import { useState, useMemo } from "react"
import {
  FileText,
  Search,
  Filter,
  Download,
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import { useLocation } from "wouter"
import { cn } from "@/lib/utils"
import type { Quote, QuoteStatus, SalesOrder } from "@/lib/types"
import { AddQuoteModal } from "@/components/crm/AddQuoteModal"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { toast } from "sonner"
import { sendQuoteEmail, convertQuoteToSalesOrder } from "@/lib/quoteOrderAutomation"
import { generateId } from "@/lib/helpers"

export function Quotes() {
  const ctx = useCRMContext()
  const {
    data: quotes,
    refresh,
    isLoaded
  } = useCRMResource<Quote>('quotes')
  const { data: orders } = useCRMResource<SalesOrder>('orders')

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [, navigate] = useLocation()
  const itemsPerPage = 8

  // Filter logic
  const filteredQuotes = useMemo(() => {
    let result = quotes.filter(quote => {
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        quote.quoteNumber.toLowerCase().includes(q) ||
        quote.customerName.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [quotes, statusFilter, search])

  // Pagination
  const totalItems = filteredQuotes.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleCreateSuccess = (quote: Quote) => {
    refresh()
    toast.success("Quote Created Successfully", {
      description: `Quote #${quote.quoteNumber} for ${quote.customerName} has been saved.`
    })
  }

  const handleMarkSent = async (quote: Quote) => {
    try {
      sendQuoteEmail(quote)
      await updateRow<Quote>(ctx, 'quotes', quote.id, { status: 'sent' })
      refresh()
      toast.success("Quote Sent", { description: "The quote email has been dispatched." })
    } catch (e) {
      toast.error("Error updating quote")
    }
  }

  const handleAccept = async (quote: Quote) => {
    try {
      const newOrder = convertQuoteToSalesOrder(quote, orders, generateId)
      await insertRows<SalesOrder>(ctx, 'orders', [newOrder])
      await updateRow<Quote>(ctx, 'quotes', quote.id, { status: 'accepted' })
      refresh()
      toast.success("Quote Accepted", { description: `Sales Order ${newOrder.orderNumber} created.` })
    } catch (e) {
      toast.error("Error converting quote")
    }
  }

  if (!isLoaded) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Sales & Revenue</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Quotations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track customer price estimates and validities.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Create Quote
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search quotes, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {(['all', 'draft', 'sent', 'accepted', 'expired'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="px-5 h-8 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              >
                {s}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" size="sm" className="h-10 px-4">
            <Filter className="w-4 h-4 mr-2" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Quote ID</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Customer</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Amount</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">No quotes found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">#{quote.quoteNumber}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm">
                            {quote.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{quote.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD', minimumFractionDigits: 2 }).format(quote.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">
                          {new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {quote.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkSent(quote); }} className="text-[11px] h-7 px-2 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              Mark Sent
                            </Button>
                          )}
                          {quote.status === 'sent' && (
                            <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); handleAccept(quote); }} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] h-7 px-2 font-bold shadow-sm">
                              Accept
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/quotes/${quote.id}`) }} className="text-[11px] h-7 px-2 text-slate-500 font-bold hover:text-indigo-600">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="quotes"
          />
        </div>
      </div>

      <AddQuoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const styles: Record<QuoteStatus, string> = {
    draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    sent: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    accepted: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    expired: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status}
    </span>
  )
}
