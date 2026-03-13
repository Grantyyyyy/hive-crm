// ── ID generation ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID()
}

// ── Relative time ─────────────────────────────────────────────────────────────

export function relativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
  return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
}

// ── Date math ─────────────────────────────────────────────────────────────────

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysSince(dateString: string): number {
  return daysBetween(dateString, new Date().toISOString())
}

// ── Currency ──────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ── Relationship strength ─────────────────────────────────────────────────────

export function calculateRelationshipScore(
  activityCount: number,
  lastActivityDate: string | null,
  hasActiveDeals: boolean
): number {
  let score = 0

  // Activity count contribution (max 40 points)
  score += Math.min(activityCount * 8, 40)

  // Recency contribution (max 40 points)
  if (lastActivityDate) {
    const days = daysSince(lastActivityDate)
    if (days <= 1) score += 40
    else if (days <= 3) score += 35
    else if (days <= 7) score += 25
    else if (days <= 14) score += 15
    else if (days <= 30) score += 5
  }

  // Active deals contribution (20 points)
  if (hasActiveDeals) score += 20

  return Math.min(score, 100)
}

export type RelationshipLabel = 'Cold' | 'Warm' | 'Hot'

export function getRelationshipLabel(score: number): RelationshipLabel {
  if (score >= 66) return 'Hot'
  if (score >= 33) return 'Warm'
  return 'Cold'
}

export function getRelationshipColor(label: RelationshipLabel): string {
  switch (label) {
    case 'Hot': return 'bg-red-500'
    case 'Warm': return 'bg-amber-500'
    case 'Cold': return 'bg-blue-400'
  }
}

export function getRelationshipTextColor(label: RelationshipLabel): string {
  switch (label) {
    case 'Hot': return 'text-red-600'
    case 'Warm': return 'text-amber-600'
    case 'Cold': return 'text-blue-500'
  }
}

// ── Deal health ───────────────────────────────────────────────────────────────

export type DealHealth = 'green' | 'amber' | 'red'

export function getDealHealth(lastActivityDate: string | null): DealHealth {
  if (!lastActivityDate) return 'red'
  const days = daysSince(lastActivityDate)
  if (days > 14) return 'red'
  if (days >= 7) return 'amber'
  return 'green'
}

export function getDealHealthColor(health: DealHealth): string {
  switch (health) {
    case 'green': return 'bg-green-500'
    case 'amber': return 'bg-amber-500'
    case 'red': return 'bg-red-500'
  }
}

export function getDealHealthLabel(health: DealHealth): string {
  switch (health) {
    case 'green': return 'Healthy — recent activity'
    case 'amber': return 'Needs attention — 7-14 days since last activity'
    case 'red': return 'At risk — over 14 days since last activity'
  }
}
