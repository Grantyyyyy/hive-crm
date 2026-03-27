export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  source: ContactSource
  status?: 'lead' | 'prospect' | 'customer' | 'churned'
  notes?: string
  ownerId?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateContactInput = Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>

export interface Deal {
  id: string
  title: string
  contactId: string
  contact?: Contact
  value: number
  stage: DealStage
  expectedCloseDate?: string
  lostReason?: string
  ownerId?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateDealInput = Omit<Deal, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'contact'>

export interface Activity {
  id: string
  contactId?: string
  contact?: Contact
  dealId?: string
  deal?: Deal
  leadId?: string
  lead?: Lead
  type: ActivityType
  content: string
  ownerId?: string
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
  dueDate: string
  remindAt?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'completed'
  ownerId: string
  createdBy: string
  entityType?: 'contact' | 'deal' | 'lead'
  entityId?: string
  contactId?: string
  dealId?: string
  leadId?: string
  completedAt?: string
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

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  inventoryItemId?: string    // link to InventoryItem.id for stock deduction
}

export interface SalesOrder {
  id: string
  orderNumber: string
  quoteId?: string
  customerId: string
  customerName: string
  totalValue: number
  currency: string
  status: SalesOrderStatus
  orderDate: string
  items: OrderItem[]
  stockDeducted?: boolean      // guards against double-deduction on re-ship
  createdAt: string
  updatedAt: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired'

export interface QuoteItem {
  id: string
  name: string
  description: string
  quantity: number
  price: number
  inventoryItemId?: string    // link to InventoryItem.id if sourced from catalog
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  amount: number
  currency: string
  status: QuoteStatus
  date: string
  validUntil?: string
  items: QuoteItem[]
  terms?: string
  reminderSent?: boolean
  createdAt: string
  updatedAt: string
}

export type InventoryStatus = 'active' | 'draft'
export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface InventoryItem {
  id: string
  name: string
  description?: string
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

export type PurchaseOrderStatus = 'draft' | 'pending' | 'sent' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendorName: string
  amount: number
  status: PurchaseOrderStatus
  date: string
  expectedDelivery?: string
  items: Array<{
    id: string
    name: string
    description?: string
    quantity: number
    price: number
    inventoryItemId: string
  }>
  purchaseRequestId?: string  // reference back to source PurchaseRequest
  referenceId?: string
  shippingInfo?: string
  internalNotes?: string
  vendorInstructions?: string
  createdAt: string
  updatedAt: string
}

export type PurchaseRequestStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'ordered'

export interface PurchaseRequest {
  id: string
  requestNumber: string
  requesterId: string
  requesterName: string
  amount: number
  status: PurchaseRequestStatus
  date: string
  department: string
  items: Array<{
    id: string
    name: string
    description?: string
    quantity: number
    estimatedPrice: number
    inventoryItemId: string
  }>
  inventoryItemId: string
  inventoryItemName: string
  requestedQuantity: number
  estimatedPrice: number
  justification: string
  urgent: boolean             // true when triggered by out_of_stock
  purpose?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
}
