import { useState, useMemo } from "react"
import { useRoute, Link } from "wouter"
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Tag,
  Hash,
  Layers,
  Pencil,
  ClipboardList,
  History,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { StockAdjustmentModal } from "@/components/ui/stock-adjustment-modal"
import { useCRMResource } from "@/lib/hooks"
import { useCRMContext } from "@/lib/CRMContext"
import type { InventoryItem, SalesOrder, Quote, InventoryTransaction } from "@/lib/types"
import { recalculateStockLevel } from "@/services/inventoryService"
import { createAdjustmentTransaction } from "@/services/inventoryTransactionService"
import { toast } from "sonner"
import { useUser } from "@/lib/AuthContext"

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
        <Link href="/inventory">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Inventory
          </Button>
        </Link>
      </div>
    )
  }

  const atp = item.stockQuantity - (item.reservedQuantity || 0)

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/inventory">
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group">
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Products</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral" size="sm" className="h-9 px-4" onClick={() => setAdjustmentOpen(true)}>
              <Activity className="size-4 mr-2" /> Stock Adjustment
            </Button>
            <Button variant="default" size="sm" className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700">
              <Pencil className="size-4 mr-2" /> Edit Product
            </Button>
          </div>
        </div>

        {/* Hero Banner Area */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-8 lg:p-12 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-800/30">
                  {item.category}
                </span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                  item.status === 'active'
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
                )}>
                  {item.status}
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:max-w-md uppercase">
                {item.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-medium">
                {item.sku} — {item.description || "High-performance product verified for logistics."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Inventory ID</p>
                <div className="flex items-center gap-2">
                  <Hash className="size-3.5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{item.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Unit Price</p>
                <div className="flex items-center gap-2">
                  <Tag className="size-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link href={`/quotes?search=${encodeURIComponent(item.name)}`}>
                <Button variant="outlineNeutral" size="sm" className="h-10 rounded-xl px-5 border-slate-200">
                  <ClipboardList className="size-4 mr-2" /> View Quotes
                </Button>
              </Link>
              <Link href={`/orders?search=${encodeURIComponent(item.name)}`}>
                <Button variant="outlineNeutral" size="sm" className="h-10 rounded-xl px-5 border-slate-200">
                  <ShoppingCart className="size-4 mr-2" /> View Orders
                </Button>
              </Link>
            </div>
          </div>

          {/* Stock Metrics Visualizer */}
          <div className="lg:w-1/2 bg-slate-50/50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-8 lg:p-12 flex flex-col justify-center">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
              {/* Accent circle */}
              <div className="absolute -top-12 -right-12 size-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between relative">
                <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Available to Promise</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{atp}</span>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Units</span>
                  </div>
                </div>
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                  atp > 50 ? "bg-emerald-500 shadow-emerald-200 dark:shadow-none" :
                    atp > 0 ? "bg-amber-500 shadow-amber-200 dark:shadow-none" :
                      "bg-rose-500 shadow-rose-200 dark:shadow-none"
                )}>
                  {atp > 0 ? <TrendingUp className="size-6 text-white" /> : <AlertCircle className="size-6 text-white" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 relative">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Stock</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{item.stockQuantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reserved Hold</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{item.reservedQuantity || 0}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl flex items-center gap-3 border border-indigo-100/50 dark:border-indigo-800/20 relative">
                <Layers className="size-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Reserved units are locked in active <span className="font-bold text-indigo-700 dark:text-indigo-300">Quotations</span> and pending <span className="font-bold text-indigo-700 dark:text-indigo-300">Sales Orders</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <ShoppingCart className="size-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.totalSold || 0} Units</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <ClipboardList className="size-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Enquiries</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.totalEnquiries || 0} Active Quotes</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <History className="size-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Shipped</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {stats?.lastSold ? new Date(stats.lastSold).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Audit / Recent Activity Section */}
        <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white flex items-center gap-3">
              <History className="size-4 text-indigo-600" />
              Inventory Transaction History
            </h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {itemTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">No transaction history recorded for this item.</div>
            ) : (
              itemTransactions.slice(0, 20).map((tx) => {
                const isPositive = tx.quantityChange > 0
                const typeConfig = {
                  receipt: { label: 'Receipt', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  shipment: { label: 'Shipment', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                  adjustment: { label: 'Adjustment', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  reservation: { label: 'Reservation', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  release: { label: 'Release', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800/50' },
                  return: { label: 'Return', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                }
                const config = typeConfig[tx.type as keyof typeof typeConfig] || typeConfig.adjustment

                return (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("size-10 rounded-xl flex items-center justify-center", config.bg)}>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", config.color)}>{config.label}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{tx.reason || tx.type}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {tx.referenceNumber || tx.referenceType} • {new Date(tx.createdAt).toLocaleDateString()} • {tx.userName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={cn("text-xs font-black", isPositive ? "text-emerald-600" : "text-rose-600")}>
                          {isPositive ? '+' : ''}{tx.quantityChange} Units
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                          {tx.quantityBefore} → {tx.quantityAfter}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        item={item}
        onConfirm={handleStockAdjustment}
      />
    </div>
  )
}
