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

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface TaskSubtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  completedAt?: string
  completedBy?: string
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  createdAt: string
  updatedAt?: string
}

export interface TaskActivity {
  id: string
  taskId: string
  type: 'created' | 'updated' | 'completed' | 'reopened' | 'assigned' | 'comment' | 'attachment'
  description: string
  userId: string
  userName: string
  userAvatar?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface TaskTag {
  id: string
  name: string
  color: string
  ownerId?: string
  createdAt?: string
}

export interface TaskTagLink {
  id: string
  taskId: string
  tagId: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  dueDate: string
  remindAt?: string
  reminderSent?: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'completed'
  ownerId: string
  assignedTo?: string[]  // Team member IDs
  createdBy: string
  entityType?: 'contact' | 'deal' | 'lead'
  entityId?: string
  contactId?: string
  dealId?: string
  leadId?: string
  projectId?: string
  completedAt?: string
  // Recurrence fields
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  recurrenceInterval?: number  // Every X days/weeks/months (default 1)
  recurrenceEndDate?: string
  parentTaskId?: string  // Link to parent recurring task
  nextOccurrence?: string
  // New fields
  subtasks?: TaskSubtask[]
  comments?: TaskComment[]
  activities?: TaskActivity[]
  tags?: string[]  // Array of tag IDs
  estimatedHours?: number
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
  import: 'bg-teal-100 text-teal-700 border-teal-200',
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

export type SalesOrderStatus = 'draft' | 'pending' | 'shipped' | 'delivered' | 'cancelled'

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
  stockReserved?: boolean      // indicates if this order is holding a reservation
  createdAt: string
  updatedAt: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected'

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
  stockReserved?: boolean      // indicates if this quote is holding a reservation
  createdAt: string
  updatedAt: string
}

export type InventoryStatus = 'active' | 'draft'
export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'

export type VendorStatus = 'active' | 'inactive' | 'on_hold'

export interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  website?: string
  address?: string
  category?: string
  taxId?: string
  paymentTerms?: string
  status: VendorStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  sku: string
  category: string
  price: number
  stockQuantity: number
  reservedQuantity: number
  stockLevel: StockLevel
  status: InventoryStatus
  imageUrl?: string
  reorderThreshold?: number
  reorderQuantity?: number
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
    inventoryItemId?: string
    trackInInventory?: boolean
  }>
  referenceId?: string         // reference back to source PurchaseRequest
  shippingInfo?: string
  internalNotes?: string
  vendorInstructions?: string
  stockReceived?: boolean      // prevents double-receipt
  createdAt: string
  updatedAt: string
}

export type PurchaseRequestStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'ordered'

export interface PurchaseRequestItem {
  id: string
  name: string
  description?: string
  quantity: number
  estimatedPrice: number
  inventoryItemId?: string
  vendorId?: string
  vendorName?: string
  trackInInventory?: boolean
}

export interface PurchaseRequest {
  id: string
  requestNumber: string
  requesterId: string
  requesterName: string
  amount: number
  status: PurchaseRequestStatus
  date: string
  department: string
  items: PurchaseRequestItem[]

  justification: string
  urgent: boolean
  purpose?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
}

export type InventoryTransactionType = 'receipt' | 'shipment' | 'adjustment' | 'reservation' | 'release' | 'return'

export type InventoryTransactionSource = 'purchase_order' | 'sales_order' | 'quote' | 'manual' | 'system'

export interface InventoryTransaction {
  id: string
  inventoryItemId: string
  inventoryItemName: string
  type: InventoryTransactionType
  quantityChange: number      // + for in, - for out
  quantityBefore: number      // stockQuantity before change
  quantityAfter: number       // stockQuantity after change
  reservedChange?: number     // change in reserved quantity (optional)
  reservedBefore?: number
  reservedAfter?: number
  reason?: string             // human-readable reason
  referenceType: InventoryTransactionSource
  referenceId?: string        // PO ID, Order ID, etc.
  referenceNumber?: string    // PO Number, Order Number, etc.
  userId: string
  userName: string
  createdAt: string
}
