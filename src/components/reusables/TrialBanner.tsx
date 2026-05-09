import { Zap } from 'lucide-react'
import { Link } from 'wouter'
import { usePlan } from '@/lib/usePlan'

export function TrialBanner() {
  const { isTrialing, daysLeftInTrial } = usePlan()

  if (!isTrialing) return null

  return (
    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-3">
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