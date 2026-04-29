import { useState, useMemo } from "react"
import {
  FileText,
  Search,
  PlusCircle,
  Filter,
  Download,
  FileDown,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2
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
import { StatCard } from "@/components/reusables/StatCard"
import { StatusTabs } from "@/components/reusables/StatusTabs"
import type { StatusTab } from "@/components/reusables/StatusTabs"
import { SalesTable, type SalesColumn } from "@/components/reusables/SalesTable"

const fmtCurrency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

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

      // Audit log
      const { supabase } = await import("@/lib/supabaseClient")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        let organizationId = null
        if (session?.access_token) {
          try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]))
            organizationId = payload?.org_id ?? null
          } catch {}
        }
        supabase.from('audit_log').insert({
          entity_type: 'quotes',
          entity_id: quote.id,
          action: 'DOWNLOAD_PDF',
          changed_by: user.id,
          organization_id: organizationId,
          diff: { timestamp: new Date().toISOString() }
        }).then(({ error }: any) => {
          if (error) console.error("Failed to emit audit log:", error)
        })
      }
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

  const statusTabs: StatusTab<QuoteStatus>[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'expired', label: 'Expired' },
  ]

  // Column definitions
  const columns: SalesColumn<Quote>[] = [
    {
      header: "Quote ID",
      render: (quote) => (
        <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">#{quote.quoteNumber}</span>
      ),
    },
    {
      header: "Target Client",
      render: (quote) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[11px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm">
            {quote.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{quote.customerName}</span>
        </div>
      ),
    },
    {
      header: "Project Value",
      render: (quote) => (
        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD', minimumFractionDigits: 2 }).format(quote.amount)}
        </span>
      ),
    },
    {
      header: "Lifecycle",
      render: (quote) => <StatusBadge status={quote.status} />,
    },
    {
      header: "Issued On",
      render: (quote) => (
        <span className="text-[13px] text-slate-600 dark:text-slate-400">
          {new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (quote) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
          {quote.status === 'draft' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkSent(quote); }} className="text-[11px] h-8 px-4 rounded-xl font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50">
              Mark Sent
            </Button>
          )}
          {quote.status === 'sent' && (
            <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); handleAccept(quote); }} className="bg-teal-600 hover:bg-teal-700 text-[11px] h-8 px-4 rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95">
              Accept
            </Button>
          )}
          {(quote.status === 'sent' || quote.status === 'accepted') && (
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
              <Button variant="ghost" size="sm" onClick={(e) => handleDownloadPDF(quote, e as any)} className="text-[11px] h-8 px-3 rounded-none text-slate-500 font-bold hover:bg-teal-50 hover:text-teal-600 border-none" title="Download PDF">
                <FileDown className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <Button variant="ghost" size="sm" onClick={(e) => handleSendEmail(quote, e as any)} className="text-[11px] h-8 px-3 rounded-none text-slate-500 font-bold hover:bg-teal-50 hover:text-teal-600 border-none" title="Send Email">
                <Mail className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/quotes/${quote.id}`) }} className="text-[11px] h-8 px-4 rounded-xl text-slate-500 font-bold hover:text-teal-600">
            Details
          </Button>
        </div>
      ),
      align: 'right',
    },
  ]

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">Sales & Revenue</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Quotations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage and track customer price estimates and validities.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="brand"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Quote
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Quote Value"
            value={fmtCurrency(quotes.reduce((sum, q) => sum + q.amount, 0))}
            icon={<DollarSign className="w-5 h-5" />}
            accentColor="teal"
            badge="+15.3%"
            badgeColor="emerald"
          />
          <StatCard
            label="Pending Response"
            value={quotes.filter(q => q.status === 'sent').length.toString()}
            icon={<Clock className="w-5 h-5" />}
            accentColor="amber"
            badge="Follow Up"
            badgeColor="amber"
          />
          <StatCard
            label="Accepted Quotes"
            value={quotes.filter(q => q.status === 'accepted').length.toString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="emerald"
            badge="This Month"
            badgeColor="emerald"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search quotes, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <StatusTabs<QuoteStatus>
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All Quotes"
          />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>

        <SalesTable<Quote>
          data={paginatedQuotes}
          columns={columns}
          isLoading={!isLoaded}
          onRowClick={(quote) => navigate(`/quotes/${quote.id}`)}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "quotes",
          }}
          emptyState={{
            icon: (
              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
            ),
            message: "No quotations discovered.",
          }}
        />
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
