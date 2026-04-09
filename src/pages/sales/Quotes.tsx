import { useState, useMemo } from "react"
import {
  FileText,
  Search,
  PlusCircle,
  Filter,
  Download,
  FileDown,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext } from "@/lib/CRMContext"
import { useLocation } from "wouter"
import { cn } from "@/lib/utils"
import type { Quote, QuoteStatus, Contact } from "@/lib/types"
import { AddQuoteModal } from "@/components/crmComponent/AddQuoteModal"
import { SendEmailModal } from "@/components/crmComponent/SendEmailModal"
import { ListSkeleton } from "@/components/ui/skeletons"
import { toast } from "sonner"
import { sendQuoteEmail, acceptQuote, reserveStockForQuote } from "@/services/quoteService"
import { useUser } from "@/lib/AuthContext"

export function Quotes() {
  const ctx = useCRMContext()
  const {
    data: quotes,
    refresh,
    isLoaded
  } = useCRMResource<Quote>('quotes')
  const { data: contacts } = useCRMResource<Contact>('contacts')

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [, navigate] = useLocation()
  const itemsPerPage = 8

  // Filter logic
  const filteredQuotes = useMemo(() => {
    const result = quotes.filter(quote => {
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

  const { user, isLoaded: userLoaded } = useUser()

  if (!userLoaded || !isLoaded) {
    return <ListSkeleton />
  }

  const handleCreateSuccess = (quote: Quote) => {
    refresh()
    toast.success("Quote Created Successfully", {
      description: `Quote #${quote.quoteNumber} for ${quote.customerName} has been saved.`
    })
  }

  const handleMarkSent = async (quote: Quote) => {
    try {
      await reserveStockForQuote(quote, ctx, user?.id || 'system', user?.user_metadata?.full_name || 'Unknown User')
      sendQuoteEmail(quote)
      refresh()
      toast.success("Quote Sent", { description: "Stock reserved and email dispatched." })
    } catch (e: unknown) {
      toast.error("Failed to send quote", { description: (e as Error).message })
    }
  }


  const handleAccept = async (quote: Quote) => {
    try {
      const newOrder = await acceptQuote(quote, ctx)
      refresh()
      toast.success("Quote Accepted", {
        description: `Sales Order ${newOrder.orderNumber} created.`,
        action: { label: "View Order", onClick: () => navigate(`/orders/${newOrder.id}`) }
      })
    } catch (e: unknown) {
      toast.error("Error converting quote", { description: (e as Error).message })
    }
  }

  const handleDownloadPDF = async (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { generateQuotePDF } = await import("@/services/pdfService")
      await generateQuotePDF(quote)
      toast.success("Quote PDF Downloaded", { description: `${quote.quoteNumber} — ready to email.` })
    } catch (e: unknown) {
      toast.error("Failed to generate PDF", { description: (e as Error).message })
    }
  }

  const handleSendEmail = (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation()
    setEmailQuote(quote)
    setSendEmailOpen(true)
  }

  const [sendEmailOpen, setSendEmailOpen] = useState(false)
  const [emailQuote, setEmailQuote] = useState<Quote | null>(null)
  const quoteEmail = useMemo(() => {
    if (!emailQuote?.customerId) return undefined
    const contact = contacts?.find(c => c.id === emailQuote.customerId)
    return contact?.email
  }, [emailQuote?.customerId, contacts])

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Sales & Revenue</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Quotations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track customer price estimates and validities.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral" className="rounded-xl border-2 transition-all active:scale-95">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="default"
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 rounded-xl px-6 transition-all active:scale-95"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Quote
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
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
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
                className="px-5 h-8 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95"
              >
                {s}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" size="sm" className="h-10 px-4 rounded-xl border-2 transition-all active:scale-95">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Quote Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Client</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Project Value</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lifecycle</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Issued On</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                          <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No quotations discovered.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group border-l-2 border-l-transparent hover:border-l-teal-500"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-black text-teal-600 dark:text-teal-400 tracking-tight">#{quote.quoteNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[11px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm transition-all group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600">
                            {quote.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[140px] tracking-tight">{quote.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD', minimumFractionDigits: 2 }).format(quote.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                          {new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                          {quote.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkSent(quote); }} className="text-[10px] h-8 px-4 rounded-xl font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                              Mark Sent
                            </Button>
                          )}
                          {quote.status === 'sent' && (
                            <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); handleAccept(quote); }} className="bg-teal-600 hover:bg-teal-700 text-[10px] h-8 px-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 transition-all active:scale-95">
                              Accept
                            </Button>
                          )}
                          {(quote.status === 'sent' || quote.status === 'accepted') && (
                            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                              <Button variant="ghost" size="sm" onClick={(e) => handleDownloadPDF(quote, e)} className="text-[10px] h-8 px-3 rounded-none text-slate-500 font-black uppercase tracking-widest hover:bg-teal-50 hover:text-teal-600 border-none" title="Download PDF">
                                <FileDown className="w-3.5 h-3.5" />
                              </Button>
                              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                              <Button variant="ghost" size="sm" onClick={(e) => handleSendEmail(quote, e)} className="text-[10px] h-8 px-3 rounded-none text-slate-500 font-black uppercase tracking-widest hover:bg-teal-50 hover:text-teal-600 border-none" title="Send Email">
                                <Mail className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/quotes/${quote.id}`) }} className="text-[10px] h-8 px-4 rounded-xl text-slate-500 font-black uppercase tracking-widest hover:text-teal-600">
                            Details
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

      <SendEmailModal
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        document={emailQuote ? { type: "quote" as const, data: emailQuote } : null}
        customerEmail={quoteEmail}
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
    rejected: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status}
    </span>
  )
}
