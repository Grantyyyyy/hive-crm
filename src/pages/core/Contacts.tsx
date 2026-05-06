import { useState, useMemo, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import {
  UserRound,
  Search,
  PlusCircle,
  Download,
  Trash2,
  Filter,
  ArrowRight,
  FileSearch
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import { EditContactSheet } from "@/components/crmComponent/EditContactSheet"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Activity, Deal } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
import { exportToCSV, debounce, calculateRelationshipScore, getRelationshipLabel } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { StatusTabs, type StatusTab } from "@/components/reusables/StatusTabs"

interface EnrichedContact extends Contact {
  relationshipScore: number
  relationshipLabel: string
  lastActivityDate: string | null
}

export function Contacts() {
  const [, navigate] = useLocation()
  const {
    data: contacts,
    isLoaded,
    addItems,
    deleteItem,
    error,
    refresh
  } = useCRMResource<Contact>('contacts')

  const { data: activities } = useCRMResource<Activity>('activities')
  const { data: deals } = useCRMResource<Deal>('deals')

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all')
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
    let result = contacts.map((contact): EnrichedContact => {
      const contactActivities = activities
        .filter(a => a.contactId === contact.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const lastActivity = contactActivities[0] ?? null
      const hasActiveDeals = deals.some(
        d => d.contactId === contact.id &&
          d.stage !== 'won' &&
          d.stage !== 'lost'
      )
      const score = calculateRelationshipScore(
        contactActivities.length,
        lastActivity?.createdAt ?? null,
        hasActiveDeals
      )
      const scoreLabel = getRelationshipLabel(score)

      return {
        ...contact,
        relationshipScore: score,
        relationshipLabel: scoreLabel,
        lastActivityDate: lastActivity?.createdAt ?? null,
      }
    })

    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.company?.toLowerCase().includes(q) ?? false)
      )
    }

    // Tab filtering (mock logic for favorites/recent based on score/date)
    if (activeTab === 'recent') {
      result = result.sort((a, b) => (b.lastActivityDate || '').localeCompare(a.lastActivityDate || ''))
    } else if (activeTab === 'favorites') {
      result = result.filter(c => c.relationshipScore > 70)
    } else {
      result = result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    }

    return result
  }, [contacts, search, activities, deals, activeTab])

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedContacts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (!isLoaded) {
    return <ListSkeleton />
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => refresh()}>Retry</Button>
        </div>
      </div>
    )
  }

  async function handleSaveContact(contact: any) {
    addItems([contact as Contact])
    setShowModal(false)
    setEditingContact(null)
  }

  function handleExportCSV() {
    exportToCSV(
      filtered,
      [
        { key: 'name', header: 'Contact Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'company', header: 'Company' },
        { key: 'source', header: 'Source' },
        { key: 'createdAt', header: 'Date Added' },
      ],
      'contacts'
    )
  }

  const columns: ProcurementColumn<EnrichedContact>[] = [
    {
      header: "Contact",
      render: (c) => {
        const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.email || "No email"}</p>
            </div>
          </div>
        )
      }
    },
    {
      header: "Organization",
      render: (c) => (
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate">{c.company || "—"}</p>
        </div>
      )
    },
    {
      header: "Relationship",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm border border-transparent",
            c.relationshipLabel === 'Hot' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
              c.relationshipLabel === 'Warm' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          )}>
            {c.relationshipLabel}
          </span>
          <span className="text-[12px] font-bold text-slate-500">{c.relationshipScore}</span>
        </div>
      )
    },
    {
      header: "Last Activity",
      render: (c) => (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          {c.lastActivityDate
            ? new Date(c.lastActivityDate).toLocaleDateString()
            : c.createdAt
              ? new Date(c.createdAt).toLocaleDateString()
              : '—'}
        </p>
      )
    },
    {
      header: "Actions",
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-accent transition-all"
            onClick={(e) => {
              e.stopPropagation()
              setEditingContact(c)
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
              setPendingDelete(c)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const contactTabOptions: StatusTab<any>[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'favorites', label: 'Favorites' },
  ]

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">Customer Database</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Contacts</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Relationship management and contact details.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="brand"
              onClick={() => { setEditingContact(null); setShowModal(true) }}
            >
              <PlusCircle className="w-4 h-4" /> Create Contact
            </Button>
          </div>
        </div>

        <ProcurementDataTable<EnrichedContact>
          data={paginatedContacts}
          columns={columns}
          onRowClick={(c) => navigate(`/contacts/${c.id}`)}
          emptyState={{
            icon: <FileSearch className="w-10 h-10 text-slate-300" />,
            message: "No contacts found matching your criteria."
          }}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "contacts"
          }}
          searchInput={
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by name, company, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          }
          filterTabs={
            <>
              <StatusTabs
                tabs={contactTabOptions}
                value={activeTab}
                onChange={setActiveTab}
                allLabel="All Contacts"
              />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                <Filter className="w-4 h-4" /> Advanced
              </Button>
            </>
          }
        />

        <EditContactSheet
          open={showModal}
          onOpenChange={(open) => { setShowModal(open); if (!open) setEditingContact(null) }}
          editingContact={editingContact}
          onSave={handleSaveContact}
        />

        <DeleteModal
          open={!!pendingDelete}
          onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
          title="Delete Contact"
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
          deleteText="Delete Contact"
        />
      </div>
    </div>
  )
}
