import { useState, useMemo, useRef, useEffect } from "react"
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Truck,
  PackageCheck,
  FileText,
  XCircle,
  Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext, updateRow } from "@/lib/CRMContext"
import { useLocation } from "wouter"
import { cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus } from "@/lib/types"
import { AddSalesOrderModal } from "@/components/crm/AddSalesOrderModal"
import { InvoiceModal } from "@/components/crm/InvoiceModal"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { toast } from "sonner"
import { sendShippingNotification, generateInvoice } from "@/lib/quoteOrderAutomation"

// ── Actions dropdown ──────────────────────────────────────────────────────────

interface ActionsMenuProps {
  order: SalesOrder
  onShip: () => void
  onDeliver: () => void
  onCancel: () => void
  onViewInvoice: () => void
  onViewDetails: () => void
}

function ActionsMenu({ order, onShip, onDeliver, onCancel, onViewInvoice, onViewDetails }: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + 6, left: rect.right - 208 })
    setOpen(v => !v)
  }

  const items = [
    order.status === 'pending' && {
      label: "Mark as Shipped",
      icon: Truck,
      color: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20",
      action: onShip,
    },
    order.status === 'shipped' && {
      label: "Mark as Delivered",
      icon: PackageCheck,
      color: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
      action: onDeliver,
    },
    {
      label: "View Invoice",
      icon: Receipt,
      color: "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
      action: onViewInvoice,
    },
    {
      label: "View Details",
      icon: FileText,
      color: "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800",
      action: onViewDetails,
    },
    order.status !== 'delivered' && order.status !== 'cancelled' && {
      label: "Cancel Order",
      icon: XCircle,
      color: "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20",
      action: onCancel,
    },
  ].filter(Boolean) as { label: string; icon: React.ElementType; color: string; action: () => void }[]

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 py-2 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {items.map(({ label, icon: Icon, color, action }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); action() }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-colors",
                color
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function SalesOrders() {
  const ctx = useCRMContext()
  const {
    data: orders,
    refresh,
    isLoaded
  } = useCRMResource<SalesOrder>('orders')

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [invoiceOrder, setInvoiceOrder] = useState<SalesOrder | null>(null)
  const [, navigate] = useLocation()
  const itemsPerPage = 8

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

  const handleCreateSuccess = (order: SalesOrder) => {
    refresh()
    toast.success("Order Created Successfully", {
      description: `Order #${order.orderNumber} for ${order.customerName} has been recorded.`
    })
  }

  const handleShipOrder = async (order: SalesOrder) => {
    try {
      sendShippingNotification(order)
      await updateRow<SalesOrder>(ctx, 'orders', order.id, { status: 'shipped' })
      refresh()
      toast.success("Order Marked as Shipped", { description: `#${order.orderNumber} — shipping notification sent to ${order.customerName}.` })
    } catch {
      toast.error("Failed to update order status.")
    }
  }

  const handleDeliverOrder = async (order: SalesOrder) => {
    try {
      generateInvoice(order)
      await updateRow<SalesOrder>(ctx, 'orders', order.id, { status: 'delivered' })
      refresh()
      toast.success("Order Delivered", { description: `#${order.orderNumber} — invoice generated and sent to ${order.customerName}.` })
      setInvoiceOrder({ ...order, status: 'delivered' })
    } catch {
      toast.error("Failed to update order status.")
    }
  }

  const handleCancelOrder = async (order: SalesOrder) => {
    try {
      await updateRow<SalesOrder>(ctx, 'orders', order.id, { status: 'cancelled' })
      refresh()
      toast.success("Order Cancelled", { description: `#${order.orderNumber} has been cancelled.` })
    } catch {
      toast.error("Failed to cancel order.")
    }
  }

  if (!isLoaded) {
    return <PageSkeleton />
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
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="default"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Order
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by order number, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map((s) => (
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

          <Button variant="outlineNeutral" className="h-10 px-4">
            <Filter className="w-4 h-4 mr-2" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Order ID</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Customer</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Total Value</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Fulfillment</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Order Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">#{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase shadow-sm">
                            {order.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD', minimumFractionDigits: 2 }).format(order.totalValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">
                          {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* Quick action inline buttons for common next-step */}
                          {order.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleShipOrder(order) }}
                              className="text-[11px] h-7 px-3 font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" /> Ship
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDeliverOrder(order) }}
                              className="text-[11px] h-7 px-3 font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <PackageCheck className="w-3.5 h-3.5 mr-1" /> Deliver
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setInvoiceOrder(order) }}
                              className="text-[11px] h-7 px-3 font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Receipt className="w-3.5 h-3.5 mr-1" /> Invoice
                            </Button>
                          )}
                          <ActionsMenu
                            order={order}
                            onShip={() => handleShipOrder(order)}
                            onDeliver={() => handleDeliverOrder(order)}
                            onCancel={() => handleCancelOrder(order)}
                            onViewInvoice={() => setInvoiceOrder(order)}
                            onViewDetails={() => navigate(`/orders/${order.id}`)}
                          />
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
            itemLabel="orders"
          />
        </div>
      </div>

      <AddSalesOrderModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: SalesOrderStatus }) {
  const styles: Record<SalesOrderStatus, string> = {
    pending:   "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    shipped:   "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    delivered: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  }

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent", styles[status])}>
      {status}
    </span>
  )
}
