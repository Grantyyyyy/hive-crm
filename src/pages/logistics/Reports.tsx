import { useMemo, useState } from "react"
import {
  Calendar,
  ChevronDown,
  TrendingUp,
  Banknote,
  Package,
  Users,
  LayoutDashboard,
  Trophy,
  Star,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCRMResource } from "@/lib/hooks"
import { useAuth } from "@/lib/AuthContext"
import { useTheme } from "@/lib/ThemeProvider"
import { getBrandColorPreset } from "@/lib/brandColors"
import { ListSkeleton } from "@/components/ui/skeletons"
import type { SalesOrder, Quote, Deal, InventoryItem, Contact, Lead, InventoryTransaction } from "@/lib/types"
import { StatCard } from "@/components/reusables/StatCard"
import { formatCurrency } from "@/lib/helpers"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line
} from "recharts"

type Period = "30d" | "6m" | "1y" | "all"

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "30d", label: "Last 30 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last Year" },
  { value: "all", label: "All Time" },
]

function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  switch (period) {
    case "30d":
      start.setDate(end.getDate() - 30)
      break
    case "6m":
      start.setMonth(end.getMonth() - 6)
      break
    case "1y":
      start.setFullYear(end.getFullYear() - 1)
      break
    case "all":
      start.setFullYear(2000)
      break
  }
  return { start, end }
}

