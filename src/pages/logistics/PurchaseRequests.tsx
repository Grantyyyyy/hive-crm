import { useState, useMemo, useEffect } from "react"
import { 
  Plus, 
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
import type { PurchaseRequest, PurchaseRequestStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { AddPurchaseRequestModal } from "@/components/crm/AddPurchaseRequestModal"

export function PurchaseRequests() {
  const { 
    data: requests, 
    addItems: addRequests, 
    refresh,
    isLoaded 
  } = useCRMResource<PurchaseRequest>('purchase_requests')

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const itemsPerPage = 8

  // Seed dummy data if empty
  useEffect(() => {
    if (isLoaded && requests.length === 0) {
      const dummyRequests: PurchaseRequest[] = [
        {
          id: generateId(),
          requestNumber: "PR-2023-001",
          requesterId: "u1",
          requesterName: "Sarah Chen",
          amount: 1500.00,
          status: 'pending_review',
          date: "2023-10-25T10:00:00Z",
          department: "Marketing",
          items: [],
          priority: 'high',
          createdAt: "2023-10-25T10:00:00Z",
          updatedAt: "2023-10-25T10:00:00Z"
        },
        {
          id: generateId(),
          requestNumber: "PR-2023-002",
          requesterId: "u2",
          requesterName: "Michael Ross",
          amount: 850.50,
          status: 'approved',
          date: "2023-10-22T14:30:00Z",
          department: "IT",
          items: [],
          priority: 'medium',
          createdAt: "2023-10-22T14:30:00Z",
          updatedAt: "2023-10-22T14:30:00Z"
        },
        {
          id: generateId(),
          requestNumber: "PR-2023-003",
          requesterId: "u3",
          requesterName: "Jessica Pearson",
          amount: 12000.00,
          status: 'pending_review',
          date: "2023-10-20T09:15:00Z",
          department: "Ops",
          items: [],
          priority: 'urgent',
          createdAt: "2023-10-20T09:15:00Z",
          updatedAt: "2023-10-20T09:15:00Z"
        }
      ]
      addRequests(dummyRequests)
    }
  }, [isLoaded, requests.length, addRequests])

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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Corporate Finance</p>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Purchase Requests</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-sm">Internal procurement workflow and budget approvals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-widest h-11 px-6">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button 
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest h-11 px-8 shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              <Plus className="w-4 h-4 mr-2" /> New Request
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
                <h4 className="text-3xl font-black text-indigo-600">28</h4>
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
                    className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 outline-none transition-all"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center shadow-sm overflow-x-auto max-w-full">
                {([['all', 'All'], ['pending_review', 'Review'], ['approved', 'Approved'], ['rejected', 'Rejected']] as const).map(([s, label]) => (
                <button
                    key={s}
                    onClick={() => setStatusFilter(s as any)}
                    className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    statusFilter === s 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                        : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                >
                    {label}
                </button>
                ))}
            </div>
            
            <Button variant="ghost" className="rounded-xl font-bold text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                <Filter className="w-4 h-4 mr-2" /> More Filters
            </Button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Request ID</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Requester</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Department</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Estimated Amount</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-center">Priority</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-center">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">{request.requestNumber}</span>
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
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 inline-flex text-slate-400 hover:text-slate-600 text-[11px] h-6 px-2 items-center gap-1 transition-all">
                          Review <ArrowRight className="w-3 h-3" />
                        </Button>
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
    approved: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400",
    rejected: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
    ordered: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
  }

  const labels: Record<PurchaseRequestStatus, string> = {
    pending_review: "Review",
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
