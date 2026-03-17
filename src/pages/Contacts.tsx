import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import { 
  UserRound, 
  Search, 
  Plus, 
  Download, 
  Filter, 
  MoreVertical
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
import { ContactForm } from "@/components/crm/ContactForm"
import { useCRMResource } from "@/lib/hooks"
import type { Contact } from "@/lib/types"

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

  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [contacts, search])

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    )
  }

  function handleAddContact(contact: Contact) {
    addItems([contact])
    setShowModal(false)
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Relationship Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Database</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider h-11 px-5 bg-white dark:bg-slate-900">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider h-11 px-5 bg-white dark:bg-slate-900">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-5 shadow-lg shadow-indigo-200 dark:shadow-none transition-all ml-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search contacts by name, company, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {/* Data Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Contact Name</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Associated Company</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Email Address</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Phone Number</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Last Activity</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserRound className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">No contacts found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c: Contact) => {
                    const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                              <p className="text-xs text-slate-400 truncate">Individual</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{c.company || "—"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg w-fit">
                            {c.phone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm("Delete this contact?")) {
                                deleteItem(c.id)
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
              Showing <span className="text-slate-600 dark:text-slate-300">{filtered.length > 0 ? 1 : 0}-{filtered.length}</span> of <span className="text-slate-600 dark:text-slate-300">{filtered.length}</span> contacts
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-widest bg-white dark:bg-slate-900">
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-indigo-600 text-white text-[11px] font-bold">1</Button>
              </div>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-widest bg-white dark:bg-slate-900">
                Next
              </Button>
            </div>
          </div>
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
    </div>
  )
}

