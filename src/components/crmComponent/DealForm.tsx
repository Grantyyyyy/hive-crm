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

  const inputClass = "h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-all shadow-sm text-slate-900 dark:text-white"
  const labelClass = "text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="animate-content-in duration-700 ease-out">
          {/* Deal Title */}
          <div className="space-y-1.5">
            <Label className={labelClass}>Deal Title</Label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Software License"
                className={cn(inputClass, "pl-11", errors.title && "border-red-500")}
              />
            </div>
          </div>
        </div>

        {/* Contact Selection */}
        <div className="space-y-1.5 animate-content-in [animation-delay:100ms]">
          <Label className={labelClass}>Associated Contact</Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={cn(inputClass, "w-full appearance-none pl-11 pr-10 cursor-pointer", !contactId && "text-slate-400")}
            >
              <option value="">Select a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900 dark:text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {errors.contactId && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.contactId}</p>}
        </div>

        {/* Value and Date Row */}
        <div className="grid grid-cols-2 gap-4 animate-content-in [animation-delay:150ms]">
          <div className="space-y-1.5">
            <Label className={labelClass}>Deal Value ($)</Label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="number"
                min="0"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className={cn(inputClass, "pl-11", errors.value && "border-red-500")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Expected Close</Label>
            <DatePicker
              value={expectedCloseDate}
              onChange={setExpectedCloseDate}
              className={cn("h-12 py-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900", errors.expectedCloseDate && "border-red-500")}
            />
          </div>
        </div>

        {/* Stage Selection */}
        <div className="space-y-1.5 animate-content-in [animation-delay:200ms]">
          <Label className={labelClass}>Pipeline Stage</Label>
          <div className="relative group">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className={cn(inputClass, "w-full appearance-none pl-11 pr-10 cursor-pointer")}
            >
              {(Object.entries(STAGE_LABELS) as [DealStage, string][]).map(([val, label]) => (
                <option key={val} value={val} className="text-slate-900 dark:text-white">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 py-6 border-t border-slate-100 dark:border-slate-900/50 flex items-center gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <Button 
          type="button" 
          variant="outlineNeutral" 
          onClick={onCancel}
          className="flex-1 h-12"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="default"
          className="flex-[1.5] h-12"
        >
          {initialData?.id ? (
             <>Save Changes</>
          ) : (
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
