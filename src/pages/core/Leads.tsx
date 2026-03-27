import { useState, useMemo } from "react"
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
import { LeadForm } from "@/components/crm/LeadForm"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import type { Lead, LeadStatus, LeadSource } from "@/lib/types"
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  converted: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-600" },
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
  const itemsPerPage = 10

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

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Leads</h1>
            <p className="text-text-muted mt-1 font-medium">
              Manage and track your prospective customers through the sales funnel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="default"
              onClick={() => { setEditingLead(null); setShowModal(true) }}
            >
              <PlusCircle className="w-4 h-4" />
              Create Lead
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-bg-surface border-border rounded-2xl shadow-sm text-sm font-medium focus:ring-accent focus:border-accent placeholder:text-text-muted"
          />
        </div>

        {/* Filters & Table Container */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-bg-surface p-1 rounded-2xl border border-border w-fit">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 px-5 rounded-xl transition-all"
              >
                All Leads
              </Button>
              {LEAD_STATUSES.filter(s => ["new", "contacted", "qualified"].includes(s)).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="h-8 px-5 rounded-xl transition-all"
                >
                  {LEAD_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <Button variant="ghostPrimary" size="sm" className="h-auto py-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
          </div>

          {/* Data Table Card */}
          <div className="bg-bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-bg-elevated/50 border-b border-border">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Lead Name</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Company</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Source</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Status</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Date Added</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <UserSearch className="w-10 h-10 text-text-muted/30" />
                          <p className="text-text-muted font-medium">No leads found matching your selection.</p>
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
                          className="hover:bg-bg-elevated/30 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-sm ring-1 ring-bg-surface",
                                lead.status === 'qualified' ? "bg-green/10 text-green" :
                                  lead.status === 'new' ? "bg-accent/10 text-accent" :
                                    "bg-bg-elevated text-text-secondary"
                              )}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-text-primary truncate">{lead.name}</p>
                                <p className="text-[11px] text-text-muted truncate">{lead.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-[13px] font-semibold text-text-secondary">{lead.company || "—"}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 px-2 py-1 bg-bg-elevated/50 text-text-secondary text-[11px] font-bold rounded w-fit">
                              <SourceIcon className="w-3.5 h-3.5" />
                              {lead.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className={cn(
                              "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit",
                              status.bg && (
                                status.bg.includes('blue') ? 'bg-accent/10 text-accent' :
                                  status.bg.includes('amber') ? 'bg-amber/10 text-amber' :
                                    status.bg.includes('emerald') ? 'bg-green/10 text-green' :
                                      status.bg.includes('indigo') ? 'bg-accent/10 text-accent' : 'bg-bg-elevated text-text-secondary'
                              )
                            )}>
                              {lead.status}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-[13px] text-text-secondary">
                              {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-text-muted hover:text-red transition-all"
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
