import { useState } from "react"
import { 
  DollarSign, 
  Target, 
  User, 
  ChevronDown,
  PlusCircle,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import type { Deal, Contact, DealStage } from "@/lib/types"
import { STAGE_LABELS } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface DealFormProps {
  onSave: (deal: Deal) => void
  onCancel: () => void
  contacts: Contact[]
  initialData?: Partial<Deal>
}

export function DealForm({ onSave, onCancel, contacts, initialData }: DealFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [contactId, setContactId] = useState(initialData?.contactId ?? "")
  const [value, setValue] = useState(initialData?.value?.toString() ?? "")
  const [stage, setStage] = useState<DealStage>(initialData?.stage ?? "discovery")
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initialData?.expectedCloseDate
      ? new Date(initialData.expectedCloseDate).toISOString().split("T")[0]
      : ""
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Deal title is required"
    if (!contactId) newErrors.contactId = "Contact is required"
    if (!value || isNaN(Number(value)) || Number(value) <= 0)
      newErrors.value = "Enter a valid positive amount"
    if (!expectedCloseDate)
      newErrors.expectedCloseDate = "Expected close date is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const now = new Date().toISOString()
    onSave({
      id: initialData?.id ?? generateId(),
      title: title.trim(),
      contactId,
      value: Number(value),
      stage,
      expectedCloseDate: new Date(expectedCloseDate).toISOString(),
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        
        <div className="grid grid-cols-1 gap-y-6">
          {/* Section 1: Deal Overview */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deal Overview</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deal Title</Label>
                <div className="group relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 License Renewal"
                    className={cn(
                      "h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                      errors.title && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                </div>
                {errors.title && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Associated Contact</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-focus-within:text-teal-600 transition-colors" />
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className={cn(
                      "w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm",
                      errors.contactId && "border-red-500"
                    )}
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.contactId && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.contactId}</p>}
              </div>
            </div>
          </section>

          {/* Section 2: Financials & Timing */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-sky-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value & Timing</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deal Value ($)</Label>
                <div className="group relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="25000"
                    className={cn(
                      "h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                      errors.value && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                </div>
                {errors.value && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.value}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Close</Label>
                <DatePicker
                  value={expectedCloseDate}
                  onChange={setExpectedCloseDate}
                  className={cn(
                    "h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                    errors.expectedCloseDate && "border-red-500"
                  )}
                />
                {errors.expectedCloseDate && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.expectedCloseDate}</p>}
              </div>
            </div>
          </section>

          {/* Section 3: Status */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pipeline Status</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Stage</Label>
              <div className="relative group">
                <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-focus-within:text-teal-600 transition-colors" />
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as DealStage)}
                  className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                >
                  {(Object.entries(STAGE_LABELS) as [DealStage, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-9 px-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-[10px] font-black uppercase tracking-widest"
        >
          {initialData?.id ? 'Save Changes' : (
            <>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Deal
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
