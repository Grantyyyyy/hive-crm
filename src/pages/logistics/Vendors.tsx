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
import { usePlan } from "@/lib/usePlan"
import { UpgradeBanner } from "@/components/reusables/UpgradeBanner"
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
import { StatusTabs, type StatusTab } from "@/components/reusables/StatusTabs"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { PageHeader } from "@/components/reusables/PageHeader"

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

  const { canAccess } = usePlan()

  if (!canAccess('procurement')) {
    return <UpgradeBanner feature="Procurement" description="Manage purchase orders, vendors, and procurement workflows." storageKey="banner-vendors-dismissed" />
  }

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

  // Column definitions
  const columns: ProcurementColumn<Vendor>[] = [
    {
      header: "Company",
      render: (vendor) => (
        <div className="flex items-center gap-3 min-w-0">
          <Building2 className="size-4 text-slate-300 group-hover:text-accent transition-colors shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{vendor.name}</p>
            <p className="text-[10px] text-slate-400 font-medium pt-0.5 uppercase tracking-tighter">ID: {vendor.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (vendor) => (
        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-tighter">{vendor.category || "Supplier"}</span>
      ),
    },
    {
      header: "Contact",
      render: (vendor) => (
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
      ),
    },
    {
      header: "VAT / Tax",
      render: (vendor) => (
        <p className="text-[11px] font-bold font-mono text-slate-500 uppercase">{vendor.taxId || "—"}</p>
      ),
    },
    {
      header: "Status",
      render: (vendor) => <StatusBadge status={vendor.status} />,
    },
    {
      header: "Actions",
      render: () => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <MoreVertical className="size-4" />
        </Button>
      ),
      align: 'right',
    },
  ]

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader 
          category="Procurement"
          title="Vendors"
          description="Manage your global supply chain and procurement partners."
          className="px-0 bg-transparent border-none pb-2"
          actions={
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="outlineNeutral">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                variant="brand"
                onClick={() => setShowSheet(true)}

              >
                <PlusCircle className="w-4 h-4 mr-2" /> Register Partner
              </Button>
            </div>
          }
        />
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search vendors by name, category, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
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

        <ProcurementDataTable<Vendor>
          data={paginatedVendors}
          columns={columns}
          isLoading={!isLoaded}
          onRowClick={(vendor) => navigate(`/vendors/${vendor.id}`)}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "vendors",
          }}
          emptyState={{
            message: "No matching results",
          }}
        />
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
