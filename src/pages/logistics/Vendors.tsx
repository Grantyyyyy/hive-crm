import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import {
  Search,
  PlusCircle,
  Download,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { ListSkeleton } from "@/components/ui/skeletons"
import { StatusTabs } from "@/components/reusables/StatusTabs"
import type { StatusTab } from "@/components/reusables/StatusTabs"

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

  const statusTabs: StatusTab<VendorStatus>[] = [
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'inactive', label: 'Inactive' },
  ]

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

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">Procurement</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Vendors</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage your global supply chain and procurement partners.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="brand"
              onClick={() => setShowSheet(true)}
            >
              <PlusCircle className="w-4 h-4" /> Register Partner
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search vendors by name, category, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <StatusTabs<VendorStatus>
            tabs={statusTabs}
            value={activeTab}
            onChange={(value) => { setActiveTab(value as VendorStatus | 'all'); setCurrentPage(1) }}
            allLabel="All Vendors"
          />

          <Button variant="outlineNeutral" className="h-10 px-4 rounded-md">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">VAT / Tax</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-teal-500"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Building2 className="size-4 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
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
                        <StatusBadge status={vendor.status} />
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

function StatusBadge({ status }: { status: VendorStatus }) {
  const styles: Record<VendorStatus, string> = {
    active: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    inactive: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    on_hold: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  }

  const labels: Record<VendorStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    on_hold: "On Hold",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {labels[status]}
    </span>
  )
}
