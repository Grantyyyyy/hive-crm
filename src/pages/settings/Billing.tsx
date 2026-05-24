import { useMemo } from 'react'
import { ShieldCheck, Check, X, Infinity, Shield, Sprout, Zap, Crown } from 'lucide-react'
import { usePlan, PLAN_LIMITS } from '@/lib/usePlan'
import { useCRMResource } from '@/lib/hooks'
import { SettingsHeader } from '@/components/reusables/SettingsHeader'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { cn } from "@/lib/utils"

export function Billing() {
  const { 
    plan, 
    isTrialing, 
    daysLeftInTrial,
    getLimit, 
    isSuperAdmin,
    isLoaded: planLoaded
  } = usePlan()

  // Usage data
  const { data: leads = [], isLoaded: leadsLoaded } = useCRMResource('leads')
  const { data: contacts = [], isLoaded: contactsLoaded } = useCRMResource('contacts')
  const { data: deals = [], isLoaded: dealsLoaded } = useCRMResource('deals')
  const { data: projects = [], isLoaded: projectsLoaded } = useCRMResource('projects')
  const { data: users = [], isLoaded: usersLoaded } = useCRMResource('users')

  const isLoaded = planLoaded && leadsLoaded && contactsLoaded && dealsLoaded && projectsLoaded && usersLoaded

  const usageStats = useMemo(() => [
    { label: "Leads", count: leads.length, limit: getLimit('leads') },
    { label: "Contacts", count: contacts.length, limit: getLimit('contacts') },
    { label: "Deals", count: deals.length, limit: getLimit('deals') },
    { label: "Projects", count: projects.length, limit: getLimit('projects') },
    { label: "Team Members", count: users.length, limit: getLimit('seats') },
  ], [leads.length, contacts.length, deals.length, projects.length, users.length, getLimit])

  const planComparisonFeatures = [
    { label: 'Seats', key: 'seats' },
    { label: 'Leads', key: 'leads' },
    { label: 'Contacts', key: 'contacts' },
    { label: 'Deals', key: 'deals' },
    { label: 'Projects', key: 'projects' },
    { label: 'Inventory Module', key: 'inventory' },
    { label: 'Procurement Module', key: 'procurement' },
    { label: 'Reports', key: 'reports' },
    { label: 'Custom Roles', key: 'customRoles' },
  ]

  const renderFeatureValue = (val: number | boolean | null) => {
    if (val === null) return <span className="text-sm font-semibold text-emerald-500">Unlimited</span>
    if (typeof val === 'number') return <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{val}</span>
    if (val === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />
    return <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
  }

  const isCurrentPlan = (p: string) => {
    if (isTrialing) return p === 'pro'
    return plan === p
  }

  if (!isLoaded) return <SettingsSkeleton />

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* SECTION 2 — Page Header */}
      <SettingsHeader 
        title="Billing & Plan"
        category="Account Management"
        actions={
          !isSuperAdmin && (
            <a 
              href="#" 
              className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-4 py-2"
            >
              Manage Subscription
            </a>
          )
        }
      >
        <div className="flex flex-col gap-2">
          {isSuperAdmin && (
            <div className="bg-accent-dim border border-accent/20 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
              <Shield className="w-4 h-4 text-accent" />
              <p className="text-xs font-semibold text-accent">
                Super Admin Mode — Unlimited access to all platform features.
              </p>
            </div>
          )}
          {isTrialing && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
              <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Pro Trial Active — {daysLeftInTrial} days remaining.
              </p>
            </div>
          )}
        </div>
      </SettingsHeader>


      {/* SECTION 3 — Current Plan Card */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Plan</h2>
        </div>
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              {isTrialing ? (
                <span className="text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                  PRO TRIAL
                </span>
              ) : plan === 'free' ? (
                <span className="text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Free
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 bg-accent-dim text-accent">
                  {plan === 'pro' ? 'Pro' : 'Enterprise'}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {plan === 'free' && "Basic access with limited records."}
                {plan === 'pro' && "Full access to all modules."}
                {plan === 'enterprise' && "Unlimited everything + priority support."}
              </p>
              {isTrialing && (
                <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} remaining in trial.
                </p>
              )}
            </div>
          </div>
          {plan === 'free' && !isTrialing && !isSuperAdmin && (
            <a 
              href="#" 
              className="bg-accent hover:opacity-90 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md shadow-accent/20 transition-all px-4 py-2"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      </div>

      {/* SECTION 4 — Usage Meters Card */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Usage</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {usageStats.map((item) => (
              <div key={item.label} className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {item.label === 'Team Members' ? 'Seats' : item.label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    {isSuperAdmin ? (
                      <Infinity className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <>
                        {item.count} / {item.limit === null ? '∞' : item.limit}
                      </>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                  {isSuperAdmin ? (
                    <div className="h-1 rounded-full bg-emerald-500 w-full" />
                  ) : item.limit !== null && (
                    <div
                      className={`h-1 rounded-full transition-all ${
                        (item.count / item.limit) >= 0.9 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((item.count / item.limit) * 100, 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5 — Plan Comparison Cards */}
      {!isSuperAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Available Plans</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'free',
                name: 'Free',
                tagline: 'Basic partition',
                price: '0',
                icon: Sprout,
                features: [
                  'Up to 5 users',
                  '100 leads & contacts',
                  '50 deals tracking',
                  '3 active projects',
                  'Task management'
                ],
                highlight: false
              },
              {
                id: 'pro',
                name: 'Pro',
                tagline: 'Full workflow',
                price: '29',
                icon: Zap,
                features: [
                  'Up to 10 users',
                  'Unlimited leads & contacts',
                  'Unlimited deals & pipeline',
                  'Inventory & stock tracking',
                  'Procurement management',
                  'Custom branding'
                ],
                highlight: true
              },
              {
                id: 'enterprise',
                name: 'Enterprise',
                tagline: 'Maximum scale',
                price: '129',
                icon: Crown,
                features: [
                  'Unlimited users',
                  'Full procurement workflow',
                  'Advanced quotes & orders',
                  'Custom roles & RBAC',
                  'Multi-org management',
                  'Priority support & SLA'
                ],
                highlight: false
              }
            ].map((p) => {
              const isActive = isCurrentPlan(p.id);
              const Icon = p.icon;
              
              return (
                <div 
                  key={p.id}
                  className={cn(
                    "relative flex flex-col rounded-md border transition-all duration-300",
                    p.highlight 
                      ? "bg-white dark:bg-slate-900 border-accent/30 shadow-xl shadow-accent/5 ring-1 ring-accent/10" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm",
                    isActive && "ring-2 ring-accent border-accent/50 shadow-accent/10"
                  )}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-3 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        p.highlight ? "bg-accent text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-dim text-accent text-[9px] font-black uppercase tracking-widest rounded-lg border border-accent/10">
                          <Check className="w-3 h-3" /> Current
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{p.tagline}</p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-400">$</span>
                        <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{p.price}</span>
                        <span className="text-xs font-medium text-slate-400">/mo</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                            p.highlight ? "bg-accent/10" : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <Check className={cn(
                              "w-2.5 h-2.5",
                              p.highlight ? "text-accent" : "text-slate-400"
                            )} />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {!isActive ? (
                      <button className={cn(
                        "w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95",
                        p.highlight 
                          ? "bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}>
                        Upgrade to {p.name}
                      </button>
                    ) : (
                      <div className="w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-accent-dim text-accent border border-accent/10 text-center">
                        Active Plan
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}