function isInRange(dateStr: string | undefined, range: { start: Date; end: Date }): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= range.start && d <= range.end
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) => formatCurrency(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`
const REPORT_BASE_COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

function getMonthKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const { brandColor } = useAuth()
  const { theme } = useTheme()
  const { data: orders, isLoaded: ordersLoaded } = useCRMResource<SalesOrder>("orders")
  const { data: quotes, isLoaded: quotesLoaded } = useCRMResource<Quote>("quotes")
  const { data: deals, isLoaded: dealsLoaded } = useCRMResource<Deal>("deals")
  const { data: inventory, isLoaded: invLoaded } = useCRMResource<InventoryItem>("inventory")
  const { data: contacts, isLoaded: contactsLoaded } = useCRMResource<Contact>("contacts")
  const { data: leads, isLoaded: leadsLoaded } = useCRMResource<Lead>("leads")
  const { data: transactions, isLoaded: txLoaded } = useCRMResource<InventoryTransaction>("inventory_transactions")

  const [period, setPeriod] = useState<Period>("6m")
  const [periodOpen, setPeriodOpen] = useState(false)
  const range = useMemo(() => getDateRange(period), [period])
  const accentColor = useMemo(() => {
    const preset = getBrandColorPreset(brandColor)
    return theme === "dark" ? preset.dark.accent : preset.light.accent
  }, [brandColor, theme])
  const categoryColors = useMemo(() => [accentColor, ...REPORT_BASE_COLORS], [accentColor])

  // ── Hook Safety: Ensure all hooks are called before any early returns ──────

  const filteredOrders = useMemo(() => orders.filter(o => isInRange(o.orderDate, range)), [orders, range])
  const filteredQuotes = useMemo(() => quotes.filter(q => isInRange(q.date, range)), [quotes, range])
  const filteredDeals = useMemo(() => deals.filter(d => isInRange(d.createdAt, range)), [deals, range])
  const filteredTransactions = useMemo(() => transactions.filter(t => isInRange(t.createdAt, range)), [transactions, range])

  // KPI Calculations (Wrapped in useMemo for consistency)
  const deliveredRevenue = useMemo(() => filteredOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalValue, 0), [filteredOrders])

  const prevRange = useMemo(() => {
    const diff = range.end.getTime() - range.start.getTime()
    return { start: new Date(range.start.getTime() - diff), end: new Date(range.start.getTime() - 1) }
  }, [range])

  const prevRevenue = useMemo(() => orders
    .filter(o => o.status === "delivered" && isInRange(o.orderDate, prevRange))
    .reduce((sum, o) => sum + o.totalValue, 0), [orders, prevRange])

  const revenueChange = useMemo(() => prevRevenue > 0 ? ((deliveredRevenue - prevRevenue) / prevRevenue) * 100 : 0, [deliveredRevenue, prevRevenue])

  const pipelineValue = useMemo(() => deals
    .filter(d => !["won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0), [deals])

  const wonDeals = useMemo(() => deals.filter(d => d.stage === "won"), [deals])
  const lostDeals = useMemo(() => deals.filter(d => d.stage === "lost"), [deals])
  const winRate = useMemo(() => (wonDeals.length + lostDeals.length) > 0
    ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
    : 0, [wonDeals, lostDeals])

  const cogs = useMemo(() => filteredTransactions
    .filter(t => t.type === 'shipment')
    .reduce((sum, t) => sum + (t.totalCost || 0), 0), [filteredTransactions])

  const totalStockValue = useMemo(() => inventory.reduce((sum, i) => sum + (i.stockQuantity * (i.movingAverageCost || i.price)), 0), [inventory])
  const inventoryTurnover = useMemo(() => totalStockValue > 0 ? (cogs / totalStockValue) : 0, [cogs, totalStockValue])

  // Chart Data useMemo hooks
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, { revenue: number; quotes: number; month: string }>()
    filteredOrders
      .filter(o => o.status === "delivered")
      .forEach(o => {
        const key = getMonthKey(o.orderDate)
        const entry = map.get(key) || { revenue: 0, quotes: 0, month: key }
        entry.revenue += o.totalValue
        map.set(key, entry)
      })
    filteredQuotes
      .filter(q => q.status === "accepted")
      .forEach(q => {
        const key = getMonthKey(q.date)
        const entry = map.get(key) || { revenue: 0, quotes: 0, month: key }
        entry.quotes += 1
        map.set(key, entry)
      })
    return Array.from(map.values()).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime()
    })
  }, [filteredOrders, filteredQuotes])

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const entry = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.quantity * item.price
        productMap.set(item.name, entry)
      })
    })
    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredOrders])

  const revenueByCategory = useMemo(() => {
    const catMap = new Map<string, number>()
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const invItem = inventory.find(i => i.name === item.name || i.id === item.inventoryItemId)
        const category = invItem?.category || "Uncategorized"
        catMap.set(category, (catMap.get(category) || 0) + (item.quantity * item.price))
      })
    })
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredOrders, inventory])

  const topCustomers = useMemo(() => {
    const custMap = new Map<string, number>()
    filteredOrders.forEach(order => {
      custMap.set(order.customerName, (custMap.get(order.customerName) || 0) + order.totalValue)
    })
    return Array.from(custMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  const dealsByStage = useMemo(() => {
    const stages = ["discovery", "proposal", "negotiation", "won", "lost"]
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
    }))
  }, [deals])

  // ── Early Return (AFTER all hooks) ──────────────────────────────────────────

  const allLoaded = ordersLoaded && quotesLoaded && dealsLoaded && invLoaded && contactsLoaded && leadsLoaded && txLoaded
  if (!allLoaded) return <ListSkeleton />

  const selectedPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || "Last 6 Months"

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-6 max-w-full animate-fade-in space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">Intelligence</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reports</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Actionable insights for your business operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setPeriodOpen(v => !v)}
                className="flex items-center gap-2 h-10 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                {selectedPeriodLabel}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", periodOpen && "rotate-180")} />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[180px] py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setPeriod(opt.value); setPeriodOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={fmtCurrency(deliveredRevenue)}
            icon={<Banknote className="w-5 h-5" />}
            accentColor="accent"
            badge={revenueChange >= 0 ? `+${revenueChange.toFixed(1)}%` : `${revenueChange.toFixed(1)}%`}
            badgeColor={revenueChange >= 0 ? "emerald" : "rose"}
          />

          <StatCard
            label="Pipeline Value"
            value={fmtCurrency(pipelineValue)}
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="blue"
            badge={`${deals.length} deals`}
            badgeColor="blue"
          />

          <StatCard
            label="Win Rate"
            value={fmtPct(winRate)}
            icon={<Trophy className="w-5 h-5" />}
            accentColor="amber"
            badge={`${wonDeals.length} Won`}
            badgeColor="emerald"
          />

          <StatCard
            label="Inv. Turnover"
            value={inventoryTurnover.toFixed(2)}
            icon={<Activity className="w-5 h-5" />}
            accentColor="rose"
            badge={inventoryTurnover > 1.5 ? "High" : inventoryTurnover > 0.5 ? "Good" : "Low"}
            badgeColor={inventoryTurnover > 1.5 ? "rose" : inventoryTurnover > 0.5 ? "emerald" : "amber"}
          />
        </div>

        {/* Primary Row: Sales Trends & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sales Pipeline Funnel */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg group">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent-dim rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-accent" />
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Sales Pipeline</h4>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deals.length} total deals</span>
            </div>
            <div className="relative h-[220px] w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: "12px", fontWeight: 700 }}
                    formatter={(v: any) => fmtCurrency(Number(v))}
                  />
                  <Bar dataKey="value" fill={accentColor} radius={[0, 10, 10, 0]} name="Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trends */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg group">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent-dim rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Revenue Trends</h4>
              </div>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Quotes</span>
              </div>
            </div>
            <div className="relative h-[220px] w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: "12px", fontWeight: 700 }}
                    formatter={(v: any, name: any) => name === "revenue" ? fmtCurrency(Number(v)) : v}
                  />
                  <Area type="monotone" dataKey="revenue" fill={accentColor} fillOpacity={0.08} stroke={accentColor} strokeWidth={3} />
                  <Line type="monotone" dataKey="quotes" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: "#06b6d4", strokeWidth: 2, stroke: "#fff" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Secondary Row: Products & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Products */}
          <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Top Products by Volume</h4>
              </div>
            </div>
            <div className="relative h-[220px] w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: "12px", fontWeight: 700 }}
                    formatter={(v: any) => Number(v).toLocaleString()}
                  />
                  <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 10, 10, 0]} name="Units Sold" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight w-full mb-4">Revenue by Category</h4>
            <div className="relative w-full h-[180px] min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={60}
                    paddingAngle={5}
                  >
                    {revenueByCategory.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={categoryColors[i % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3 mt-4">
              {revenueByCategory.slice(0, 4).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{fmtCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Row: Top Customers */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Top Customers by Revenue</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {topCustomers.map((customer, i) => (
              <div key={customer.name} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-accent/30 transition-all hover:shadow-lg bg-slate-50/30 dark:bg-slate-800/30">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm",
                    i === 0 ? "bg-accent text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  )}>
                    #{i + 1}
                  </div>
                  {i === 0 && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1 truncate">{customer.name}</p>
                <p className="text-lg font-black text-accent">{fmtCurrency(customer.revenue)}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${(customer.revenue / (topCustomers[0]?.revenue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
