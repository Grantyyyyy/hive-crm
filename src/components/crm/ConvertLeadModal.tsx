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
import { formatCurrency } from "@/lib/helpers"
import { leadsApi } from "@/lib/api"
import { Check } from "lucide-react"

interface ConvertLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  onConverted: (contactId: string) => void
}

export function ConvertLeadModal({ open, onOpenChange, lead, onConverted }: ConvertLeadModalProps) {
  const [name, setName] = useState(lead.name)
  const [email, setEmail] = useState(lead.email)
  const [phone, setPhone] = useState(lead.phone ?? "")
  const [company, setCompany] = useState(lead.company ?? "")
  const [source, setSource] = useState<ContactSource>(
    (["manual", "referral", "ad", "import"] as ContactSource[]).includes(lead.source as ContactSource)
      ? (lead.source as ContactSource)
      : "manual"
  )

  const [createDeal, setCreateDeal] = useState(false)
  const [dealTitle, setDealTitle] = useState(`Deal - ${lead.company || lead.name}`)
  const [dealValue, setDealValue] = useState("")
  const [dealStage, setDealStage] = useState<DealStage>("discovery")
  const [dealCloseDate, setDealCloseDate] = useState("")

  async function handleConvert() {
    try {
      const response = await leadsApi.convert(lead.id, {
        contactData: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          source: source.toUpperCase(),
        },
        dealData: createDeal && dealValue && dealCloseDate ? {
          title: dealTitle.trim(),
          value: Number(dealValue),
        } : undefined,
      })
      
      if (response.success && response.data?.contact?.id) {
        onOpenChange(false)
        onConverted(response.data.contact.id)
      }
    } catch (error) {
      console.error('Error converting lead:', error)
    }
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
              variant="outlineNeutral"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleConvert}
              className="flex-1"
            >
              Convert
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
