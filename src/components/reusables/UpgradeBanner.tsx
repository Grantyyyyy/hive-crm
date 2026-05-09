import { Zap } from 'lucide-react'
import { Link } from 'wouter'
import { usePlan } from '@/lib/usePlan'

interface UpgradeBannerProps {
  feature: string
  description?: string
}

export function UpgradeBanner({ feature, description }: UpgradeBannerProps) {
  const { plan, isTrialing } = usePlan()
  if (plan !== 'free' || isTrialing) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
      <div className="flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-700">
            {feature} is available on the Pro plan.
          </p>
          {description && (
            <p className="text-xs text-amber-600 mt-1">
              {description}
            </p>
          )}
        </div>
        <Link href="/settings/billing" className="text-xs font-bold text-amber-700 underline">
          Upgrade to Pro
        </Link>
      </div>
    </div>
  )
}