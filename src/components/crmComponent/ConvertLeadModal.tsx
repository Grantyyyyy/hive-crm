import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormActions } from "@/components/reusables/form-actions"
import type { Lead, ContactSource, DealStage } from "@/lib/types"
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/types"
import { formatCurrency } from "@/lib/helpers"
import { leadsApi } from "@/lib/api"
import { Check, UserPlus } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { logger } from "@/lib/logger"
import { useCRMContext } from "@/lib/CRMContext"


interface ConvertLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  onConverted: (contactId: string) => void
}

export function ConvertLeadModal({ open, onOpenChange, lead, onConverted }: ConvertLeadModalProps) {
  const ctx = useCRMContext()
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
        // Log lead conversion audit
        await ctx.insertAuditLog({
          entity_type: 'leads',
          entity_id: lead.id,
          action: 'CONVERT',
          diff: { updates: { status: 'converted', contactId: response.data.contact.id, dealId: response.data.deal?.id } }
        })

        // Log contact creation
        await ctx.insertAuditLog({
          entity_type: 'contacts',
          entity_id: response.data.contact.id,
          action: 'INSERT',
          diff: { new: response.data.contact }
        })

        // Log deal creation if created
        if (response.data.deal?.id) {
          await ctx.insertAuditLog({
            entity_type: 'deals',
            entity_id: response.data.deal.id,
            action: 'INSERT',
            diff: { new: response.data.deal }
          })
        }

        onOpenChange(false)
        onConverted(response.data.contact.id)
      }
    } catch (error) {
      logger.error('Error converting lead:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Convert Lead
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                Transform this prospect into a contact and active opportunity.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

          <div className="grid grid-cols-1 gap-y-6">
            {/* Section 1: Contact Creation */}
            <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Relationship Profile</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead Source</Label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  >
                    {(Object.entries(SOURCE_LABELS) as [string, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Deal Configuration */}
            <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-sky-500 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deal Strategy (Optional)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateDeal(!createDeal)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${createDeal ? "bg-teal-600 shadow-lg shadow-teal-600/20" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${createDeal ? "left-[26px]" : "left-1"}`} />
                </button>
              </div>

              {createDeal && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deal Title</Label>
                    <Input value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value ($)</Label>
                      <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Stage</Label>
                      <select
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value as DealStage)}
                        className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                      >
                        {(Object.entries(STAGE_LABELS) as [DealStage, string][]).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Close Date</Label>
                    <DatePicker value={dealCloseDate} onChange={setDealCloseDate} className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100" />
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: Summary */}
            <div className="border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Conversion Workflow</h3>
              </div>
              <div className="space-y-1.5 pl-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <div className="w-1 h-1 rounded-full bg-teal-500" /> Create primary contact record
                </div>
                {createDeal && dealValue && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="w-1 h-1 rounded-full bg-teal-500" /> Initialize pipeline deal for {formatCurrency(Number(dealValue))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                  <div className="w-1 h-1 rounded-full bg-slate-300" /> Archive lead as 'Converted'
                </div>
              </div>
            </div>
          </div>
        </div>

        <FormActions
          cancel={{ label: "Cancel", onClick: () => onOpenChange(false) }}
          primary={{ label: "Confirm Conversion", onClick: handleConvert }}
        />
      </DialogContent>
    </Dialog>
  )
}
