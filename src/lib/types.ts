export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: ContactSource
  createdAt: string
}

export interface Deal {
  id: string
  title: string
  contactId: string
  value: number
  stage: DealStage
  expectedCloseDate: string
  lostReason?: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  contactId: string
  dealId?: string
  leadId?: string
  type: ActivityType
  content: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  source: LeadSource
  status: LeadStatus
  score: number
  ownerId: string
  notes?: string
  convertedAt?: string
  convertedToContactId?: string
  convertedToDealId?: string
  createdAt: string
  updatedAt: string
}

export interface LeadConversion {
  leadId: string
  contact: Omit<Contact, 'id' | 'createdAt'>
  deal?: Omit<Deal, 'id' | 'contactId' | 'createdAt' | 'updatedAt'>
  convertedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  dueDate: string           // ISO date string
  remindAt?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'completed'
  ownerId: string           // Clerk userId
  createdBy: string         // Clerk userId
  entityType?: 'contact' | 'deal' | 'lead'
  entityId?: string         // id of the linked entity
  completedAt?: string      // ISO timestamp
  createdAt: string
  updatedAt: string
}

export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'call' | 'email' | 'note' | 'meeting'
export type ContactSource = 'manual' | 'referral' | 'ad' | 'import'
export type LeadSource = 'manual' | 'referral' | 'ad' | 'import' | 'website' | 'cold-outreach' | 'email'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'

export const DEAL_STAGES: DealStage[] = ['discovery', 'proposal', 'negotiation', 'won', 'lost']
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'unqualified', 'converted']

export const STAGE_LABELS: Record<DealStage, string> = {
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export const STAGE_COLORS: Record<DealStage, string> = {
  discovery: 'bg-blue-100 text-blue-800 border-blue-200',
  proposal: 'bg-purple-100 text-purple-800 border-purple-200',
  negotiation: 'bg-amber-100 text-amber-800 border-amber-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
}

export const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'note', 'meeting']

export const SOURCE_LABELS: Record<ContactSource, string> = {
  manual: 'Manual',
  referral: 'Referral',
  ad: 'Ad',
  import: 'Import',
}

export const SOURCE_COLORS: Record<ContactSource, string> = {
  manual: 'bg-slate-100 text-slate-700 border-slate-200',
  referral: 'bg-teal-100 text-teal-700 border-teal-200',
  ad: 'bg-orange-100 text-orange-700 border-orange-200',
  import: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manual',
  referral: 'Referral',
  ad: 'Ad',
  import: 'Import',
  website: 'Website',
  'cold-outreach': 'Cold Outreach',
  email: 'Email',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
  converted: 'Converted',
}

export type SalesOrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  totalValue: number
  status: SalesOrderStatus
  orderDate: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  createdAt: string
  updatedAt: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired'

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  amount: number
  status: QuoteStatus
  date: string
  validUntil?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  terms?: string
  createdAt: string
  updatedAt: string
}

export type InventoryStatus = 'active' | 'draft'
export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stockQuantity: number
  stockLevel: StockLevel
  status: InventoryStatus
  imageUrl?: string
  createdAt: string
  updatedAt: string
}
