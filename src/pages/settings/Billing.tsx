import { useMemo } from 'react'
import { ShieldCheck, Check, X, Infinity, Shield } from 'lucide-react'
import { usePlan, PLAN_LIMITS } from '@/lib/usePlan'
import { useCRMResource } from '@/lib/hooks'
import { SettingsHeader } from '@/components/reusables/SettingsHeader'
import { SettingsSkeleton } from '@/components/ui/skeletons'

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
    if (val === null) return <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Unlimited</span>
    if (typeof val === 'number') return <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{val}</span>
    if (val === true) return <Check className="w-4 h-4 text-teal-600 mx-auto" />
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
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
              <Shield className="w-4 h-4 text-teal-600" />
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
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
                <span className="text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400">
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
              className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md shadow-teal-200 dark:shadow-none transition-colors px-4 py-2"
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
                      <Infinity className="w-3 h-3 text-teal-600" />
                    ) : (
                      <>
                        {item.count} / {item.limit === null ? '∞' : item.limit}
                      </>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                  {isSuperAdmin ? (
                    <div className="h-1 rounded-full bg-teal-600 w-full" />
                  ) : item.limit !== null && (
                    <div
                      className={`h-1 rounded-full transition-all ${
                        (item.count / item.limit) >= 0.9 ? 'bg-red-500' : 'bg-teal-600'
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

      {/* SECTION 5 — Plan Comparison Card */}
      {!isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-5 bg-slate-50 dark:bg-slate-900/50 w-1/4"></th>
                  {(['free', 'pro', 'enterprise'] as const).map((p) => (
                    <th 
                      key={p} 
                      className={`px-4 py-5 text-center transition-all ${
                        isCurrentPlan(p) 
                          ? 'bg-teal-50/30 dark:bg-teal-900/10 border-x-2 border-t-2 border-teal-600/20' 
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {p}
                        </span>
                        {isCurrentPlan(p) && (
                          <span className="text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400">
                            CURRENT
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {planComparisonFeatures.map((feat, idx) => (
                  <tr 
                    key={feat.key} 
                    className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/50'}
                  >
                    <td className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">
                      {feat.label}
                    </td>
                    {(['free', 'pro', 'enterprise'] as const).map((p) => (
                      <td 
                        key={`${p}-${feat.key}`} 
                        className={`text-center px-4 py-3 transition-all ${
                          isCurrentPlan(p) ? 'bg-teal-50/30 dark:bg-teal-900/10 border-x-2 border-teal-600/20' : ''
                        }`}
                      >
                        {renderFeatureValue((PLAN_LIMITS[p] as any)[feat.key])}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Action Row */}
                <tr>
                  <td className="px-4 py-6"></td>
                  {(['free', 'pro', 'enterprise'] as const).map((p) => (
                    <td 
                      key={`${p}-action`} 
                      className={`px-4 py-6 text-center transition-all ${
                        isCurrentPlan(p) ? 'bg-teal-50/30 dark:bg-teal-900/10 border-x-2 border-b-2 border-teal-600/20 rounded-b-md' : ''
                      }`}
                    >
                      {!isCurrentPlan(p) && (
                        <a 
                          href="#" 
                          className="inline-flex bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none transition-colors px-5 py-2.5"
                        >
                          Upgrade
                        </a>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}