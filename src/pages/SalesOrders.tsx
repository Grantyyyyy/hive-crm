import { useState, useMemo, useEffect } from "react"
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { AddSalesOrderModal } from "@/components/crm/AddSalesOrderModal"

export function SalesOrders() {
  const { 
    data: orders, 
    addItems: addOrders, 
    refresh,
    isLoaded 
  } = useCRMResource<SalesOrder>('orders')

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const itemsPerPage = 8

  // Seed dummy data if empty
  useEffect(() => {
    if (isLoaded && orders.length === 0) {
      const dummyOrders: SalesOrder[] = [
        {
          id: generateId(),
          orderNumber: "SO-8921",
          customerId: "c1",
          customerName: "Acme Corp",
          totalValue: 1240.00,
          status: 'pending',
          orderDate: "2023-10-24T10:00:00Z",
          items: [],
          createdAt: "2023-10-24T10:00:00Z",
          updatedAt: "2023-10-24T10:00:00Z"
        },
        {
          id: generateId(),
          orderNumber: "SO-8920",
          customerId: "c2",
          customerName: "Global Tech",
          totalValue: 850.50,
          status: 'shipped',
          orderDate: "2023-10-23T14:30:00Z",
          items: [],
          createdAt: "2023-10-23T14:30:00Z",
          updatedAt: "2023-10-23T14:30:00Z"
        },
        {
          id: generateId(),
          orderNumber: "SO-8919",
          customerId: "c3",
          customerName: "Nexus Ltd",
          totalValue: 3100.00,
          status: 'delivered',
          orderDate: "2023-10-22T09:15:00Z",
          items: [],
          createdAt: "2023-10-22T09:15:00Z",
          updatedAt: "2023-10-22T09:15:00Z"
        },
        {
          id: generateId(),
          orderNumber: "SO-8918",
          customerId: "c4",
          customerName: "Stellar Inc",
          totalValue: 520.00,
          status: 'pending',
          orderDate: "2023-10-22T16:45:00Z",
          items: [],
          createdAt: "2023-10-22T16:45:00Z",
          updatedAt: "2023-10-22T16:45:00Z"
        },
        {
          id: generateId(),
          orderNumber: "SO-8917",
          customerId: "c5",
          customerName: "Orbit Solutions",
          totalValue: 2740.00,
          status: 'shipped',
          orderDate: "2023-10-21T11:20:00Z",
          items: [],
          createdAt: "2023-10-21T11:20:00Z",
          updatedAt: "2023-10-21T11:20:00Z"
        }
      ]
      addOrders(dummyOrders)
    }
  }, [isLoaded, orders.length, addOrders])

  // Filter logic
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const q = search.toLowerCase()
      const matchesSearch = !q || 
        order.orderNumber.toLowerCase().includes(q) || 
        order.customerName.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
    return result.sort((a, b) => b.orderDate.localeCompare(a.orderDate))
  }, [orders, statusFilter, search])

  // Pagination
  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
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
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Commerce & Fulfillment</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Orders</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track all customer orders and fulfillment status in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Order
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by order number, customer name, or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {(['all', 'pending', 'shipped', 'delivered'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  statusFilter === s 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 mr-2" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Order ID</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Total Value</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Fulfillment</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Order Date</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ShoppingCart className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">No sales orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr 
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">#{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase">
                            {order.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          ${order.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
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
                Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} orders
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
      
      <AddSalesOrderModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={refresh}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: SalesOrderStatus }) {
  const styles: Record<SalesOrderStatus, string> = {
    pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    shipped: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    delivered: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status}
    </span>
  )
}
