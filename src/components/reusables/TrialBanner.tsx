import { Zap, FlaskConical } from 'lucide-react'
import { Link } from 'wouter'
import { usePlan } from '@/lib/usePlan'
import { useAuth } from '@/lib/AuthContext'

export function TrialBanner() {
  const { isTrialing, daysLeftInTrial } = usePlan()
  const { isDemo } = useAuth()

  // Demo workspaces are time-boxed sandboxes, not trials.
  if (isDemo) {
    return (
      <div className="mx-4 mt-4 mb-2 md:mx-8 md:mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            You're exploring a demo workspace — your data resets within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  if (!isTrialing) return null

  return (
    <div className="mx-4 mt-4 mb-2 md:mx-8 md:mt-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-teal-600" />
          <p className="text-sm font-semibold text-teal-700">
            You are on a free trial — {daysLeftInTrial} days remaining.
          </p>
        </div>
        <Link href="/settings/billing" className="text-xs font-bold text-teal-700 underline">
          Upgrade now
        </Link>
      </div>
    </div>
  )
}
