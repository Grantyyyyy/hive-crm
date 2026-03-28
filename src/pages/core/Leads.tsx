import { useState, useMemo, useEffect, useCallback } from "react"
import { Pagination } from "@/components/ui/Pagination"
import { useLocation } from "wouter"
import {
  UserSearch,
  Search,
  PlusCircle,
  Trash2,
  Download,
  Filter,
  Globe,
  Users,
  Target,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { LeadForm } from "@/components/crmComponent/LeadForm"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import type { Lead, LeadStatus, LeadSource } from "@/lib/types"
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { exportToCSV, debounce } from "@/lib/helpers"

const SOURCE_ICONS: Record<LeadSource, any> = {
  website: Globe,
  referral: Users,
  ad: Target,
  email: Mail,
  manual: Users,
  'cold-outreach': Users,
  import: Download
}

const STATUS_STYLE: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-600" },
  contacted: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-600" },
  qualified: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600" },
  unqualified: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  converted: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-600" },
}

export function Leads() {
  const [, navigate] = useLocation()
  const {
    data: leads,
    search,
    setSearch,
    userId,
    isLoaded,
    addItems,
    updateItem,
    deleteItem
  } = useCRMResource<Lead>('leads')

  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all")
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const itemsPerPage = 10

  // Debounced search
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setSearch(value), 300),
    [setSearch]
  )

  useEffect(() => {
    debouncedSetSearch(searchInput)
  }, [searchInput, debouncedSetSearch])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads
      .filter(l => {
        if (statusFilter !== "all" && l.status !== statusFilter) return false
        if (q && !l.name.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q) && !(l.company?.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [leads, search, statusFilter])

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedLeads = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (!isLoaded) {
    return <PageSkeleton />
  }

  function handleSaveLead(lead: Lead) {
    if (editingLead) {
      updateItem(lead.id, lead)
    } else {
      addItems([lead])
    }
    setShowModal(false)
    setEditingLead(null)
  }

  function handleExportCSV() {
    exportToCSV(
      filtered,
      [
        { key: 'name', header: 'Lead Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'company', header: 'Company' },
        { key: 'source', header: 'Source' },
        { key: 'status', header: 'Status' },
        { key: 'score', header: 'Score' },
        { key: 'createdAt', header: 'Date Added' },
      ],
      'leads'
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">SALES PIPELINE</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Leads</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Manage and track your prospective customers through the sales funnel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none"
              onClick={() => { setEditingLead(null); setShowModal(true) }}
            >
              <PlusCircle className="w-4 h-4" />
              Create Lead
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-12 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400"
          />
        </div>

        {/* Filters & Table Container */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800 w-fit">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={cn("h-8 px-5 rounded-md transition-all", statusFilter === "all" && "bg-teal-600 text-white shadow-md hover:bg-teal-700")}
              >
                All Leads
              </Button>
              {LEAD_STATUSES.filter(s => ["new", "contacted", "qualified"].includes(s)).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className={cn("h-8 px-5 rounded-md transition-all", statusFilter === s && "bg-teal-600 text-white shadow-md hover:bg-teal-700")}
                >
                  {LEAD_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-auto py-2 border-slate-200 dark:border-slate-800">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
          </div>

          {/* Data Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Lead Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Company</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Source</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Score</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Date Added</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <UserSearch className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">No leads found matching your selection.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => {
                      const status = STATUS_STYLE[lead.status] || STATUS_STYLE.new
                      const SourceIcon = SOURCE_ICONS[lead.source] || Globe
                      const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group border-l-4 border-transparent hover:border-teal-600 hover:shadow-xl hover:shadow-teal-600/5 relative z-0 hover:z-10"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800",
                                lead.status === 'qualified' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                                  lead.status === 'new' ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" :
                                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{lead.name}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{lead.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">{lead.company || "—"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-md w-fit">
                              <SourceIcon className="w-3.5 h-3.5" />
                              {lead.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit",
                              status.bg,
                              status.text
                            )}>
                              {LEAD_STATUS_LABELS[lead.status] || lead.status}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    lead.score >= 70 ? "bg-emerald-500" :
                                      lead.score >= 40 ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${lead.score}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-[13px] font-bold",
                                lead.score >= 70 ? "text-emerald-600" :
                                  lead.score >= 40 ? "text-amber-600" : "text-red-600"
                              )}>
                                {lead.score}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[13px] text-slate-600 dark:text-slate-400">
                              {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPendingDelete(lead)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel="leads"
            />
          </div>
        </div>
      </div>

      <Sheet open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setEditingLead(null) }}>
        <SheetHeader>
          <SheetTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</SheetTitle>
          <SheetDescription>
            {editingLead
              ? "Update the details for this sales prospect."
              : "Fill in the information to create a new sales prospect."}
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <LeadForm
            userId={userId}
            onSave={handleSaveLead}
            onCancel={() => setShowModal(false)}
            initialData={editingLead ?? undefined}
          />
        </SheetContent>
      </Sheet>

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Lead"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-text-primary font-bold">{pendingDelete?.name}</strong>?
            {" "}This action cannot be undone.
          </>
        }
        onDelete={() => {
          if (pendingDelete) deleteItem(pendingDelete.id)
          setPendingDelete(null)
        }}
        cancelText="Cancel"
        deleteText="Delete Lead"
      />
    </div>
  )
}
