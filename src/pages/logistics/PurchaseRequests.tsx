import { useState, useMemo } from "react"
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  Layers,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { useCRMResource } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import type { PurchaseRequest, PurchaseRequestStatus, InventoryTransaction } from "@/lib/types"
import { AddPurchaseRequestModal } from "@/components/logisticsComponent/AddPurchaseRequestModal"
import { PurchaseRequestReviewModal } from "@/components/logisticsComponent/PurchaseRequestReviewModal"
import { approvePurchaseRequest } from "@/services/procurementService"
import type { JobAdapter } from "@/services/types"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import { toast } from "sonner"
import type { Quote, SalesOrder, InventoryItem, PurchaseOrder, Task } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
export function PurchaseRequests() {
  const {
    data: requests,
    refresh,
    isLoaded
  } = useCRMResource<PurchaseRequest>('purchase_requests')
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
    getPurchaseRequests: () => requests,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0]),
    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0]),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),

    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
  }), [ctx, requests, inventoryTransactions])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const itemsPerPage = 8

  const { data: inventoryItems } = useCRMResource<InventoryItem>('inventory')

  const handleApprove = async (prId: string) => {
    try {
      await approvePurchaseRequest(prId, adapter)
      refresh()
      toast.success("Request Approved", { description: "Purchase Order has been created." })
    } catch (e: any) {
      toast.error("Failed to approve request", { description: e.message })
    }
  }

  const handleReview = (request: PurchaseRequest) => {
    setSelectedRequest(request)
    setIsReviewModalOpen(true)
  }

  const handleReviewApprove = async (request: PurchaseRequest) => {
    try {
      await handleApprove(request.id)
    } catch (e: any) {
      toast.error("Failed to approve request", { description: e.message })
    }
  }

  const handleReviewReject = async (request: PurchaseRequest) => {
    try {
      await updateRow<PurchaseRequest>(ctx, 'purchase_requests', request.id, { status: 'rejected' })
      refresh()
      toast.success("Request Rejected", { description: `${request.requestNumber} has been rejected.` })
    } catch (e: any) {
      toast.error("Failed to reject request", { description: e.message })
    }
  }

  // Filter logic
  const filteredRequests = useMemo(() => {
    let result = requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        request.requestNumber.toLowerCase().includes(q) ||
        request.requesterName.toLowerCase().includes(q) ||
        request.department.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [requests, statusFilter, search])

  // Pagination
  const totalItems = filteredRequests.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedRequests = filteredRequests.slice(
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Corporate Finance</p>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Purchase Requests</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-sm">Internal procurement workflow and budget approvals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              variant="brand"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Request
            </Button>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Requested Value</p>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white">$425,800.00</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Review</p>
            <h4 className="text-3xl font-black text-amber-500">{requests.filter(r => r.status === 'pending_review').length}</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Approved This Month</p>
            <h4 className="text-3xl font-black text-teal-600">28</h4>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              placeholder="Search by ID, requester, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center shadow-sm overflow-x-auto max-w-full">
            {([['all', 'All'], ['draft', 'Draft'], ['pending_review', 'Review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['ordered', 'Ordered']] as const).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === s
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-100 dark:shadow-none"
                    : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Button variant="ghost" className="rounded-xl font-bold text-xs uppercase tracking-widest text-teal-600 dark:text-teal-400">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Request ID</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Requester</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Estimated Amount</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Priority</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Layers className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-400 font-bold italic">No requests matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((request) => (
                    <tr
                      key={request.id}
                      onClick={() => (window.location.href = `/purchase-requests/${request.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">{request.requestNumber}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(request.date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase ring-1 ring-white dark:ring-slate-900 shadow-sm">
                            {request.requesterName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{request.requesterName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {request.department}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[13px] text-slate-800 dark:text-slate-200">
                        ${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <PriorityBadge priority={request.priority} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {request.status === 'pending_review' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleReview(request) }}
                              className="text-[11px] h-7 px-3 font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              Quick Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/purchase-requests/${request.id}` }}
                            className="inline-flex text-slate-400 hover:text-slate-600 text-[11px] h-7 px-2 items-center gap-1 transition-all"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="requests"
          />
        </div>
      </div>

      <AddPurchaseRequestModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={refresh}
      />

      <PurchaseRequestReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        request={selectedRequest}
        onApprove={handleReviewApprove}
        onReject={handleReviewReject}
        inventoryItems={inventoryItems}
      />
    </div>
  )
}

function PriorityBadge({ priority }: { priority: PurchaseRequest['priority'] }) {
  const styles: Record<PurchaseRequest['priority'], string> = {
    low: "text-slate-400",
    medium: "text-amber-500",
    high: "text-orange-600",
    urgent: "text-rose-600 animate-pulse"
  }
  return (
    <span className={cn("text-[9px] font-black uppercase tracking-widest", styles[priority])}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: PurchaseRequestStatus }) {
  const styles: Record<PurchaseRequestStatus, string> = {
    pending_review: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    approved: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400",
    rejected: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
    ordered: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
  }

  const labels: Record<PurchaseRequestStatus, string> = {
    pending_review: "Review",
    draft: "Draft",
    approved: "Approved",
    rejected: "Rejected",
    ordered: "Ordered",
  }

  return (
    <span className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm", styles[status])}>
      {labels[status]}
    </span>
  )
}
