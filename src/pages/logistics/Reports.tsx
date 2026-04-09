import { useMemo, useState } from "react"
import { Calendar, ChevronDown, TrendingUp, Banknote, Package, Users } from "lucide-react"
import { useCRMResource } from "@/lib/hooks"
import { ListSkeleton } from "@/components/ui/skeletons"
import type { SalesOrder, Quote, Deal, InventoryItem, Contact, Lead } from "@/lib/types"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts"

// ── Period Filter ────────────────────────────────────────────────────────────

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

const fmtCurrency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtPct = (v: number) => `${v.toFixed(1)}%`

const COLORS = ["#0d9488", "#14b8a6", "#f59e0b", "#ef4444", "#06b6d4"]

function getMonthKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const { data: orders, isLoaded: ordersLoaded } = useCRMResource<SalesOrder>("orders")
  const { data: quotes, isLoaded: quotesLoaded } = useCRMResource<Quote>("quotes")
  const { data: deals, isLoaded: dealsLoaded } = useCRMResource<Deal>("deals")
  const { data: inventory, isLoaded: invLoaded } = useCRMResource<InventoryItem>("inventory")
  const { data: contacts, isLoaded: contactsLoaded } = useCRMResource<Contact>("contacts")
  const { data: leads, isLoaded: leadsLoaded } = useCRMResource<Lead>("leads")

  const [period, setPeriod] = useState<Period>("6m")
  const [periodOpen, setPeriodOpen] = useState(false)
  const range = useMemo(() => getDateRange(period), [period])

  const allLoaded = ordersLoaded && quotesLoaded && dealsLoaded && invLoaded && contactsLoaded && leadsLoaded
  if (!allLoaded) return <ListSkeleton />

  // ── Filtered Data ──────────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => isInRange(o.orderDate, range))
  const filteredQuotes = quotes.filter(q => isInRange(q.date, range))
  const filteredLeads = leads.filter(l => isInRange(l.createdAt, range))

  // ── KPI Calculations ───────────────────────────────────────────────────────

  const deliveredRevenue = filteredOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalValue, 0)

  const prevRange = (() => {
    const diff = range.end.getTime() - range.start.getTime()
    return { start: new Date(range.start.getTime() - diff), end: new Date(range.start.getTime() - 1) }
  })()
  const prevRevenue = orders
    .filter(o => o.status === "delivered" && isInRange(o.orderDate, prevRange))
    .reduce((sum, o) => sum + o.totalValue, 0)
  const revenueChange = prevRevenue > 0 ? ((deliveredRevenue - prevRevenue) / prevRevenue) * 100 : 0

  const pipelineValue = deals
    .filter(d => !["won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0)

  const wonDeals = deals.filter(d => d.stage === "won")
  const lostDeals = deals.filter(d => d.stage === "lost")
  const winRate = (wonDeals.length + lostDeals.length) > 0
    ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
    : 0

  const inStock = inventory.filter(i => i.status === "active" && i.stockLevel === "in_stock").length
  const lowStock = inventory.filter(i => i.status === "active" && i.stockLevel === "low_stock").length
  const outOfStock = inventory.filter(i => i.status === "active" && i.stockLevel === "out_of_stock").length
  const totalActive = inventory.filter(i => i.status === "active").length
  const inventoryHealth = totalActive > 0 ? (inStock / totalActive) * 100 : 0
  const totalInventoryValue = inventory.reduce((sum, i) => sum + i.stockQuantity * i.price, 0)

  const acceptedQuotes = filteredQuotes.filter(q => q.status === "accepted").length
  const conversionRate = filteredQuotes.length > 0 ? (acceptedQuotes / filteredQuotes.length) * 100 : 0

  // ── Chart Data ─────────────────────────────────────────────────────────────

  // Revenue by month
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
      // Sort by actual date, not string
      return new Date(a.month).getTime() - new Date(b.month).getTime()
    })
  }, [filteredOrders, filteredQuotes])

  // Deals by stage
  const dealsByStage = useMemo(() => {
    const stages = ["discovery", "proposal", "negotiation", "won", "lost"]
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
    }))
  }, [deals])

  // Leads by source
  const leadsBySource = useMemo(() => {
    const sources = [...new Set(leads.map(l => l.source))]
    return sources.map(source => ({
      source: source.charAt(0).toUpperCase() + source.slice(1).replace("-", " "),
      count: leads.filter(l => l.source === source).length,
    }))
  }, [leads])

  // Contacts by status
  const contactsByStatus = useMemo(() => {
    const raw = contacts.map(c => c.status ?? "unknown")
    const statuses = [...new Set(raw)]
    return statuses.map(status => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: contacts.filter(c => (c.status ?? "unknown") === status).length,
    }))
  }, [contacts])

  const selectedPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || "Last 6 Months"

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">View and analyze your business performance.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setPeriodOpen(v => !v)}
                className="flex items-center gap-2 h-10 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {selectedPeriodLabel}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 min-w-[180px] py-1 overflow-hidden">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setPeriod(opt.value); setPeriodOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 dark:text-teal-400">
                <Banknote className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm ${revenueChange >= 0
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
                }`}>
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
            <h3 className="text-2xl font-bold mt-1">{fmtCurrency(deliveredRevenue)}</h3>
          </div>

          {/* Pipeline Value */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 dark:text-teal-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg shadow-sm">
                Active
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pipeline Value</p>
            <h3 className="text-2xl font-bold mt-1">{fmtCurrency(pipelineValue)}</h3>
          </div>

          {/* Win Rate */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 dark:text-teal-400">
                <Users className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm ${winRate >= 50
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : winRate >= 25
                  ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                  : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
                }`}>
                {fmtPct(winRate)}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Win Rate</p>
            <h3 className="text-2xl font-bold mt-1">{wonDeals.length} / {wonDeals.length + lostDeals.length} deals</h3>
          </div>

          {/* Inventory Health */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
                <Package className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm ${inventoryHealth >= 70
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : inventoryHealth >= 40
                  ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                  : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
                }`}>
                {outOfStock} out
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inventory Health</p>
            <h3 className="text-2xl font-bold mt-1">{fmtPct(inventoryHealth)}</h3>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trends */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Revenue Trends</h4>
              <div className="flex gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Quotes</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="#0d9488" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="quotes" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deal Pipeline */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Deal Pipeline</h4>
              <span className="text-xs font-medium text-slate-500">{deals.length} total deals</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} name="Deals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Performance Metrics Table */}
          <div className="xl:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Performance Metrics</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="pb-4 font-semibold">Category</th>
                    <th className="pb-4 font-semibold">Volume</th>
                    <th className="pb-4 font-semibold">Conversion</th>
                    <th className="pb-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Delivered Orders</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">{fmtCurrency(deliveredRevenue)}</td>
                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">{filteredOrders.filter(o => o.status === "delivered").length} orders</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${revenueChange >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                        }`}>
                        {revenueChange >= 0 ? "Growing" : "Declining"}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Accepted Quotes</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">{acceptedQuotes} of {filteredQuotes.length}</td>
                    <td className="py-4 font-medium text-teal-600 dark:text-teal-500">{fmtPct(conversionRate)}</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${conversionRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        }`}>
                        {conversionRate >= 50 ? "Strong" : "Watch"}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Won Deals</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">{wonDeals.length} won</td>
                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">{fmtPct(winRate)} win rate</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : winRate >= 25 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                        }`}>
                        {winRate >= 50 ? "Healthy" : winRate >= 25 ? "Watch" : "Critical"}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">New Leads</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">{filteredLeads.length} leads</td>
                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">{filteredLeads.filter(l => l.status === "qualified").length} qualified</td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Tracking
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact Distribution */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-lg mb-6 w-full text-left text-slate-900 dark:text-white">Contact Distribution</h4>
            <div className="w-48 h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contactsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label
                  >
                    {contactsByStatus.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {contactsByStatus.map((item, i) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500 dark:text-slate-400">{item.status} ({item.count})</span>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 px-4">
              {contacts.length} total contacts across all statuses.
            </p>
          </div>
        </div>

        {/* Inventory & Lead Source Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Breakdown */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Inventory Breakdown</h4>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{inStock}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mt-1">In Stock</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-center">
                <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{lowStock}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1">Low Stock</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-center">
                <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{outOfStock}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1">Out of Stock</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Value</span>
              <span className="text-xl font-black text-teal-600 dark:text-teal-400">{fmtCurrency(totalInventoryValue)}</span>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Lead Sources</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label
                  >
                    {leadsBySource.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
