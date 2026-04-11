import { useState, useMemo, useCallback } from "react"
import { useLocation } from "wouter"
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  FileSearch,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Trash2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { PurchaseOrder, PurchaseOrderStatus, InventoryTransaction } from "@/lib/types"

import { AddPurchaseOrderModal } from "@/components/logisticsComponent/AddPurchaseOrderModal"
import type { JobAdapter } from "@/services/types"
import { useCRMContext, updateRow, insertRows, deleteRow } from "@/lib/CRMContext"
import { toast } from "sonner"
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, Task } from "@/lib/types"
import { useUser } from "@/lib/AuthContext"
import { ListSkeleton } from "@/components/ui/skeletons"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { StatCard } from "@/components/reusables/StatCard"
import { StatusTabs } from "@/components/reusables/StatusTabs"
import type { StatusTab } from "@/components/reusables/StatusTabs"
export function PurchaseOrders() {
  const [, navigate] = useLocation()
  const { user, isLoaded: userLoaded } = useUser()
  const {
    data: orders,
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
    getPurchaseReceipts: () => ctx.getResource<any>('purchase_receipts').data,
    getPurchaseReceiptItems: () => ctx.getResource<any>('purchase_receipt_items').data,
    insertPurchaseReceipt: (receipt) => insertRows<any>(ctx, 'purchase_receipts', [receipt as any]).then(rows => rows[0]),
    insertPurchaseReceiptItem: (item) => insertRows<any>(ctx, 'purchase_receipt_items', [item as any]).then(rows => rows[0]),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),

    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
  }), [ctx, orders, inventoryTransactions])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 8

  // Selection handlers
  const handleToggle = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleToggleAll = useCallback((allIds: (string | number)[]) => {
    setSelectedIds(prev => {
      const allSelected = allIds.every(id => prev.has(id))
      if (allSelected) {
        // Deselect all on this page
        const next = new Set(prev)
        allIds.forEach(id => next.delete(id))
        return next
      } else {
        // Select all on this page
        const next = new Set(prev)
        allIds.forEach(id => next.add(id))
        return next
      }
    })
  }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => deleteRow<PurchaseOrder>(ctx, 'purchase_orders', String(id))))
      toast.success(`Deleted ${ids.length} purchase order${ids.length > 1 ? 's' : ''}`, {
        description: "Selected orders have been permanently removed."
      })
      setSelectedIds(new Set())
    } catch (e: any) {
      toast.error("Failed to delete orders", { description: e.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const statusTabs: StatusTab<PurchaseOrderStatus>[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'partially_received', label: 'Partially Received' },
    { value: 'fully_received', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

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

  // Column definitions
  const columns: ProcurementColumn<PurchaseOrder>[] = [
    {
      header: "PO Number",
      render: (order) => (
        <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">{order.poNumber}</span>
      ),
    },
    {
      header: "Vendor",
      render: (order) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm">
            {order.vendorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{order.vendorName}</span>
        </div>
      ),
    },
    {
      header: "Amount",
      render: (order) => (
        <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200">
          ${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
      align: 'right',
    },
    {
      header: "Status",
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: "Date Issued",
      render: (order) => (
        <span className="text-[13px] text-slate-600 dark:text-slate-400">
          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (order) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${order.id}`) }}
            className="inline-flex text-slate-400 hover:text-slate-600 text-[11px] h-7 px-2 items-center gap-1 transition-all"
          >
            View <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      ),
      align: 'right',
    },
  ]

  if (!userLoaded || !isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">Procurement & Inventory</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Purchase Orders</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage procurement from your global vendors and supply chain.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="brand"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create PO
            </Button>
          </div>
        </div>

        <ProcurementDataTable<PurchaseOrder>
          data={paginatedOrders}
          columns={columns}
          isLoading={!isLoaded}
          onRowClick={(order) => navigate(`/purchase-orders/${order.id}`)}
          selection={{
            selectedIds,
            onToggle: handleToggle,
            onToggleAll: handleToggleAll,
          }}
          bulkActionBar={
            <div className="flex items-center justify-between gap-4 px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 rounded-xl shadow-lg shadow-teal-600/20 text-white">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center text-sm font-black">
                  {selectedIds.size}
                </div>
                <span className="text-sm font-semibold">
                  order{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold h-8 px-3"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="text-white hover:bg-rose-500/20 hover:text-rose-100 text-xs font-bold h-8 px-3 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </div>
            </div>
          }
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "purchase orders",
          }}
          emptyState={{
            icon: <FileSearch className="w-10 h-10 text-slate-300" />,
            message: "No purchase orders found.",
          }}
          statsCards={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Spent (YTD)"
                value="$142,500.00"
                icon={<DollarSign className="w-5 h-5" />}
                accentColor="teal"
                badge="+8.2%"
                badgeColor="emerald"
              />
              <StatCard
                label="Active Orders"
                value={orders.filter(o => o.status === 'pending' || o.status === 'sent').length.toString()}
                icon={<ShoppingCart className="w-5 h-5" />}
                accentColor="blue"
              />
              <StatCard
                label="Vendor Compliance"
                value="98.2%"
                icon={<TrendingUp className="w-5 h-5" />}
                accentColor="emerald"
                badge="On Track"
                badgeColor="emerald"
              />
            </div>
          }
          searchInput={
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search PO number, vendor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          }
          filterTabs={
            <>
              <StatusTabs<PurchaseOrderStatus>
                tabs={statusTabs}
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Orders"
              />

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                <Filter className="w-4 h-4" /> More Filters
              </Button>
            </>
          }
        />
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
    partially_received: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400",
    fully_received: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status.replace('_', ' ')}
    </span>
  )
}
