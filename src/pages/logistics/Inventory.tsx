import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  Download,
  PlusCircle,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { AddInventorySheet } from "@/components/logisticsComponent/AddInventorySheet"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { InventoryItem, StockLevel, InventoryStatus } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { StatusTabs } from "@/components/reusables/StatusTabs"
import type { StatusTab } from "@/components/reusables/StatusTabs"

export function Inventory() {
  const [, navigate] = useLocation()
  const {
    data: items,
    isLoaded
  } = useCRMResource<InventoryItem>('inventory')

  const [search, setSearch] = useState("")
  const [filterState, setFilterState] = useState<'all' | 'low_stock' | 'out_of_stock' | 'draft'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const itemsPerPage = 8

  const statusTabs: StatusTab<'low_stock' | 'out_of_stock' | 'draft'>[] = [
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'draft', label: 'Drafts' },
  ]

  // Removed legacy dummy data seeding

  // Filter logic
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      let matchesFilter = true
      if (filterState === 'low_stock') matchesFilter = item.stockLevel === 'low_stock'
      else if (filterState === 'out_of_stock') matchesFilter = item.stockLevel === 'out_of_stock'
      else if (filterState === 'draft') matchesFilter = item.status === 'draft'

      const q = search.toLowerCase()
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [items, filterState, search])

  // Pagination
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Column definitions
  const columns: ProcurementColumn<InventoryItem>[] = [
    {
      header: "Product",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{item.name}</span>
        </div>
      ),
    },
    {
      header: "SKU",
      render: (item) => (
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{item.sku}</span>
      ),
    },
    {
      header: "Category",
      render: (item) => (
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{item.category}</span>
      ),
    },
    {
      header: "Price",
      render: (item) => (
        <span className="text-[13px] font-bold text-slate-900 dark:text-white">
          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Stock Level",
      render: (item) => <StockBadge level={item.stockLevel} quantity={item.stockQuantity} reserved={item.reservedQuantity} />,
    },
    {
      header: "Status",
      render: (item) => <ItemStatusBadge status={item.status} />,
    },
    {
      header: "Actions",
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-600 transition-colors h-6 px-2"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      ),
      align: 'right',
    },
  ]

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">Products</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Inventory</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage stock, products, and variants.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button variant="brand" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Product
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search products by name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <StatusTabs<'low_stock' | 'out_of_stock' | 'draft'>
            tabs={statusTabs}
            value={filterState}
            onChange={setFilterState}
            allLabel="All Products"
          />

          <Button variant="outlineNeutral" className="h-10 px-4 rounded-md">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        <ProcurementDataTable<InventoryItem>
          data={paginatedItems}
          columns={columns}
          isLoading={!isLoaded}
          onRowClick={(item) => navigate(`/inventory/${item.id}`)}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "items",
          }}
          emptyState={{
            icon: <Package className="w-10 h-10 text-slate-300" />,
            message: "No inventory items found.",
          }}
        />
      </div>

      <AddInventorySheet
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  )
}

function StockBadge({ level, quantity, reserved = 0 }: { level: StockLevel, quantity: number, reserved?: number }) {
  const available = quantity - reserved;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "size-1.5 rounded-full shrink-0",
          level === 'in_stock' ? "bg-emerald-500 animate-pulse" :
            level === 'low_stock' ? "bg-amber-500" : "bg-rose-500"
        )} />
        <span className="text-[13px] font-bold text-slate-900 dark:text-white">{available} ATP</span>
      </div>
      <p className="text-[10px] font-medium text-slate-400 pl-3">
        {quantity} Physical / {reserved} Reserved
      </p>
    </div>
  )
}

function ItemStatusBadge({ status }: { status: InventoryStatus }) {
  if (status === 'draft') {
    return <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Draft</span>
  }

  return <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">Active</span>
}
