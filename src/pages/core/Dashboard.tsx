import { useMemo, useState } from "react"
import { Link, useLocation } from "wouter"
import {
  Activity,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Ticket,
  ChevronDown,
  MoreHorizontal,
  Database,
  ArrowRight,
  Sparkles,
  Boxes,
  ClipboardList
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/helpers"
import { useCRMResource } from "@/lib/hooks"
import { DashboardSkeleton } from "@/components/ui/skeletons"
import { useCRMContext, updateRow, insertRows } from "@/lib/CRMContext"
import type { Deal, Activity as ActivityT, InventoryItem, PurchaseRequest, PurchaseOrder, Quote, SalesOrder, Task, InventoryTransaction, PurchaseReceipt, PurchaseReceiptItem, ReturnToSupplier, Organization } from "@/lib/types"
import { createReorderDraft } from "@/services/reorderService"
import { toast } from "sonner"
import type { JobAdapter } from "@/services/types"
import { useUser } from "@/lib/AuthContext"
import { AddPurchaseRequestModal } from "@/components/logisticsComponent/AddPurchaseRequestModal"
import { prepareReorderDraftData } from "@/services/reorderService"
import { PageHeader } from "@/components/reusables/PageHeader"

export function Dashboard() {
  const { data: deals, isLoaded: dealsLoaded } = useCRMResource<Deal>('deals')
  const { data: activities, isLoaded: activitiesLoaded } = useCRMResource<ActivityT>('activities')
  const { data: inventory, isLoaded: inventoryLoaded } = useCRMResource<InventoryItem>('inventory')
  const { data: organizations } = useCRMResource<Organization>('organizations')
  const ctx = useCRMContext()
  const { user } = useUser()
  const [, setLocation] = useLocation()

  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false)
  const [reorderData, setReorderData] = useState<Partial<PurchaseRequest> | null>(null)

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => {
      const threshold = item.reorderThreshold || 0
      return item.stockQuantity <= threshold && item.status === 'active'
    })
  }, [inventory])

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0] as Quote),
    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    updateSalesOrderItem: async (orderId, itemId, patch) => {
      const order = ctx.getResource<SalesOrder>('orders').data.find(o => o.id === orderId);
      if (!order) return;
      const updatedItems = order.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<SalesOrder>(ctx, 'orders', orderId, { items: updatedItems });
    },
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0] as SalesOrder),
    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item: Omit<InventoryItem, 'id'>) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),
    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0] as PurchaseRequest),
    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    updatePurchaseOrderItem: async (poId, itemId, patch) => {
      const po = ctx.getResource<PurchaseOrder>('purchase_orders').data.find(p => p.id === poId);
      if (!po) return;
      const updatedItems = po.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', poId, { items: updatedItems as any });
    },
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0] as PurchaseOrder),
    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0] as InventoryTransaction),
    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),
    getPurchaseReceipts: () => ctx.getResource<PurchaseReceipt>('purchase_receipts').data,
    getPurchaseReceiptItems: () => ctx.getResource<PurchaseReceiptItem>('purchase_receipt_items').data,
    insertPurchaseReceipt: (r) => insertRows<PurchaseReceipt>(ctx, 'purchase_receipts', [r as any]).then(rows => rows[0] as PurchaseReceipt),
    insertPurchaseReceiptItem: (i) => insertRows<PurchaseReceiptItem>(ctx, 'purchase_receipt_items', [i as any]).then(rows => rows[0] as PurchaseReceiptItem),
    getReturnToSuppliers: () => ctx.getResource<ReturnToSupplier>('return_to_suppliers').data,
    insertReturnToSupplier: (rts) => insertRows<ReturnToSupplier>(ctx, 'return_to_suppliers', [rts as any]).then(rows => rows[0] as ReturnToSupplier),
    updateReturnToSupplier: (id, patch) => updateRow<ReturnToSupplier>(ctx, 'return_to_suppliers', id, patch),
    runAtomicUpdate: (ops) => ctx.runAtomicUpdate(ops),
  }), [ctx])

  const handleAutoReorder = () => {
    if (lowStockItems.length === 0) return
    const draft = prepareReorderDraftData(
      lowStockItems,
      user?.id || '',
      user?.user_metadata?.full_name || user?.email || 'User'
    )
    setReorderData(draft ?? null)
    setIsReorderModalOpen(true)
  }

  const openDeals = useMemo(
    () => deals.filter((d) => !["won", "lost"].includes(d.stage)),
    [deals]
  )

  const totalDealValue = useMemo(
    () => openDeals.reduce((sum, d) => sum + d.value, 0),
    [openDeals]
  )

  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [activities]
  )

  const workspaceName = useMemo(() => {
    const org = organizations[0]
    return org?.appName || org?.name || "your workspace"
  }, [organizations])

  const firstName = useMemo(() => {
    return (
      user?.user_metadata?.full_name?.split(" ")[0] ||
      user?.email?.split("@")[0] ||
      "there"
    )
  }, [user])

  const hasData = deals.length > 0 || activities.length > 0 || inventory.length > 0

  if (!dealsLoaded || !activitiesLoaded || !inventoryLoaded) {
    return <DashboardSkeleton />
  }

  if (!hasData) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid lg:grid-cols-[1.45fr_0.95fr]">
              <div className="relative px-6 py-8 md:px-10 md:py-12">
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_var(--accent-dim),_transparent_58%)]" />
                <div className="relative space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-dim px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                      <Sparkles className="w-3.5 h-3.5" />
                      Workspace Ready
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Welcome, {firstName}.
                      </p>
                      <h1 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                        Build the first layer of {workspaceName}.
                      </h1>
                      <p className="max-w-xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                        Your dashboard will start filling in as soon as we log pipeline activity, add inventory, or capture the first team actions. Pick the surface you want to activate first.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/leads">
                      <Button variant="brand" size="lg" className="w-full gap-2 rounded-xl px-5 sm:w-auto">
                        Add first lead
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/deals">
                      <Button variant="outlineNeutral" size="lg" className="w-full rounded-xl px-5 sm:w-auto">
                        Create deal pipeline
                      </Button>
                    </Link>
                    <Link href="/inventory">
                      <Button variant="outlineNeutral" size="lg" className="w-full rounded-xl px-5 sm:w-auto">
                        Open inventory
                      </Button>
                    </Link>
                  </div>

                  <div className="grid gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 md:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Pipeline</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">0</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Open deals waiting to be tracked.</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Activity</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">0</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Touchpoints, notes, and updates logged.</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Stock Alerts</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{lowStockItems.length}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Shortage signals will surface here.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-8 dark:border-slate-800 dark:bg-slate-950/60 lg:border-l lg:border-t-0 md:px-8 md:py-12">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">First Run</p>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      What to turn on first
                    </h2>
                    <p className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                      Keep the rollout simple. Once one stream is active, the dashboard starts becoming useful immediately.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">Seed the pipeline</p>
                        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                          Add a lead or a deal so revenue and stage tracking have real numbers to work with.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700 dark:bg-slate-100/5 dark:text-slate-200">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">Log your first activity</p>
                        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                          Notes, calls, and follow-ups become the timeline the team will rely on every day.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">Bring in stock visibility</p>
                        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                          Inventory unlocks shortage alerts, reorder suggestions, and a more useful operations view.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Dashboard signals appear automatically</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          No extra setup needed once records start landing in the workspace.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader 
          category="System Overview"
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's what's happening in your workspace today.`}
          className="px-0 bg-transparent border-none pb-2"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-accent transition-all hover:shadow-xl hover:shadow-accent/5 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded uppercase tracking-wider shadow-sm">
                +12.5%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Revenue</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{formatCurrency(totalDealValue || 128430)}</h3>
            </div>
          </div>

          {/* Active Deals Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500 transition-all hover:shadow-xl hover:shadow-emerald-600/5 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-emerald-500/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded uppercase tracking-wider shadow-sm">
                +5.2%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Pipeline</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{openDeals.length || 42}</h3>
            </div>
          </div>

          {/* Alerts Card */}
          <Link href="/in-progress" className="block transform transition-all active:scale-95 group">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500 transition-all hover:shadow-xl hover:shadow-amber-500/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 bg-amber-500/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded uppercase tracking-wider shadow-sm">
                  Priority Action
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{lowStockItems.length}</h3>
              </div>
            </div>
          </Link>

          {/* Tickets Card */}
          <Link href="/in-progress" className="block transform transition-all active:scale-95 group">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-accent transition-all hover:shadow-xl hover:shadow-accent/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                  <Ticket className="w-5 h-5 text-accent" />
                </div>
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded uppercase tracking-wider shadow-sm">
                  Active Support
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tickets Open</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">8</h3>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Sales Trend */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Sales Trend</h2>
              <Link href="/in-progress">
                <Button variant="outline" size="sm" className="h-auto py-1.5 flex items-center gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Last 6 Months <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="relative h-[240px] w-full">
              {/* SVG Line Chart Placeholder */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                {[0, 60, 120, 180, 240].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                ))}
                {/* The Area Path */}
                <path
                  d="M0,200 C100,190 150,150 200,160 S300,200 400,180 S500,80 600,60 S750,150 800,100 V240 H0 Z"
                  fill="url(#lineGradient)"
                />
                {/* The Line Path */}
                <path
                  d="M0,200 C100,190 150,150 200,160 S300,200 400,180 S500,80 600,60 S750,150 800,100"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Activity Dots */}
                <circle cx="200" cy="160" r="4" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="2" />
                <circle cx="400" cy="180" r="4" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="2" />
                <circle cx="600" cy="60" r="4" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="2" />
              </svg>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>

          {/* Deals by Stage */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Deals by Stage</h2>
              <Link href="/in-progress">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-col justify-end h-[240px]">
              <div className="flex items-baseline justify-between px-4 h-full">
                {[
                  { label: "Lead", height: "40%" },
                  { label: "Qualify", height: "65%" },
                  { label: "Propose", height: "50%" },
                  { label: "Negotiate", height: "85%" },
                  { label: "Closed", height: "30%" }
                ].map((stage, i) => (
                  <div key={stage.label} className="flex flex-col items-center gap-4 w-12 group">
                    <div
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-md transition-all group-hover:bg-accent/10"
                      style={{ height: stage.height }}
                    >
                      <div
                        className="w-full bg-accent rounded-md transition-all duration-500 opacity-20 group-hover:opacity-100 shadow-lg shadow-accent/20"
                        style={{ height: '0%', animation: `grow ${1 + i * 0.1}s forwards ease-out`, animationDelay: `${i * 0.1}s` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <style>{`
              @keyframes grow {
                from { height: 0; }
                to { height: 100%; }
              }
            `}</style>
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <Link href="/in-progress">
                <Button variant="link" className="p-0 h-auto text-accent text-xs font-bold hover:opacity-80">View All</Button>
              </Link>
            </div>
            <div className="p-2">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">No recent activity.</div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all border-l-4 border-transparent hover:border-accent hover:shadow-xl hover:shadow-accent/5 group/row relative z-0 hover:z-10",
                  )}>
                    <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110">
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activity.content}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent-dim px-2 py-1 rounded shadow-sm">
                      {activity.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Items & Reorder Suggestions */}
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shortage Summary</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Items below reorder threshold</p>
              </div>
              {lowStockItems.length > 0 && (
                <Button 
                  variant="brand" 
                  size="sm" 
                  onClick={handleAutoReorder}
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                >
                  Auto-Draft PR
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {lowStockItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No items currently low on stock.
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-slate-800 hover:border-accent/20 transition-all group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-accent transition-colors">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight font-mono">{item.sku}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">Threshold: {item.reorderThreshold}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-black",
                        item.stockQuantity === 0 ? "text-rose-600 animate-pulse" : "text-amber-600"
                      )}>
                        {item.stockQuantity} {item.stockQuantity === 1 ? 'unit' : 'units'}
                      </p>
                      <Link href={`/inventory/${item.id}`} className="text-[9px] font-bold text-accent uppercase hover:underline">Details</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <AddPurchaseRequestModal
          open={isReorderModalOpen}
          onOpenChange={setIsReorderModalOpen}
          initialData={reorderData || undefined}
          onSuccess={(pr) => {
            setLocation(`/purchase-requests/${pr.id}`)
          }}
        />
      </div>
    </div>
  )
}
