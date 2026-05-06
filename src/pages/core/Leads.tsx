import { useState, useMemo, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import {
  UserSearch,
  Search,
  PlusCircle,
  Trash2,
  Download,
  Upload,
  Filter,
  Globe,
  Users,
  Target,
  Mail,
  FileSearch,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SheetDescription,
} from "@/components/ui/sheet"
import { LeadSheet } from "@/components/crmComponent/EditLeadSheet"
import { LeadForm } from "@/components/crmComponent/LeadForm"
import { InitialsAvatar } from "@/components/reusables/InitialsAvatar"
import { useCRMResource } from "@/lib/hooks"
import { ListSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"
import type { Lead, LeadStatus, LeadSource } from "@/lib/types"
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { exportToCSV, debounce } from "@/lib/helpers"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { StatusTabs, type StatusTab } from "@/components/reusables/StatusTabs"

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
  new: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500" },
  contacted: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-600" },
  qualified: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600" },
  unqualified: { bg: "bg-slate-50 dark:bg-slate-900/30", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400" },
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

  const statusTabs: StatusTab<LeadStatus>[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'converted', label: 'Converted' },
  ]

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
    return <ListSkeleton />
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
        { key: 'position', header: 'Position' },
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

  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = text.split('\n').map(row => row.trim()).filter(Boolean);
      if (rows.length <= 1) return;

      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      const newLeads = rows.slice(1).map(row => {
        const values: string[] = [];
        let inQuotes = false;
        let currentVal = '';
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentVal);
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal);

        const lead: Partial<Lead> = {
          source: 'import',
          status: 'new',
          score: 50,
          name: 'Unknown Lead',
          email: '',
          ownerId: userId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        headers.forEach((header, idx) => {
          let val = (values[idx] || '').trim();
          val = val.replace(/^"|"$/g, '');
          if (!val) return;

          if (header.includes('name')) lead.name = val;
          else if (header.includes('email')) lead.email = val;
          else if (header.includes('phone')) lead.phone = val;
          else if (header.includes('company')) lead.company = val;
          else if (header.includes('position')) lead.position = val;
          else if (header.includes('source')) lead.source = val as LeadSource;
          else if (header.includes('status')) lead.status = val as LeadStatus;
          else if (header.includes('score')) lead.score = parseInt(val, 10) || 50;
        });

        return lead as Omit<Lead, "id">;
      });

      if (newLeads.length > 0) {
        addItems(newLeads);
      }
      
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  const columns: ProcurementColumn<Lead>[] = [
    {
      header: "Lead Contact",
      render: (lead) => {
        return (
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={lead.name}
              className="w-8 h-8 rounded-full shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
              textClassName="text-[10px] font-black uppercase"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{lead.name}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{lead.email}</p>
            </div>
          </div>
        )
      }
    },
    {
      header: "Company & Position",
      render: (lead) => (
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate">{lead.company || "—"}</p>
          {lead.position && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{lead.position}</p>
          )}
        </div>
      )
    },
    {
      header: "Source",
      render: (lead) => {
        const SourceIcon = SOURCE_ICONS[lead.source] || Globe
        return (
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md w-fit">
            <SourceIcon className="w-3.5 h-3.5" />
            {lead.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        )
      }
    },
    {
      header: "Status",
      render: (lead) => {
        const status = STATUS_STYLE[lead.status] || STATUS_STYLE.new
        return (
          <div className={cn(
            "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border border-transparent shadow-sm",
            status.bg,
            status.text
          )}>
            <div className={cn("size-1.5 rounded-full", status.dot)} />
            {LEAD_STATUS_LABELS[lead.status] || lead.status}
          </div>
        )
      }
    },
    {
      header: "Score",
      render: (lead) => (
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
            "text-[12px] font-bold",
            lead.score >= 70 ? "text-emerald-600" :
              lead.score >= 40 ? "text-amber-600" : "text-red-600"
          )}>
            {lead.score}
          </span>
        </div>
      )
    },
    {
      header: "Actions",
      align: "right",
      render: (lead) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-accent transition-all"
            onClick={(e) => {
              e.stopPropagation()
              setEditingLead(lead)
              setShowModal(true)
            }}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              setPendingDelete(lead)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">Sales Pipeline</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Leads</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage and track your prospective customers through the sales funnel.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('csv-upload')?.click()} 
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="brand"
              onClick={() => { setEditingLead(null); setShowModal(true) }}
            >
              <PlusCircle className="w-4 h-4" />
              Create Lead
            </Button>
          </div>
        </div>

        <ProcurementDataTable<Lead>
          data={paginatedLeads}
          columns={columns}
          onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
          emptyState={{
            icon: <FileSearch className="w-10 h-10 text-slate-300" />,
            message: "No leads found matching your selection."
          }}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "leads"
          }}
          searchInput={
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search leads by name, email, or company..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          }
          filterTabs={
            <>
              <StatusTabs<LeadStatus>
                tabs={statusTabs}
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Leads"
              />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                <Filter className="w-4 h-4" /> More Filters
              </Button>
            </>
          }
        />

        <LeadSheet
          open={showModal}
          onOpenChange={(open) => { setShowModal(open); if (!open) setEditingLead(null) }}
          editingLead={editingLead}
          userId={userId}
          onSave={handleSaveLead}
        />

        <DeleteModal
          open={!!pendingDelete}
          onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
          title="Delete Lead"
          description={
            <>
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{pendingDelete?.name}</strong>?
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
    </div>
  )
}
