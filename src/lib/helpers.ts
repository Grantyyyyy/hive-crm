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

export function getDealHealth(
  lastActivityDate: string | null, 
  createdAt?: string,
  expectedCloseDate?: string | null,
  updatedAt?: string | null
): DealHealth {
  // treating creation as activity if none exists
  const lastInteraction = lastActivityDate || createdAt || new Date().toISOString()
  const inactiveDays = daysSince(lastInteraction)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const isOverdue = expectedCloseDate && new Date(expectedCloseDate).getTime() < today.getTime()
  
  // AT RISK (RED)
  // - No activity > 14 days
  // - OR past expected close date
  if (inactiveDays > 14 || isOverdue) return 'red'
  
  // NEEDS ATTENTION (AMBER)
  // - No activity in 7-14 days
  // - OR hasn't been updated in 7 days (stalled)
  const isStalled = updatedAt && daysSince(updatedAt) >= 7
  if (inactiveDays >= 7 || isStalled) return 'amber'
  
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

// ── Lead score ────────────────────────────────────────────────────────────────

import type { Lead } from './types'

export function calculateLeadScore(lead: Lead): number {
  let score = 0

  // Field completeness
  if (lead.email) score += 20
  if (lead.phone) score += 10
  if (lead.company) score += 15

  // Source bonus
  const sourceScores: Record<string, number> = {
    referral: 20,
    website: 15,
    ad: 10,
    'cold-outreach': 5,
    manual: 5,
    import: 5,
  }
  score += sourceScores[lead.source] ?? 0

  // Status bonus
  const statusScores: Record<string, number> = {
    contacted: 10,
    qualified: 20,
    unqualified: -10,
    converted: 30,
  }
  score += statusScores[lead.status] ?? 0

  return Math.max(0, Math.min(100, score))
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

import type { Task } from './types'

export function isOverdue(task: Task): boolean {
  if (task.status === 'completed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(task.dueDate).getTime() < today.getTime()
}

export function getTasksDueSoon(tasks: Task[], days: number): Task[] {
  const now = new Date()
  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + days)

  return tasks.filter(t =>
    t.status !== 'completed' &&
    new Date(t.dueDate).getTime() <= targetDate.getTime()
  )
}

export function priorityWeight(priority: Task['priority']): number {
  switch (priority) {
    case 'urgent': return 4
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
    default: return 0
  }
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. status != completed
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    // if both are completed, sort them by completion date descending
    if (a.status === 'completed' && b.status === 'completed') {
      return new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()
    }

    const aOverdue = isOverdue(a)
    const bOverdue = isOverdue(b)

    // 2. overdue tasks
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // 3. priority desc
    const pA = priorityWeight(a.priority)
    const pB = priorityWeight(b.priority)
    if (pA !== pB) return pB - pA

    // 4. dueDate asc
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: string; header: string }>,
  filename: string
): void {
  // Create CSV header
  const headers = columns.map(col => col.header).join(',')

  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      // Handle null/undefined
      if (value === null || value === undefined) return '""'
      // Convert to string and escape quotes
      const stringValue = String(value)
      const escaped = stringValue.replace(/"/g, '""')
      // Wrap in quotes if contains comma, quote, or newline
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`
      }
      return escaped
    }).join(',')
  })

  // Combine header and rows
  const csv = [headers, ...rows].join('\n')

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Debounce ──────────────────────────────────────────────────────────────────

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// ── User Display Helpers ──────────────────────────────────────────────────────

/**
 * Returns the current user's display initials.
 * Uses firstName + lastName initials, or first 2 chars of username, or "?" as fallback.
 */
export function getUserInitials(user: {
  user_metadata?: { full_name?: string; user_name?: string };
  email?: string | null;
} | null | undefined): string {
  if (!user) return "?";

  const meta = user.user_metadata;
  if (meta?.full_name) {
    const parts = meta.full_name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  }

  if (meta?.user_name) {
    return meta.user_name.slice(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return "?";
}
