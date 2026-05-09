import { useState, useMemo } from "react"
import { useLocation } from "wouter"
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle2,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCRMResource } from "@/lib/hooks"
import { usePlan } from "@/lib/usePlan"
import { UpgradeBanner } from "@/components/reusables/UpgradeBanner"
import { cn } from "@/lib/utils"
import type { PurchaseRequest, PurchaseRequestStatus, InventoryTransaction } from "@/lib/types"
import { AddPurchaseRequestModal } from "@/components/logisticsComponent/AddPurchaseRequestModal"
import { PurchaseRequestReviewModal } from "@/components/logisticsComponent/PurchaseRequestReviewModal"
import { approvePurchaseRequest } from "@/services/procurementService"
import { testProcurementTrigger } from "@/services/testProcurementTrigger"
import type { JobAdapter, AtomicOp } from "@/services/types"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import { toast } from "sonner"
import type { Quote, SalesOrder, InventoryItem, PurchaseOrder, Task } from "@/lib/types"
import { ListSkeleton } from "@/components/ui/skeletons"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { StatCard } from "@/components/reusables/StatCard"
import { InitialsAvatar } from "@/components/reusables/InitialsAvatar"
import { StatusTabs, type StatusTab } from "@/components/reusables/StatusTabs"
import { PageHeader } from "@/components/reusables/PageHeader"
export function PurchaseRequests() {
  const [, navigate] = useLocation()
  const {
    data: requests,
    refresh,
    isLoaded
  } = useCRMResource<PurchaseRequest>('purchase_requests')
  const {
    data: inventoryTransactions
  } = useCRMResource<InventoryTransaction>('inventory_transactions')
  const ctx = useCRMContext()

  const { canAccess } = usePlan()

  if (!canAccess('procurement')) {
    return <UpgradeBanner feature="Procurement" description="Manage purchase orders, vendors, and procurement workflows." />
  }

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0]),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    updateSalesOrderItem: async (orderId, itemId, patch) => {
      const order = ctx.getResource<SalesOrder>('orders').data.find(o => o.id === orderId);
      if (!order) return;
      const updatedItems = order.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<SalesOrder>(ctx, 'orders', orderId, { items: updatedItems });
    },
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0]),
    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item: Omit<InventoryItem, 'id'>) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),
    getPurchaseRequests: () => requests,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0]),
    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    updatePurchaseOrderItem: async (poId, itemId, patch) => {
      const po = ctx.getResource<PurchaseOrder>('purchase_orders').data.find(p => p.id === poId);
      if (!po) return;
      const updatedItems = po.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', poId, { items: updatedItems as any });
    },
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0]),
    getPurchaseReceipts: () => ctx.getResource<any>('purchase_receipts').data,
    getPurchaseReceiptItems: () => ctx.getResource<any>('purchase_receipt_items').data,
    insertPurchaseReceipt: (receipt) => insertRows<any>(ctx, 'purchase_receipts', [receipt as any]).then(rows => rows[0]),
    insertPurchaseReceiptItem: (item) => insertRows<any>(ctx, 'purchase_receipt_items', [item as any]).then(rows => rows[0]),
    getInventoryTransactions: () => inventoryTransactions,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0]),

    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
    getReturnToSuppliers: () => ctx.getResource<any>('return_to_suppliers').data,
    insertReturnToSupplier: (rts) => insertRows<any>(ctx, 'return_to_suppliers', [rts as any]).then(rows => rows[0]),
    updateReturnToSupplier: (id, patch) => updateRow<any>(ctx, 'return_to_suppliers', id, patch),
    runAtomicUpdate: async (ops: AtomicOp[]) => {
      const results: AtomicOp[] = [];
      for (const op of ops) {
        if (op.action === 'insert') {
          const row = await insertRows<any>(ctx, op.resource as any, [op.patch]);
          results.push({ ...op, id: row[0].id });
        } else {
          await updateRow(ctx, op.resource as any, op.id!, op.patch);
          results.push(op);
        }
      }
      return results;
    },
  }), [ctx, requests, inventoryTransactions])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const itemsPerPage = 8

  const { data: inventoryItems } = useCRMResource<InventoryItem>('inventory')

  const statusTabs: StatusTab<PurchaseRequestStatus>[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'ordered', label: 'Ordered' },
  ]

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

  // Column definitions
  const columns: ProcurementColumn<PurchaseRequest>[] = [
    {
      header: "Request ID",
      render: (request) => (
        <>
          <span className="text-[13px] font-bold text-accent">{request.requestNumber}</span>
          <p className="text-[10px] text-slate-500 mt-0.5">{new Date(request.date).toLocaleDateString()}</p>
        </>
      ),
    },
    {
      header: "Requester",
      render: (request) => (
        <div className="flex items-center gap-2">
          <InitialsAvatar
            name={request.requesterName}
            className="size-6 rounded-full ring-1 ring-white dark:ring-slate-900 shadow-sm"
            textClassName="text-[10px] font-black uppercase"
          />
          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{request.requesterName}</span>
        </div>
      ),
    },
    {
      header: "Department",
      render: (request) => (
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
          {request.department}
        </span>
      ),
    },
    {
      header: "Estimated Amount",
      render: (request) => (
        <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200">
          ${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
      align: 'right',
    },
    {
      header: "Priority",
      render: (request) => <PriorityBadge priority={request.priority} />,
      align: 'center',
    },
    {
      header: "Status",
      render: (request) => <StatusBadge status={request.status} />,
      align: 'center',
    },
    {
      header: "Actions",
      render: (request) => (
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
            onClick={(e) => { e.stopPropagation(); navigate(`/purchase-requests/${request.id}`) }}
            className="inline-flex text-slate-400 hover:text-slate-600 text-[11px] h-7 px-2 items-center gap-1 transition-all"
          >
            View <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      ),
      align: 'right',
    },
  ]

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader 
          category="Corporate Finance"
          title="Purchase Requests"
          description="Internal procurement workflow and budget approvals."
          className="px-0 bg-transparent border-none pb-2"
          actions={
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="outlineNeutral">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                variant="brand"
                onClick={() => setIsAddModalOpen(true)}

              >
                <PlusCircle className="w-4 h-4 mr-2" /> Create Request
              </Button>
            </div>
          }
        />
        <ProcurementDataTable<PurchaseRequest>
          data={paginatedRequests}
          columns={columns}
          isLoading={!isLoaded}
          onRowClick={(request) => navigate(`/purchase-requests/${request.id}`)}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems,
            itemsPerPage,
            itemLabel: "requests",
          }}
          emptyState={{
            icon: <Layers className="w-12 h-12 text-slate-200" />,
            message: "No requests matching your criteria.",
          }}
          statsCards={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Requested Value"
                value="$425,800.00"
                icon={<DollarSign className="w-5 h-5" />}
                accentColor="teal"
              />
              <StatCard
                label="Pending Review"
                value={requests.filter(r => r.status === 'pending_review').length.toString()}
                icon={<Clock className="w-5 h-5" />}
                accentColor="amber"
                badge="Action Needed"
                badgeColor="amber"
              />
              <StatCard
                label="Approved This Month"
                value="28"
                icon={<CheckCircle2 className="w-5 h-5" />}
                accentColor="emerald"
                badge="+12.5%"
                badgeColor="emerald"
              />
            </div>
          }
          searchInput={
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by ID, requester, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          }
          filterTabs={
            <>
              <StatusTabs<PurchaseRequestStatus>
                tabs={statusTabs}
                value={statusFilter}
                onChange={setStatusFilter}
                allLabel="All Requests"
              />

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                <Filter className="w-4 h-4" /> More Filters
              </Button>
            </>
          }
        />
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
    approved: "bg-accent-dim text-accent",
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
