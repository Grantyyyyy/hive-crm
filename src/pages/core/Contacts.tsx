import { useState, useMemo } from "react"
import { Pagination } from "@/components/ui/Pagination"
import { useLocation } from "wouter"
import {
  UserRound,
  Search,
  Plus,
  Download,
  Filter,
  Trash2
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ContactForm } from "@/components/crm/ContactForm"
import { useCRMResource } from "@/lib/hooks"
import type { Contact } from "@/lib/types"
import { PageSkeleton } from "@/components/ui/page-skeleton"

export function Contacts() {
  const [, navigate] = useLocation()
  const {
    data: contacts,
    search,
    setSearch,
    isLoaded,
    addItems,
    deleteItem
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

  async function handleAddContact(contact: CreateContactInput) {
    await addItems([contact as unknown as Contact])
    setShowModal(false)
  }

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">Relationship Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Customer Database</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outlineNeutral">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="default"
              onClick={() => setShowModal(true)}
              className="ml-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <Input
            placeholder="Search contacts by name, company, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-bg-surface border-border rounded-2xl shadow-sm text-sm font-medium focus:ring-accent focus:border-accent placeholder:text-text-muted"
          />
        </div>

        {/* Data Table Card */}
        <div className="bg-bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-bg-elevated/50 border-b border-border">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Contact Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Associated Company</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Email Address</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Phone Number</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted">Last Activity</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-text-muted text-right">Actions</th>
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
                        className="hover:bg-bg-elevated/30 transition-colors cursor-pointer group"
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
                            {new Date(c.createdAt).toLocaleDateString()}
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

