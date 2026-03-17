import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Lead, ContactSource, DealStage } from "@/lib/types"
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/types"
import { generateId, formatCurrency } from "@/lib/helpers"
import {
  getContacts,
  saveContacts,
  getDeals,
  saveDeals,
  updateLead,
} from "@/lib/storage"
import { calculateLeadScore } from "@/lib/helpers"
import { Check } from "lucide-react"

interface ConvertLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  userId: string
  onConverted: (contactId: string) => void
}

export function ConvertLeadModal({ open, onOpenChange, lead, userId, onConverted }: ConvertLeadModalProps) {
  // Contact fields (pre-filled)
  const [name, setName] = useState(lead.name)
  const [email, setEmail] = useState(lead.email)
  const [phone, setPhone] = useState(lead.phone ?? "")
  const [company, setCompany] = useState(lead.company ?? "")
  const [source, setSource] = useState<ContactSource>(
    (["manual", "referral", "ad", "import"] as ContactSource[]).includes(lead.source as ContactSource)
      ? (lead.source as ContactSource)
      : "manual"
  )

  // Deal fields
  const [createDeal, setCreateDeal] = useState(false)
  const [dealTitle, setDealTitle] = useState(`Deal - ${lead.company || lead.name}`)
  const [dealValue, setDealValue] = useState("")
  const [dealStage, setDealStage] = useState<DealStage>("discovery")
  const [dealCloseDate, setDealCloseDate] = useState("")

  function handleConvert() {
    const now = new Date().toISOString()
    const contactId = generateId()

    // 1. Create Contact
    const contacts = getContacts(userId)
    contacts.push({
      id: contactId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      source,
      createdAt: now,
    })
    saveContacts(userId, contacts)

    // 2. Optionally create Deal
    let dealId: string | undefined
    if (createDeal && dealValue && dealCloseDate) {
      dealId = generateId()
      const deals = getDeals(userId)
      deals.push({
        id: dealId,
        title: dealTitle.trim(),
        contactId,
        value: Number(dealValue),
        stage: dealStage,
        expectedCloseDate: new Date(dealCloseDate).toISOString(),
        createdAt: now,
        updatedAt: now,
      })
      saveDeals(userId, deals)
    }

    // 3. Update Lead
    const updatedLead = updateLead(userId, lead.id, {
      status: "converted",
      convertedAt: now,
      convertedToContactId: contactId,
      convertedToDealId: dealId,
    })
    // 4. Recalculate score
    updateLead(userId, lead.id, { score: calculateLeadScore({ ...updatedLead, status: "converted" }) })

    // 5. Close and navigate
    onOpenChange(false)
    onConverted(contactId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-[var(--bg-surface)] border-[var(--border)] rounded-none shadow-none text-[var(--text-primary)] font-mono sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[14px] font-serif font-normal">Convert Lead</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-6">
          {/* Section 1: Contact */}
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border)] pb-2">Create Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="conv-name" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Name</Label>
                <Input id="conv-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="conv-email" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Email</Label>
                <Input id="conv-email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="conv-phone" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Phone</Label>
                <Input id="conv-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="conv-company" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Company</Label>
                <Input id="conv-company" value={company} onChange={(e) => setCompany(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="conv-source" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Source</Label>
              <select
                id="conv-source"
                value={source}
                onChange={(e) => setSource(e.target.value as ContactSource)}
                className="flex h-9 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[13px] text-[var(--text-primary)] shadow-none focus-visible:outline-none focus-visible:border-[var(--accent)] transition-colors"
              >
                {(Object.entries(SOURCE_LABELS) as [ContactSource, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Deal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Create Deal (optional)</h3>
              <button
                type="button"
                onClick={() => setCreateDeal(!createDeal)}
                className={`w-10 h-5 rounded-full relative transition-colors ${createDeal ? "bg-[var(--accent)]" : "bg-[var(--bg-elevated)] border border-[var(--border)]"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${createDeal ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {createDeal && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="conv-deal-title" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Deal Title</Label>
                  <Input id="conv-deal-title" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="conv-deal-value" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Value ($)</Label>
                    <Input id="conv-deal-value" type="number" min="0" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="10000" className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)]" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="conv-deal-stage" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Stage</Label>
                    <select
                      id="conv-deal-stage"
                      value={dealStage}
                      onChange={(e) => setDealStage(e.target.value as DealStage)}
                      className="flex h-9 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[13px] text-[var(--text-primary)] shadow-none focus-visible:outline-none focus-visible:border-[var(--accent)] transition-colors"
                    >
                      {(Object.entries(STAGE_LABELS) as [DealStage, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="conv-deal-close" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Expected Close Date</Label>
                  <Input id="conv-deal-close" type="date" value={dealCloseDate} onChange={(e) => setDealCloseDate(e.target.value)} className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-9 bg-[var(--bg-elevated)] text-[var(--text-secondary)]" />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Summary */}
          <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">Conversion Summary</div>
            <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">
              Converting <strong>{lead.name}</strong> will:
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--green)]">
              <Check className="w-3.5 h-3.5" /> Create a contact record
            </div>
            {createDeal && dealValue && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--green)]">
                <Check className="w-3.5 h-3.5" /> Create a deal for {formatCurrency(Number(dealValue))}
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              <Check className="w-3.5 h-3.5" /> Mark this lead as converted (read-only)
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-none border border-[var(--border)] bg-transparent text-[var(--text-secondary)] h-10 text-[12px] uppercase tracking-[0.08em] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all font-mono shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConvert}
              className="flex-1 rounded-none border-none bg-[var(--accent)] text-white h-10 text-[12px] uppercase tracking-[0.08em] hover:opacity-85 transition-opacity font-mono shadow-none"
            >
              Convert
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
