import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import { 
  UserSearch, 
  Search, 
  Plus, 
  MoreVertical, 
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
  new:          { bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-600" },
  contacted:    { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-600" },
  qualified:    { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600" },
  unqualified:  { bg: "bg-slate-100 dark:bg-slate-800",   text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  converted:    { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-600" },
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

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    )
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Leads</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage and track your prospective customers through the sales funnel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider h-11 px-5">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => { setEditingLead(null); setShowModal(true) }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-5 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {/* Filters & Table Container */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                  statusFilter === "all" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                All Leads
              </button>
              {LEAD_STATUSES.filter(s => ["new", "contacted", "qualified"].includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                    statusFilter === s 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </button>
          </div>

          {/* Data Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50">
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Lead Name</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Company</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Source</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Status</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Date Added</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <UserSearch className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-500 font-medium">No leads found matching your selection.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((lead) => {
                      const status = STATUS_STYLE[lead.status] || STATUS_STYLE.new
                      const SourceIcon = SOURCE_ICONS[lead.source] || Globe
                      const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      
                      return (
                        <tr 
                          key={lead.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm",
                                lead.status === 'qualified' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : 
                                lead.status === 'new' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : 
                                "bg-slate-50 text-slate-600 dark:bg-slate-800"
                              )}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{lead.name}</p>
                                <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{lead.company || "—"}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold rounded-lg w-fit">
                              <SourceIcon className="w-3.5 h-3.5" />
                              {lead.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit shadow-sm",
                              status.bg,
                              status.text
                            )}>
                              {lead.status}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm("Delete this lead?")) {
                                  deleteItem(lead.id)
                                }
                              }}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Row */}
            <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-transparent">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing <span className="text-slate-600 dark:text-slate-300">{filtered.length > 0 ? 1 : 0}-{filtered.length}</span> of <span className="text-slate-600 dark:text-slate-300">{filtered.length}</span> leads
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-widest">
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-widest bg-white dark:bg-slate-900">
                  Next
                </Button>
              </div>
            </div>
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
            initialData={editingLead ?? undefined}
            onSave={handleSaveLead}
            onCancel={() => setShowModal(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

