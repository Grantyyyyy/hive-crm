import { useState, useMemo, useEffect, useCallback } from "react"
import { DataTable } from "@/components/reusables/DataTable"
import { useLocation } from "wouter"
import {
  UserRound,
  Search,
  PlusCircle,
  Download,
  Trash2
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ContactForm } from "@/components/crmComponent/ContactForm"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Activity, Deal } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
import { exportToCSV, debounce, calculateRelationshipScore, getRelationshipLabel } from "@/lib/helpers"
import { cn } from "@/lib/utils"

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
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
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
    return contacts
      .map((contact): EnrichedContact => {
        // Calculate relationship score for each contact
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
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.company?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [contacts, search, activities, deals])

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

  async function handleAddContact(contact: any) {
    await addItems([contact as Contact])
    setShowModal(false)
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

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 pt-2 mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">CUSTOMER DATABASE</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contacts</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Relationship management and contact details.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="brand"
              onClick={() => setShowModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Contact
            </Button>
          </div>
        </div>

        {/* Unified Search & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <button className="pb-4 font-bold text-sm tracking-wide text-teal-600 relative flex items-center gap-2 shrink-0">
              All Contacts
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
            </button>
            <button className="pb-4 font-bold text-sm tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors relative shrink-0">
              Recent
            </button>
            <button className="pb-4 font-bold text-sm tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors relative shrink-0">
              Favorites
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
              <input
                placeholder="Search by name, company, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <DataTable
          data={paginatedContacts}
          onRowClick={(c: EnrichedContact) => navigate(`/contacts/${c.id}`)}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "contacts"
          }}
          emptyState={{
            icon: <UserRound className="w-10 h-10" />,
            title: "No contacts found."
          }}
          columns={[
            {
              header: "Contact Name",
              render: (c: EnrichedContact) => {
                const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Individual</p>
                    </div>
                  </div>
                )
              }
            },
            {
              header: "Associated Company",
              render: (c: EnrichedContact) => (
                <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">{c.company || "—"}</p>
              )
            },
            {
              header: "Email Address",
              render: (c: EnrichedContact) => (
                <p className="text-[13px] text-slate-600 dark:text-slate-400">{c.email}</p>
              )
            },
            {
              header: "Phone Number",
              render: (c: EnrichedContact) => (
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-lg w-fit">
                  {c.phone || "—"}
                </div>
              )
            },
            {
              header: "Relationship",
              render: (c: EnrichedContact) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                    c.relationshipLabel === 'Hot' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                      c.relationshipLabel === 'Warm' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {c.relationshipLabel}
                  </span>
                  <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400">{c.relationshipScore}</span>
                </div>
              )
            },
            {
              header: "Last Activity",
              render: (c: EnrichedContact) => (
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
              headerClassName: "text-right",
              align: "right",
              render: (c: EnrichedContact) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingDelete(c)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )
            }
          ]}
        />
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
          <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
            <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Add New Contact</SheetTitle>
            <SheetDescription className="text-sm font-medium text-slate-500">
              Enter the details of a person you are building a relationship with.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ContactForm onSave={handleAddContact} onCancel={() => setShowModal(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Contact"
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
        deleteText="Delete Contact"
      />
    </div>
  )
}
