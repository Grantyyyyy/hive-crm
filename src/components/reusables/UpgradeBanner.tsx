import { useState, useEffect } from 'react'
import { Zap, X } from 'lucide-react'
import { Link } from 'wouter'
import { usePlan } from '@/lib/usePlan'

interface UpgradeBannerProps {
  feature: string
  description?: string
  storageKey: string
}

export function UpgradeBanner({ feature, description, storageKey }: UpgradeBannerProps) {
  const { plan, isTrialing } = usePlan()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'true') setDismissed(true)
  }, [storageKey])

  if (plan !== 'free' || isTrialing || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Zap className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
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
        <Link href="/settings/billing" className="text-xs font-bold text-amber-700 underline whitespace-nowrap">
          Upgrade to Pro
        </Link>
      </div>
    </div>
  )
}