import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Lead, ContactSource, DealStage } from "@/lib/types"
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/types"
import { formatCurrency } from "@/lib/helpers"
import { leadsApi } from "@/lib/api"
import { Check, UserPlus } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

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
      <DialogContent className="sm:max-w-[560px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Icon Section */}
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>

          {/* Text Section */}
          <DialogHeader className="p-0 text-left space-y-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Convert Lead
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Convert this lead into a contact and optionally create a deal.
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Section 1: Contact */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">Create Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conv-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Name</Label>
                  <Input id="conv-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conv-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</Label>
                  <Input id="conv-email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conv-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</Label>
                  <Input id="conv-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conv-company" className="text-xs font-bold text-slate-700 dark:text-slate-300">Company</Label>
                  <Input id="conv-company" value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conv-source" className="text-xs font-bold text-slate-700 dark:text-slate-300">Source</Label>
                <select
                  id="conv-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as ContactSource)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                >
                  {(Object.entries(SOURCE_LABELS) as [ContactSource, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Deal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Create Deal (optional)</h3>
                <button
                  type="button"
                  onClick={() => setCreateDeal(!createDeal)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${createDeal ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${createDeal ? "left-[26px]" : "left-1"}`} />
                </button>
              </div>
              {createDeal && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="conv-deal-title" className="text-xs font-bold text-slate-700 dark:text-slate-300">Deal Title</Label>
                    <Input id="conv-deal-title" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="conv-deal-value" className="text-xs font-bold text-slate-700 dark:text-slate-300">Value ($)</Label>
                      <Input id="conv-deal-value" type="number" min="0" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="10000" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conv-deal-stage" className="text-xs font-bold text-slate-700 dark:text-slate-300">Stage</Label>
                      <select
                        id="conv-deal-stage"
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value as DealStage)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-colors"
                      >
                        {(Object.entries(STAGE_LABELS) as [DealStage, string][]).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conv-deal-close" className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Close Date</Label>
                    <DatePicker
                      value={dealCloseDate}
                      onChange={setDealCloseDate}
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Summary */}
            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Conversion Summary</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Converting <strong>{lead.name}</strong> will:
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Create a contact record
              </div>
              {createDeal && dealValue && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Create a deal for {formatCurrency(Number(dealValue))}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Check className="w-3.5 h-3.5" /> Mark this lead as converted (read-only)
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleConvert}
              className="h-10 px-5 rounded-full text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition-all"
            >
              Convert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
