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
  type: ActivityType
  content: string
  createdAt: string
}

export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'call' | 'email' | 'note' | 'meeting'
export type ContactSource = 'manual' | 'referral' | 'ad' | 'import'

export const DEAL_STAGES: DealStage[] = ['discovery', 'proposal', 'negotiation', 'won', 'lost']

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
