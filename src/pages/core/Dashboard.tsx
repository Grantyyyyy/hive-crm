import { useMemo } from "react"
import { Link } from "wouter"
import {
  Activity,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Ticket,
  ChevronDown,
  MoreHorizontal,
  Database
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/helpers"
import type { Deal, Activity as ActivityT } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { DashboardSkeleton } from "@/components/ui/skeletons"

export function Dashboard() {
  const { data: deals, isLoaded: dealsLoaded } = useCRMResource<Deal>('deals')
  const { data: activities, isLoaded: activitiesLoaded } = useCRMResource<ActivityT>('activities')

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

  const hasData = deals.length > 0 || activities.length > 0

  if (!dealsLoaded || !activitiesLoaded) {
    return <DashboardSkeleton />
  }

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to your CRM
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            You don't have any deals or activities yet. Start by adding some data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in">

        {/* Title Section */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">SYSTEM OVERVIEW</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back. Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Revenue Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-teal-600 transition-all hover:shadow-xl hover:shadow-teal-600/5 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-teal-600/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                <CreditCard className="w-5 h-5 text-teal-600" />
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
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">12</h3>
              </div>
            </div>
          </Link>

          {/* Tickets Card */}
          <Link href="/in-progress" className="block transform transition-all active:scale-95 group">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-teal-600 transition-all hover:shadow-xl hover:shadow-teal-600/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 bg-teal-600/10 rounded flex items-center justify-center transition-transform group-hover:scale-110">
                  <Ticket className="w-5 h-5 text-teal-600" />
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
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
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
                  stroke="#0D9488"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Activity Dots */}
                <circle cx="200" cy="160" r="4" fill="var(--bg-surface)" stroke="#0D9488" strokeWidth="2" />
                <circle cx="400" cy="180" r="4" fill="var(--bg-surface)" stroke="#0D9488" strokeWidth="2" />
                <circle cx="600" cy="60" r="4" fill="var(--bg-surface)" stroke="#0D9488" strokeWidth="2" />
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
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-md transition-all group-hover:bg-teal-600/10"
                      style={{ height: stage.height }}
                    >
                      <div
                        className="w-full bg-teal-600 rounded-md transition-all duration-500 opacity-20 group-hover:opacity-100 shadow-lg shadow-teal-600/20"
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
                <Button variant="link" className="p-0 h-auto text-teal-600 text-xs font-bold hover:text-teal-700">View All</Button>
              </Link>
            </div>
            <div className="p-2">
              {recentActivities.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">No recent activity.</div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all border-l-4 border-transparent hover:border-teal-600 hover:shadow-xl hover:shadow-teal-600/5 group/row relative z-0 hover:z-10",
                  )}>
                    <div className="w-10 h-10 bg-teal-600/10 rounded flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110">
                      <Activity className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activity.content}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded shadow-sm">
                      {activity.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Low Stock Items</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {[
                { name: "Wireless Keyboard", sku: "WKB-001", stock: 2 },
                { name: "USB-C Adapter", sku: "UCA-220", stock: 5 },
                { name: "Office Chair v2", sku: "CHV2-BL", stock: 1 },
                { name: "Monitor 24\" IPS", sku: "MON24-IPS", stock: 3 },
              ].map((item) => (
                <div key={item.sku} className="flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-slate-800 hover:border-teal-600/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      item.stock < 3 ? "text-red-600" : "text-amber-600"
                    )}>
                      {item.stock} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

