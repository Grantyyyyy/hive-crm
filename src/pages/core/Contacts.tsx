import { useState, useMemo, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import {
  UserRound,
  Search,
  PlusCircle,
  Download,
  Trash2,
  ArrowRight,
  FileSearch,
  UserRound as UserRoundIcon,
} from "lucide-react"
import { PageHeader } from "@/components/reusables/PageHeader"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import { EditContactSheet } from "@/components/crmComponent/EditContactSheet"
import { useCRMResource } from "@/lib/hooks"
import { usePlan } from "@/lib/usePlan"
import type { Contact, Activity, Deal } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
import { exportToCSV, debounce, calculateRelationshipScore, getRelationshipLabel } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { InitialsAvatar } from "@/components/reusables/InitialsAvatar"
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
  const { isAtLimit } = usePlan()

  const atContactLimit = isAtLimit('contacts', contacts.length)

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

  const contactActivityMap = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string | null }>()
    for (const a of activities) {
      if (!a.contactId) continue
      const existing = map.get(a.contactId)
      if (!existing) {
        map.set(a.contactId, { count: 1, lastDate: a.createdAt })
      } else {
        existing.count += 1
        if (!existing.lastDate || a.createdAt > existing.lastDate) {
          existing.lastDate = a.createdAt
        }
      }
    }
    return map
  }, [activities])

  const contactHasActiveDealSet = useMemo(() => {
    const set = new Set<string>()
    for (const d of deals) {
      if (d.contactId && d.stage !== 'won' && d.stage !== 'lost') {
        set.add(d.contactId)
      }
    }
    return set
  }, [deals])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let result = contacts.map((contact): EnrichedContact => {
      const activityInfo = contactActivityMap.get(contact.id) ?? { count: 0, lastDate: null }
      const hasActiveDeals = contactHasActiveDealSet.has(contact.id)
      const score = calculateRelationshipScore(
        activityInfo.count,
        activityInfo.lastDate,
        hasActiveDeals
      )
      const scoreLabel = getRelationshipLabel(score)

      return {
        ...contact,
        relationshipScore: score,
        relationshipLabel: scoreLabel,
        lastActivityDate: activityInfo.lastDate,
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

    if (activeTab === 'recent') {
      result = result.sort((a, b) => (b.lastActivityDate || '').localeCompare(a.lastActivityDate || ''))
    } else if (activeTab === 'favorites') {
      result = result.filter(c => c.relationshipScore > 70)
    } else {
      result = result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    }

    return result
  }, [contacts, search, contactActivityMap, contactHasActiveDealSet, activeTab])

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
        return (
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={c.name}
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm"
              textClassName="text-[10px] font-black uppercase"
            />
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
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader 
          category="Customer Database"
          title="Contacts"
          description="Relationship management and contact details."
          className="px-0 bg-transparent border-none pb-2"
          actions={
            <>
              <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="brand"
                onClick={() => { setEditingContact(null); setShowModal(true) }}
                disabled={atContactLimit}
                title={atContactLimit ? "Upgrade to add more contacts" : undefined}
                className={atContactLimit ? "disabled:opacity-50 disabled:cursor-not-allowed" : ""}
              >
                <PlusCircle className="w-4 h-4" /> Create Contact
              </Button>
            </>
          }
        />

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
