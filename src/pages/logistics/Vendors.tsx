import { useState, useMemo, useRef, useEffect } from "react"
import { useLocation } from "wouter"
import {
  Search,
  PlusCircle,
  Download,
  Loader2,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  ChevronDown,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/Pagination"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { Vendor, VendorStatus } from "@/lib/types"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { VendorForm } from "@/components/crmComponent/VendorForm"

function VendorStatusDropdown({
  vendor,
  onStatusChange,
}: {
  vendor: Vendor
  onStatusChange: (id: string, status: Vendor['status']) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (status: Vendor['status']) => {
    if (status === vendor.status || loading) return
    setLoading(true)
    await onStatusChange(vendor.id, status)
    setLoading(false)
    setOpen(false)
  }

  const statuses: Vendor['status'][] = ['active', 'inactive', 'on_hold']

  const badgeClass = {
    active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    on_hold: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  }

  const label = {
    active: 'Active',
    inactive: 'Inactive',
    on_hold: 'On Hold',
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                    text-[10px] font-black uppercase tracking-widest
                    cursor-pointer hover:opacity-80 transition-opacity
                    disabled:opacity-50 ${badgeClass[vendor.status]}`}
      >
        {loading ? '...' : label[vendor.status]}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px]
                        bg-white dark:bg-slate-900 border border-slate-200
                        dark:border-slate-800 rounded-md shadow-lg
                        overflow-hidden">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2
                         text-sm text-left hover:bg-slate-50
                         dark:hover:bg-slate-800 transition-colors
                         text-slate-700 dark:text-slate-300"
            >
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px]
                                font-black uppercase tracking-widest
                                ${badgeClass[s]}`}>
                {label[s]}
              </span>
              {s === vendor.status && (
                <Check className="w-3.5 h-3.5 ml-auto text-slate-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Vendors() {
  const [, navigate] = useLocation()
  const {
    data: vendors,
    addItems,
    updateItem,
    isLoaded
  } = useCRMResource<Vendor>('vendors')

  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<VendorStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showSheet, setShowSheet] = useState(false)

  const itemsPerPage = 10

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category?.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase())

      const matchesTab = activeTab === 'all' || v.status === activeTab

      return matchesSearch && matchesTab
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [vendors, search, activeTab])

  const totalItems = filteredVendors.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddVendor = async (vendor: Vendor) => {
    try {
      await addItems([vendor])
      setShowSheet(false)
      toast.success("Vendor added successfully")
    } catch (e: any) {
      toast.error("Failed to add vendor", { description: e.message })
    }
  }

  const handleStatusChange = async (
    id: string,
    status: Vendor['status']
  ) => {
    try {
      await updateItem(id, {
        status,
        updatedAt: new Date().toISOString()
      })
      toast.success('Vendor updated', {
        description: `Status changed to ${status.replace('_', ' ')}.`
      })
    } catch (e: unknown) {
      toast.error('Failed to update vendor', {
        description: (e as Error).message
      })
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 text-center">Initializing Directory...</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-1">Procurement</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Vendors</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage your global supply chain and procurement partners.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="default"
              onClick={() => setShowSheet(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Register Partner
            </Button>
          </div>
        </div>

        {/* Minimal Search & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none pb-[2px]">
            {(['all', 'active', 'on_hold', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={cn(
                  "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                  activeTab === tab
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <span className="capitalize">{tab.replace('_', ' ')}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                  activeTab === tab
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                )}>
                  {tab === 'all' ? vendors.length : vendors.filter(v => v.status === tab).length}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full lg:max-w-[240px] pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="w-full pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-xs font-semibold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/50 placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">VAT / Tax</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching results</p>
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Building2 className="size-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{vendor.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium pt-0.5 uppercase tracking-tighter">ID: {vendor.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-tighter">{vendor.category || "Supplier"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                            <Mail className="size-3 text-slate-300" />
                            {vendor.email}
                          </div>
                          {vendor.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                              <Phone className="size-3 text-slate-300" />
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-bold font-mono text-slate-500 uppercase">{vendor.taxId || "—"}</p>
                      </td>
                      <td className="px-6 py-5">
                        <VendorStatusDropdown vendor={vendor} onStatusChange={handleStatusChange} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total <span className="text-slate-900 dark:text-white">{totalItems}</span>
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="p-0 border-l border-slate-200 dark:border-slate-800 flex flex-col">
          <SheetHeader className="px-8 pt-8 pb-4">
            <SheetTitle className="text-xl font-black tracking-tight">Register Partner</SheetTitle>
            <SheetDescription className="text-xs font-medium">Add a new procurement vendor to your directory.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <VendorForm
              onSave={handleAddVendor}
              onCancel={() => setShowSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
