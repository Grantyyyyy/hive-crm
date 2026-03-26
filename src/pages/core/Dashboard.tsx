import { useState, useMemo } from "react"
import { Link } from "wouter"
import {
  Activity,
  TrendingUp,
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
import { PageSkeleton } from "@/components/ui/page-skeleton"

export function Dashboard() {
  const { isLoaded: contactsLoaded, refresh: refreshContacts } = useCRMResource('contacts')
  const { data: deals, isLoaded: dealsLoaded, refresh: refreshDeals } = useCRMResource<Deal>('deals')
  const { data: activities, isLoaded: activitiesLoaded, refresh: refreshActivities } = useCRMResource<ActivityT>('activities')
  const [seeding, setSeeding] = useState(false)

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

  const handleLoadDemoData = async () => {
    setSeeding(true)
    try {
      await seedApi.seed()
      await Promise.all([refreshContacts(), refreshDeals(), refreshActivities()])
      alert('Demo data loaded successfully!')
    } catch (error) {
      console.error('Error loading demo data:', error)
      alert('Failed to load demo data')
    } finally {
      setSeeding(false)
    }
  }

  if (!contactsLoaded || !dealsLoaded || !activitiesLoaded) {
    return <PageSkeleton />
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
            Get started by loading some demo data to explore the features.
          </p>
          <Button
            onClick={handleLoadDemoData}
            disabled={seeding}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {seeding ? 'Loading...' : 'Load Demo Data'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            System Overview
          </h1>
          <p className="text-text-muted mt-1 font-medium">
            Welcome back. Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-bg-surface p-6 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-green/10 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green" />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green/5 text-green text-xs font-bold rounded-lg leading-none">
                <TrendingUp className="w-3.5 h-3.5" />
                +12.5%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-muted">Total Revenue</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(totalDealValue || 128430)}</h3>
            </div>
          </div>

          {/* Active Deals Card */}
          <div className="bg-bg-surface p-6 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-accent" />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/5 text-accent text-xs font-bold rounded-lg leading-none">
                <TrendingUp className="w-3.5 h-3.5" />
                +5.2%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-muted">Active Deals</p>
              <h3 className="text-3xl font-bold tracking-tight">{openDeals.length || 42}</h3>
            </div>
          </div>

          {/* Alerts Card */}
          <Link href="/in-progress" className="block transform transition-all active:scale-95 group">
            <div className="bg-bg-surface p-6 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 transition-all hover:shadow-md hover:border-accent/20">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-amber/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber/5 text-amber text-[10px] uppercase tracking-wider font-bold rounded-lg leading-none">
                  Requires Action
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-muted">Low Stock Alerts</p>
                <h3 className="text-3xl font-bold tracking-tight">12</h3>
              </div>
            </div>
          </Link>

          {/* Tickets Card */}
          <Link href="/in-progress" className="block transform transition-all active:scale-95 group">
            <div className="bg-bg-surface p-6 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 transition-all hover:shadow-md hover:border-accent/20">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-accent" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-elevated text-text-muted text-xs font-bold rounded-lg leading-none">
                  -2 today
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-muted">Open Support Tickets</p>
                <h3 className="text-3xl font-bold tracking-tight">8</h3>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Sales Trend */}
          <div className="bg-bg-surface p-8 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold">Monthly Sales Trend</h2>
              <Link href="/in-progress">
                <Button variant="outlineNeutral" size="sm" className="h-auto py-1.5 flex items-center gap-2">
                  Last 6 Months <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="relative h-[240px] w-full">
              {/* SVG Line Chart Placeholder */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                {[0, 60, 120, 180, 240].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="currentColor" className="text-border" strokeWidth="1" />
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
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
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
          <div className="bg-bg-surface p-8 rounded-3xl border border-border shadow-sm shadow-bg-elevated/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold">Deals by Stage</h2>
              <Link href="/in-progress">
                <Button variant="ghost" size="icon">
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
                      className="w-full bg-bg-elevated rounded-xl transition-all group-hover:bg-accent/10"
                      style={{ height: stage.height }}
                    >
                      <div
                        className="w-full bg-accent rounded-xl transition-all duration-500 opacity-20 group-hover:opacity-100 shadow-lg shadow-accent/20"
                        style={{ height: '0%', animation: `grow ${1 + i * 0.1}s forwards ease-out`, animationDelay: `${i * 0.1}s` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stage.label}</span>
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
          <div className="lg:col-span-2 bg-bg-surface rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Activity</h2>
              <Link href="/in-progress">
                <Button variant="link" className="p-0 h-auto text-accent text-xs font-bold">View All</Button>
              </Link>
            </div>
            <div className="p-2">
              {recentActivities.length === 0 ? (
                <div className="p-12 text-center text-text-muted">No recent activity.</div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-bg-elevated transition-colors",
                  )}>
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {activity.content}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-elevated px-2 py-1 rounded-md">
                      {activity.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-bg-surface rounded-3xl border border-border shadow-sm shadow-bg-elevated/50 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-border">
              <h2 className="text-lg font-bold">Low Stock Items</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {[
                { name: "Wireless Keyboard", sku: "WKB-001", stock: 2 },
                { name: "USB-C Adapter", sku: "UCA-220", stock: 5 },
                { name: "Office Chair v2", sku: "CHV2-BL", stock: 1 },
                { name: "Monitor 24\" IPS", sku: "MON24-IPS", stock: 3 },
              ].map((item) => (
                <div key={item.sku} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-accent/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-tight">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      item.stock < 3 ? "text-red" : "text-amber"
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

