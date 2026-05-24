import { useAuth } from './AuthContext'
import { usePermission } from './usePermission'

export const PLAN_LIMITS = {
  free: {
    seats: 5,
    leads: 100,
    contacts: 100,
    deals: 50,
    projects: 3,
    inventory: false,
    procurement: false,
    reports: false,
    customRoles: false,
    customBranding: false,
  },
  pro: {
    seats: 10,
    leads: null, // unlimited
    contacts: null,
    deals: null,
    projects: null,
    inventory: true,
    procurement: true,
    reports: true,
    customRoles: false,
    customBranding: true,
  },
  enterprise: {
    seats: null, // unlimited
    leads: null,
    contacts: null,
    deals: null,
    projects: null,
    inventory: true,
    procurement: true,
    reports: true,
    customRoles: true,
    customBranding: true,
  },
} as const

export function usePlan() {
  const { plan: rawPlan, trialEndsAt } = useAuth()
  const { isSuperAdmin, isLoaded: permLoaded } = usePermission()

  const plan = rawPlan ?? 'free'
  const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false
  const effectivePlan = isTrialing ? 'pro' : plan
  const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

  const daysLeftInTrial = isTrialing
    ? Math.ceil((new Date(trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const canAccess = (feature: 'inventory' | 'procurement' | 'reports' | 'customRoles' | 'customBranding'): boolean => {
    if (isSuperAdmin) return true
    return limits[feature] === true
  }

  const isAtLimit = (resource: 'leads' | 'contacts' | 'deals' | 'projects' | 'seats', currentCount: number): boolean => {
    if (isSuperAdmin) return false
    const limit = limits[resource]
    if (limit === null) return false // unlimited
    return currentCount >= limit
  }

  const getLimit = (resource: 'leads' | 'contacts' | 'deals' | 'projects' | 'seats'): number | null => {
    return limits[resource]
  }

  const isPro = plan === 'pro' || plan === 'enterprise' || isTrialing
  const isEnterprise = plan === 'enterprise'

  return {
    plan,
    isTrialing,
    trialEndsAt,
    daysLeftInTrial,
    canAccess,
    isAtLimit,
    getLimit,
    isPro,
    isEnterprise,
    isSuperAdmin,
    isLoaded: permLoaded,
  }
}