import { useState, useMemo } from "react"
import { useRoute, Link } from "wouter"
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Tag,
  Hash,
  Layers,
  Pencil,
  ClipboardList,
  Activity,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { StockAdjustmentModal } from "@/components/ui/stock-adjustment-modal"
import { StatCard } from "@/components/reusables/StatCard"
import { ProcurementDataTable, type ProcurementColumn } from "@/components/reusables/ProcurementDataTable"
import { useCRMResource } from "@/lib/hooks"
import { BackButton } from "@/components/reusables/BackButton"
import { useCRMContext } from "@/lib/CRMContext"
import type { InventoryItem, SalesOrder, Quote, InventoryTransaction } from "@/lib/types"
import { recalculateStockLevel } from "@/services/inventoryService"
import { createAdjustmentTransaction } from "@/services/inventoryTransactionService"
import { toast } from "sonner"
import { useUser } from "@/lib/AuthContext"
import { EditInventorySheet } from "@/components/logisticsComponent/EditInventorySheet"

export function InventoryDetail() {
  const [, params] = useRoute("/inventory/:id")
  const itemId = params?.id ?? ""
  const ctx = useCRMContext()
  const { user, isLoaded: userLoaded } = useUser()

  const { data: items, isLoaded } = useCRMResource<InventoryItem>("inventory")
  const { data: orders } = useCRMResource<SalesOrder>("orders")
  const { data: quotes } = useCRMResource<Quote>("quotes")
  const { data: allTransactions } = useCRMResource<InventoryTransaction>("inventory_transactions")

  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const item = useMemo(() => items.find(i => i.id === itemId), [items, itemId])

  // Statistics & Derived Data
  const stats = useMemo(() => {
    if (!item) return null

    const itemOrders = orders.filter(o => o.items.some(i => i.inventoryItemId === item.id))
    const totalSold = itemOrders.reduce((acc, o) =>
      acc + (o.items.find(i => i.inventoryItemId === item.id)?.quantity || 0), 0)

    const activeQuotes = quotes.filter(q => q.status === 'sent' && q.items.some(i => i.inventoryItemId === item.id))
    const totalEnquiries = activeQuotes.length

    return { totalSold, totalEnquiries, lastSold: itemOrders[0]?.orderDate }
  }, [item, orders, quotes])

  // Audit trail - transactions for this item
  const itemTransactions = useMemo(() => {
    if (!allTransactions || !item) return []
    return allTransactions
      .filter(tx => tx.inventoryItemId === item.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
  }, [allTransactions, item])

  const handleStockAdjustment = async (newQuantity: number, reason: string) => {
    if (!item) return

    const userId = user?.id || 'system'
    const userName = user?.user_metadata?.full_name || 'Unknown User'

    // Build atomic update
    await ctx.runAtomicUpdate([{
      resource: 'inventory',
      id: item.id,
      patch: {
        stockQuantity: newQuantity,
        stockLevel: recalculateStockLevel(
          newQuantity,
          item.reservedQuantity ?? 0,
          item.reorderThreshold
        ),
      },
    }])

    // Create audit trail entry
    const auditAdapter = {
      getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
      insertInventoryTransaction: async (tx: Omit<InventoryTransaction, 'id' | 'createdAt'>) => {
        const { insertRows } = await import('../../lib/CRMContext')
        return insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0])
      },
    }

    await createAdjustmentTransaction({
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      quantityChange: newQuantity - item.stockQuantity,
      quantityBefore: item.stockQuantity,
      quantityAfter: newQuantity,
      reason,
      userId,
      userName,
    }, auditAdapter as any)

    toast.success("Stock Adjusted", { description: `${item.name}: ${item.stockQuantity} → ${newQuantity}` })
  }

  if (!userLoaded || !isLoaded) return <DetailSkeleton />

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Package className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">Product not found.</h2>
        <BackButton href="/inventory" className="mb-2" />
      </div>
    )
  }

  const atp = item.stockQuantity - (item.reservedQuantity || 0)

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center justify-between">
          <BackButton href="/inventory" label="Back to Products" />
          <div className="flex items-center gap-2">
            <Button variant="outlineNeutral" size="sm" className="h-8 px-3.5 text-xs" onClick={() => setAdjustmentOpen(true)}>
              <Activity className="size-3.5 mr-1.5" /> Stock Adjustment
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="h-8 px-5 text-xs bg-teal-600 hover:bg-teal-700"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5 mr-1.5" /> Edit Product
            </Button>
          </div>
        </div>

        {/* Hero Banner Area */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-6 lg:p-8 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-teal-100 dark:border-teal-800/30">
                  {item.category}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border",
                  item.status === 'active'
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
                )}>
                  {item.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                {item.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {item.sku} — {item.description || "High-performance product verified for logistics."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Inventory ID</p>
                <div className="flex items-center gap-2">
                  <Hash className="size-3.5 text-teal-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{item.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Unit Price</p>
                <div className="flex items-center gap-2">
                  <Tag className="size-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link href={`/quotes?search=${encodeURIComponent(item.name)}`}>
                <Button variant="outlineNeutral" size="sm" className="h-8 rounded-lg px-3.5 text-xs border-slate-200">
                  <ClipboardList className="size-3.5 mr-1.5" /> View Quotes
                </Button>
              </Link>
              <Link href={`/orders?search=${encodeURIComponent(item.name)}`}>
                <Button variant="outlineNeutral" size="sm" className="h-8 rounded-lg px-3.5 text-xs border-slate-200">
                  <ShoppingCart className="size-3.5 mr-1.5" /> View Orders
                </Button>
              </Link>
            </div>
          </div>

          {/* Stock Metrics Visualizer */}
          <div className="lg:w-1/2 bg-slate-50/50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 lg:p-8 flex flex-col justify-center">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 size-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between relative">
                <div className="space-y-0.5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Available to Promise</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{atp}</span>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Units</span>
                  </div>
                </div>
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shadow-lg transition-all",
                  atp > 50 ? "bg-emerald-500 shadow-emerald-200 dark:shadow-none" :
                    atp > 0 ? "bg-amber-500 shadow-amber-200 dark:shadow-none" :
                      "bg-rose-500 shadow-rose-200 dark:shadow-none"
                )}>
                  {atp > 0 ? <TrendingUp className="size-5 text-white" /> : <AlertCircle className="size-5 text-white" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 relative">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Stock</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{item.stockQuantity}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reserved Hold</p>
                  <p className="text-lg font-black text-teal-600 dark:text-teal-400">{item.reservedQuantity || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 relative">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reorder Threshold</p>
                  <p className="text-lg font-black text-amber-600">{item.reorderThreshold ?? 'None'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reorder Quantity</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{item.reorderQuantity ?? 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-teal-50/30 dark:bg-teal-900/10 rounded-xl flex items-center gap-2 border border-teal-100/50 dark:border-teal-800/20 relative">
                <Layers className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Reserved units are locked in active <span className="font-bold text-teal-700 dark:text-teal-300">Quotations</span> and pending <span className="font-bold text-teal-700 dark:text-teal-300">Sales Orders</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Sales"
            value={`${stats?.totalSold || 0} Units`}
            icon={<ShoppingCart className="size-5" />}
            accentColor="teal"
          />
          <StatCard
            label="Current Enquiries"
            value={`${stats?.totalEnquiries || 0} Active Quotes`}
            icon={<ClipboardList className="size-5" />}
            accentColor="teal"
          />
          <StatCard
            label="Last Shipped"
            value={stats?.lastSold ? new Date(stats.lastSold).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
            icon={<Clock className="size-5" />}
            accentColor="teal"
          />
        </div>

        {/* Audit / Recent Activity Section */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Clock className="size-4 text-teal-600" />
            Inventory Transaction History
          </h2>
          <ProcurementDataTable
            data={itemTransactions}
            columns={
              [
                {
                  header: "Type",
                  render: (tx) => {
                    const typeConfig = {
                      receipt: { label: 'Receipt', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                      shipment: { label: 'Shipment', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                      adjustment: { label: 'Adjustment', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                      reservation: { label: 'Reservation', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                      release: { label: 'Release', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800/50' },
                      return: { label: 'Return', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    }
                    const config = typeConfig[tx.type as keyof typeof typeConfig] || typeConfig.adjustment
                    return (
                      <span className={cn("px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded", config.bg, config.color)}>
                        {config.label}
                      </span>
                    )
                  },
                },
                {
                  header: "Reason",
                  render: (tx) => (
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                      {tx.reason || tx.type}
                    </span>
                  ),
                },
                {
                  header: "Reference",
                  render: (tx) => (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {tx.referenceNumber || tx.referenceType}
                    </span>
                  ),
                },
                {
                  header: "User",
                  render: (tx) => (
                    <span className="text-[10px] text-slate-400 font-medium">{tx.userName}</span>
                  ),
                },
                {
                  header: "Date",
                  render: (tx) => (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  ),
                  align: "right",
                },
                {
                  header: "Change",
                  render: (tx) => {
                    const isPositive = tx.quantityChange > 0
                    return (
                      <div className="text-right">
                        <p className={cn("text-xs font-black", isPositive ? "text-emerald-600" : "text-rose-600")}>
                          {isPositive ? '+' : ''}{tx.quantityChange}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                          {tx.quantityBefore} → {tx.quantityAfter}
                        </p>
                      </div>
                    )
                  },
                  align: "right",
                },
              ] as ProcurementColumn<InventoryTransaction>[]
            }
            emptyState={{
              icon: <Clock className="w-12 h-12 text-slate-200" />,
              message: "No transaction history recorded for this item.",
            }}
          />
        </div>

      </div>
      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        item={item}
        onConfirm={handleStockAdjustment}
      />

      {/* Edit Product Sheet */}
      <EditInventorySheet
        open={editOpen}
        onOpenChange={setEditOpen}
        item={item}
      />
    </div>
  )
}
