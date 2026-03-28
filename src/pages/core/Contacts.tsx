import { useState, useMemo } from "react"
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
import type { Contact } from "@/lib/types"
import { PageSkeleton } from "@/components/ui/page-skeleton"

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

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.company?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [contacts, search])

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

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 pt-2 mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">CUSTOMER DATABASE</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">Contacts</h1>
            <p className="text-sm font-semibold text-text-muted">Relationship management and contact details.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="default"
              onClick={() => setShowModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Contact
            </Button>
          </div>
        </div>

        {/* Unified Search & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border mb-8">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <button className="pb-4 font-bold text-sm tracking-wide text-indigo-600 relative flex items-center gap-2 shrink-0">
              All Contacts
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            </button>
            <button className="pb-4 font-bold text-sm tracking-wide text-text-secondary hover:text-text-primary transition-colors relative shrink-0">
              Recent
            </button>
            <button className="pb-4 font-bold text-sm tracking-wide text-text-secondary hover:text-text-primary transition-colors relative shrink-0">
              Favorites
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within/search:text-indigo-600 transition-colors" />
              <input
                placeholder="Search by name, company, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-bg-surface border-border rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/50 placeholder:text-text-muted outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-bg-surface rounded-md border border-border shadow-xl shadow-indigo-600/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-bg-elevated/50 border-b border-border text-center">
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted">Contact Name</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted">Associated Company</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted">Email Address</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted">Phone Number</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted">Last Activity</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserRound className="w-10 h-10 text-text-muted/30" />
                        <p className="text-text-muted font-medium">No contacts found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((c: Contact) => {
                    const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-bg-surface transition-all cursor-pointer group border-l-4 border-transparent hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/5 relative z-0 hover:z-10"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-bg-elevated overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-text-secondary ring-1 ring-bg-surface shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-text-primary truncate">{c.name}</p>
                              <p className="text-[11px] text-text-muted truncate">Individual</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] font-semibold text-text-secondary">{c.company || "—"}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] text-text-secondary">{c.email}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="px-2 py-1 bg-bg-elevated/50 text-text-secondary text-[11px] font-bold rounded w-fit">
                            {c.phone || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] text-text-secondary">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-text-muted hover:text-red transition-all"
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
