import type { Contact, Deal, Activity, Lead, Task, SalesOrder, Quote } from './types'

function getKey(userId: string, resource: string): string {
  return `crm_${userId}_${resource}`
}

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)
    if (!data) return defaultValue
    return JSON.parse(data) as T
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error)
    return defaultValue
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage for key "${key}":`, error)
    // Handle quota exceeded error or other potential issues
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Local storage quota exceeded. Some changes might not be saved.')
    }
  }
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export function getContacts(userId: string): Contact[] {
  return safeGetItem(getKey(userId, 'contacts'), [])
}

export function saveContacts(userId: string, contacts: Contact[]): void {
  safeSetItem(getKey(userId, 'contacts'), contacts)
}

// ── Deals ─────────────────────────────────────────────────────────────────────

export function getDeals(userId: string): Deal[] {
  return safeGetItem(getKey(userId, 'deals'), [])
}

export function saveDeals(userId: string, deals: Deal[]): void {
  safeSetItem(getKey(userId, 'deals'), deals)
}

// ── Activities ────────────────────────────────────────────────────────────────

export function getActivities(userId: string): Activity[] {
  return safeGetItem(getKey(userId, 'activities'), [])
}

export function saveActivities(userId: string, activities: Activity[]): void {
  safeSetItem(getKey(userId, 'activities'), activities)
}

// ── Follow-up dismissed state ─────────────────────────────────────────────────

export function getDismissedFollowUps(userId: string): string[] {
  return safeGetItem(getKey(userId, 'dismissed_followups'), [])
}

export function saveDismissedFollowUps(userId: string, contactIds: string[]): void {
  safeSetItem(getKey(userId, 'dismissed_followups'), contactIds)
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export function getLeads(userId: string): Lead[] {
  return safeGetItem(getKey(userId, 'leads'), [])
}

export function saveLeads(userId: string, leads: Lead[]): void {
  safeSetItem(getKey(userId, 'leads'), leads)
}

export function getLead(userId: string, id: string): Lead | undefined {
  return getLeads(userId).find(l => l.id === id)
}

export function createLead(userId: string, lead: Lead): Lead {
  const leads = getLeads(userId)
  leads.push(lead)
  saveLeads(userId, leads)
  return lead
}

export function updateLead(userId: string, id: string, updates: Partial<Lead>): Lead {
  const leads = getLeads(userId)
  const idx = leads.findIndex(l => l.id === id)
  if (idx === -1) throw new Error(`Lead ${id} not found`)
  leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() }
  saveLeads(userId, leads)
  return leads[idx]
}

export function deleteLead(userId: string, id: string): void {
  const leads = getLeads(userId).filter(l => l.id !== id)
  saveLeads(userId, leads)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function getTasks(userId: string): Task[] {
  return safeGetItem(getKey(userId, 'tasks'), [])
}

export function saveTasks(userId: string, tasks: Task[]): void {
  safeSetItem(getKey(userId, 'tasks'), tasks)
}

export function getOpenTasks(userId: string): Task[] {
  return getTasks(userId).filter(t => t.status !== 'completed')
}

export function getTask(userId: string, id: string): Task | undefined {
  return getTasks(userId).find(t => t.id === id)
}

export function createTask(userId: string, task: Task): Task {
  if (task.entityType && !task.entityId) {
    throw new Error('entityId is required if entityType is provided')
  }
  const tasks = getTasks(userId)
  tasks.push(task)
  saveTasks(userId, tasks)
  return task
}

export function updateTask(userId: string, id: string, updates: Partial<Task>): Task {
  const tasks = getTasks(userId)
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) throw new Error(`Task ${id} not found`)
  
  if (updates.entityType && !updates.entityId && !tasks[idx].entityId) {
    throw new Error('entityId is required if entityType is provided')
  }

  tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() }
  saveTasks(userId, tasks)
  return tasks[idx]
}

export function deleteTask(userId: string, id: string): void {
  const tasks = getTasks(userId).filter(t => t.id !== id)
  saveTasks(userId, tasks)
}

export function getTasksForEntity(userId: string, entityType: 'contact' | 'deal' | 'lead', entityId: string): Task[] {
  return getTasks(userId).filter(t => t.entityType === entityType && t.entityId === entityId)
}

// ── Sales Orders ─────────────────────────────────────────────────────────────

export function getOrders(userId: string): SalesOrder[] {
  return safeGetItem(getKey(userId, 'orders'), [])
}

export function saveOrders(userId: string, orders: SalesOrder[]): void {
  safeSetItem(getKey(userId, 'orders'), orders)
}

export function createOrder(userId: string, order: SalesOrder): SalesOrder {
  const orders = getOrders(userId)
  orders.push(order)
  saveOrders(userId, orders)
  return order
}// ── Quotes ───────────────────────────────────────────────────────────────────

export function getQuotes(userId: string): Quote[] {
  return safeGetItem(getKey(userId, 'quotes'), [])
}

export function saveQuotes(userId: string, quotes: Quote[]): void {
  safeSetItem(getKey(userId, 'quotes'), quotes)
}

export function createQuote(userId: string, quote: Quote): Quote {
  const quotes = getQuotes(userId)
  quotes.push(quote)
  saveQuotes(userId, quotes)
  return quote
}
