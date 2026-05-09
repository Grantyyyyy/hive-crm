import { useMemo } from 'react'
import { Zap, Check, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlan, PLAN_LIMITS } from '@/lib/usePlan'
import { useCRMResource } from '@/lib/hooks'
import { PageHeader } from '@/components/reusables/PageHeader'

const PLAN_FEATURES = PLAN_LIMITS

export function Billing() {
  const { plan, isTrialing, daysLeftInTrial, getLimit } = usePlan()

  const { data: leads } = useCRMResource('leads')
  const { data: contacts } = useCRMResource('contacts')
  const { data: deals } = useCRMResource('deals')
  const { data: projects } = useCRMResource('projects')
  const { data: users } = useCRMResource('app_users')

  const usage = useMemo(() => ({
    leads: { current: leads?.length ?? 0, limit: getLimit('leads') },
    contacts: { current: contacts?.length ?? 0, limit: getLimit('contacts') },
    deals: { current: deals?.length ?? 0, limit: getLimit('deals') },
    projects: { current: projects?.length ?? 0, limit: getLimit('projects') },
    seats: { current: users?.length ?? 0, limit: getLimit('seats') },
  }), [leads, contacts, deals, projects, users, getLimit])

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (limit === null) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    return 'bg-teal-600'
  }

  const formatUsage = (current: number, limit: number | null) => {
    if (limit === null) return `${current} / Unlimited`
    return `${current} / ${limit}`
  }

  const getPlanBadge = (planName: string) => {
    if (planName === 'free') return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Free</Badge>
    if (planName === 'pro') return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">Pro</Badge>
    return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">Enterprise</Badge>
  }

  const isCurrentPlan = (planName: string) => {
    if (isTrialing) return planName === 'pro'
    return planName === plan
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader
          category="SETTINGS"
          title="Billing & Plan"
          description="Manage your subscription and usage."
          className="px-0 bg-transparent border-none pb-2"
        />

        {/* Current Plan Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              <a href="#" className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                Manage Subscription
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {getPlanBadge(isTrialing ? 'pro' : plan)}
              {isTrialing && (
                <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
                  <Zap className="w-4 h-4" />
                  Trial ends in {daysLeftInTrial} days
                </div>
              )}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Seats used: {usage.seats.current} / {usage.seats.limit || 'Unlimited'}
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['leads', 'contacts', 'deals', 'projects', 'seats'] as const).map((resource) => {
              const { current, limit } = usage[resource]
              const percentage = getUsagePercentage(current, limit)
              return (
                <div key={resource} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{resource}</span>
                    <span className="text-slate-600 dark:text-slate-400">{formatUsage(current, limit)}</span>
                  </div>
                  {limit !== null && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getUsageColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Plan Comparison Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['free', 'pro', 'enterprise'] as const).map((planName) => {
                const features = PLAN_FEATURES[planName]
                const current = isCurrentPlan(planName)
                return (
                  <div
                    key={planName}
                    className={`border rounded-lg p-4 ${current ? 'border-teal-600' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize">{planName}</h3>
                      {current && <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">Current Plan</Badge>}
                    </div>
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {features.seats ?? 'Unlimited'} seats
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {features.leads ?? 'Unlimited'} leads
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {features.contacts ?? 'Unlimited'} contacts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {features.deals ?? 'Unlimited'} deals
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {features.projects ?? 'Unlimited'} projects
                      </li>
                      <li className="flex items-center gap-2">
                        {features.inventory ? <Check className="w-4 h-4 text-teal-600" /> : <span className="w-4 h-4 text-slate-400">-</span>}
                        Inventory module
                      </li>
                      <li className="flex items-center gap-2">
                        {features.procurement ? <Check className="w-4 h-4 text-teal-600" /> : <span className="w-4 h-4 text-slate-400">-</span>}
                        Procurement module
                      </li>
                      <li className="flex items-center gap-2">
                        {features.reports ? <Check className="w-4 h-4 text-teal-600" /> : <span className="w-4 h-4 text-slate-400">-</span>}
                        Reports
                      </li>
                      <li className="flex items-center gap-2">
                        {features.customRoles ? <Check className="w-4 h-4 text-teal-600" /> : <span className="w-4 h-4 text-slate-400">-</span>}
                        Custom roles
                      </li>
                    </ul>
                    {!current && (
                      <a href="#" className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-teal-200 transition hover:bg-teal-700 dark:shadow-none">
                        Upgrade
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}