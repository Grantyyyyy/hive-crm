import type { Contact, Deal, Activity } from './types'

function getKey(userId: string, resource: string): string {
  return `crm_${userId}_${resource}`
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export function getContacts(userId: string): Contact[] {
  const data = localStorage.getItem(getKey(userId, 'contacts'))
  return data ? JSON.parse(data) as Contact[] : []
}

export function saveContacts(userId: string, contacts: Contact[]): void {
  localStorage.setItem(getKey(userId, 'contacts'), JSON.stringify(contacts))
}

// ── Deals ─────────────────────────────────────────────────────────────────────

export function getDeals(userId: string): Deal[] {
  const data = localStorage.getItem(getKey(userId, 'deals'))
  return data ? JSON.parse(data) as Deal[] : []
}

export function saveDeals(userId: string, deals: Deal[]): void {
  localStorage.setItem(getKey(userId, 'deals'), JSON.stringify(deals))
}

// ── Activities ────────────────────────────────────────────────────────────────

export function getActivities(userId: string): Activity[] {
  const data = localStorage.getItem(getKey(userId, 'activities'))
  return data ? JSON.parse(data) as Activity[] : []
}

export function saveActivities(userId: string, activities: Activity[]): void {
  localStorage.setItem(getKey(userId, 'activities'), JSON.stringify(activities))
}

// ── Follow-up dismissed state ─────────────────────────────────────────────────

export function getDismissedFollowUps(userId: string): string[] {
  const data = localStorage.getItem(getKey(userId, 'dismissed_followups'))
  return data ? JSON.parse(data) as string[] : []
}

export function saveDismissedFollowUps(userId: string, contactIds: string[]): void {
  localStorage.setItem(getKey(userId, 'dismissed_followups'), JSON.stringify(contactIds))
}
