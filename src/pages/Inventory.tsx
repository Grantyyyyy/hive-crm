import { useState, useMemo, useEffect } from "react"
import { 
  Package, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Download,
  PlusCircle,
  MoreVertical,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { InventoryItem, StockLevel, InventoryStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"

export function Inventory() {
  const { 
    data: items, 
    addItems, 
    isLoaded 
  } = useCRMResource<InventoryItem>('inventory')

  const [search, setSearch] = useState("")
  const [filterState, setFilterState] = useState<'all' | 'low_stock' | 'out_of_stock' | 'draft'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Seed dummy data if empty
  useEffect(() => {
    if (isLoaded && items.length === 0) {
      const dummyItems: InventoryItem[] = [
        {
          id: generateId(),
          name: "Premium Ergonomic Chair",
          sku: "CH-PREM-001",
          category: "Furniture",
          price: 499.00,
          stockQuantity: 124,
          stockLevel: 'in_stock',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Bluetooth Wireless Headphones",
          sku: "AU-WL-992",
          category: "Electronics",
          price: 129.99,
          stockQuantity: 12,
          stockLevel: 'low_stock',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Adjustable Standing Desk",
          sku: "DSK-ADJ-S",
          category: "Furniture",
          price: 349.50,
          stockQuantity: 0,
          stockLevel: 'out_of_stock',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Mechanical Keyboard Set",
          sku: "KB-MECH-G",
          category: "Accessories",
          price: 189.99,
          stockQuantity: 45,
          stockLevel: 'in_stock',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      addItems(dummyItems)
    }
  }, [isLoaded, items.length, addItems])

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
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">
        
        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Products</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage stock, products, and variants.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Product
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
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
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
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Product</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">SKU</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Category</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Price</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Stock Level</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Status</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StockBadge level={item.stockLevel} quantity={item.stockQuantity} />
                      </td>
                      <td className="px-6 py-4">
                        <ItemStatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-5 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} items
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8 rounded-lg border-slate-200 dark:border-slate-800"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "size-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all",
                        currentPage === i + 1 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8 rounded-lg border-slate-200 dark:border-slate-800"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StockBadge({ level, quantity }: { level: StockLevel, quantity: number }) {
  if (level === 'in_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800/30">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        {quantity} In Stock
      </span>
    )
  }
  
  if (level === 'low_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-800/30">
        <span className="size-1.5 rounded-full bg-amber-500"></span>
        Only {quantity} Left
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-800/30">
      <span className="size-1.5 rounded-full bg-rose-500"></span>
      Out of Stock
    </span>
  )
}

function ItemStatusBadge({ status }: { status: InventoryStatus }) {
  if (status === 'draft') {
    return <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Draft</span>
  }
  
  return <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">Active</span>
}
