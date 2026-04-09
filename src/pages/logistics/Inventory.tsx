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

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Products</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage stock, products, and variants.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button variant="brand" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Product
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'draft', label: 'Drafts' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterState(tab.id as typeof filterState)}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  filterState === tab.id
                    ? "bg-teal-600 text-white shadow-md shadow-teal-100 dark:shadow-none"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" className="h-10 px-4">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Product</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">SKU</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Category</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Price</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Stock Level</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">No inventory items found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/inventory/${item.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
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
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{item.sku}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{item.category}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StockBadge level={item.stockLevel} quantity={item.stockQuantity} reserved={item.reservedQuantity} />
                      </td>
                      <td className="px-4 py-2.5">
                        <ItemStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-600 transition-colors h-6 px-2 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
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
            itemLabel="items"
          />
        </div>
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
