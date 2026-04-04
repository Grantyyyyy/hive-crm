import { useState, useMemo, useEffect } from "react"
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  FileSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { PurchaseOrder, PurchaseOrderStatus, InventoryTransaction } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { AddPurchaseOrderModal } from "@/components/logisticsComponent/AddPurchaseOrderModal"
import { restockFromPO } from "@/services/procurementService"
import type { JobAdapter } from "@/services/types"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import { toast } from "sonner"
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, Task } from "@/lib/types"
import { useUser } from "@clerk/clerk-react"
import { ListSkeleton } from "@/components/ui/skeletons"
export function PurchaseOrders() {
  const { user, isLoaded: userLoaded } = useUser()
  const {
    data: orders,
    addItems: addOrders,
    refresh,
    isLoaded
  } = useCRMResource<PurchaseOrder>('purchase_orders')
  const {
    data: inventoryTransactions
  } = useCRMResource<InventoryTransaction>('inventory_transactions')
  const ctx = useCRMContext()

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0]),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0]),
    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item: Omit<InventoryItem, 'id'>) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0]),
    getPurchaseOrders: () => orders,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0]),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),

    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
  }), [ctx, orders, inventoryTransactions])

  const handleReceive = async (order: PurchaseOrder) => {
    try {
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', order.id, { status: 'received' })
      await restockFromPO({ ...order, status: 'received' }, adapter, user?.id, user?.fullName || 'Unknown User')
      refresh()
      toast.success("Order Received", { description: "Inventory has been restocked automatically." })
    } catch (e: any) {
      toast.error("Failed to receive order", { description: e.message })
    }
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const itemsPerPage = 8

  // Seed dummy data if empty
  useEffect(() => {
    if (isLoaded && orders.length === 0) {
      const dummyOrders: PurchaseOrder[] = [
        {
          id: generateId(),
          poNumber: "PO-99001",
          vendorId: "v1",
          vendorName: "Global Logistics Ltd",
          amount: 4500.00,
          status: 'pending',
          date: "2023-11-01T10:00:00Z",
          items: [],
          createdAt: "2023-11-01T10:00:00Z",
          updatedAt: "2023-11-01T10:00:00Z"
        },
        {
          id: generateId(),
          poNumber: "PO-99002",
          vendorId: "v2",
          vendorName: "Tech Parts Co",
          amount: 1250.50,
          status: 'sent',
          date: "2023-10-30T14:30:00Z",
          items: [],
          createdAt: "2023-10-30T14:30:00Z",
          updatedAt: "2023-10-30T14:30:00Z"
        },
        {
          id: generateId(),
          poNumber: "PO-99003",
          vendorId: "v3",
          vendorName: "Office Supplies Hub",
          amount: 320.00,
          status: 'received',
          date: "2023-10-28T09:15:00Z",
          items: [{
            id: 'po-item-1',
            inventoryItemId: 'inv-1',
            name: 'Paper Packs',
            quantity: 20,
            price: 16.00
          }],
          createdAt: "2023-10-28T09:15:00Z",
          updatedAt: "2023-10-28T09:15:00Z"
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
        order.poNumber.toLowerCase().includes(q) ||
        order.vendorName.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [orders, statusFilter, search])

  // Pagination
  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (!userLoaded || !isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Procurement & Inventory</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Purchase Orders</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage procurement from your global vendors and supply chain.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create PO
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Spent (YTD)</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">$142,500.00</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Active Orders</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === 'pending' || o.status === 'sent').length}</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vendor Compliance</p>
            <h4 className="text-2xl font-black text-emerald-600">98.2%</h4>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search PO number, vendor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {(['all', 'draft', 'pending', 'sent', 'received', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  statusFilter === s
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" className="h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">PO Number</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Vendor</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Date Issued</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileSearch className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium font-bold italic">No purchase orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => (window.location.href = `/purchase-orders/${order.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">{order.poNumber}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="size-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm">
                            {order.vendorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{order.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                          ${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleReceive(order) }}
                              className="text-[11px] h-7 px-3 font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              Receive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/purchase-orders/${order.id}` }}
                            className="text-slate-400 hover:text-indigo-600 font-bold text-[11px] transition-colors h-7 px-2"
                          >
                            View
                          </Button>
                        </div>
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
            itemLabel="purchase orders"
          />
        </div>
      </div>

      <AddPurchaseOrderModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={refresh}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const styles: Record<PurchaseOrderStatus, string> = {
    draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    sent: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    received: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status}
    </span>
  )
}
