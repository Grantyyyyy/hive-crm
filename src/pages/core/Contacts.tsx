import { useState, useMemo, useEffect, useCallback } from "react"
import { Pagination } from "@/components/ui/Pagination"
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
import type { Contact, Activity } from "@/lib/types"
import { PageSkeleton } from "@/components/ui/page-skeleton"
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
        const hasActiveDeals = false // Would need deals data for full implementation
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
  }, [contacts, search, activities])

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedContacts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (!isLoaded) {
    return <PageSkeleton />
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
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none"
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

        {/* Data Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-center">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Contact Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Associated Company</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Email Address</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Phone Number</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Relationship</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">Last Activity</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserRound className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No contacts found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((c: EnrichedContact) => {
                    const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group border-l-4 border-transparent hover:border-teal-600 hover:shadow-xl hover:shadow-teal-600/5 relative z-0 hover:z-10"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Individual</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">{c.company || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] text-slate-600 dark:text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-md w-fit">
                            {c.phone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] text-slate-600 dark:text-slate-400">
                            {c.lastActivityDate
                              ? new Date(c.lastActivityDate).toLocaleDateString()
                              : c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString()
                                : '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
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
            itemLabel="contacts"
          />
        </div>
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetHeader>
          <SheetTitle>Add New Contact</SheetTitle>
          <SheetDescription>
            Enter the details of a person you are building a relationship with.
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <ContactForm onSave={handleAddContact} onCancel={() => setShowModal(false)} />
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
