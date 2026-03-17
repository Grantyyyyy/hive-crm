import { useState } from "react"
import { 
  Mail, 
  Phone, 
  Building2, 
  UserPlus, 
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lead, LeadSource, LeadStatus } from "@/lib/types"
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/types"
import { generateId, calculateLeadScore } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface LeadFormProps {
  userId: string
  onSave: (lead: Lead) => void
  onCancel: () => void
  initialData?: Partial<Lead>
}

export function LeadForm({ userId, onSave, onCancel, initialData }: LeadFormProps) {
  // Split name for UI (Reference shows First/Last)
  const initialNameParts = (initialData?.name ?? "").split(" ")
  const [firstName, setFirstName] = useState(initialNameParts[0] ?? "")
  const [lastName, setLastName] = useState(initialNameParts.slice(1).join(" ") ?? "")
  
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [company, setCompany] = useState(initialData?.company ?? "")
  const [source, setSource] = useState<LeadSource>(initialData?.source ?? "manual")
  const [status, setStatus] = useState<LeadStatus>(initialData?.status ?? "new")
  const [notes, setNotes] = useState(initialData?.notes ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = "First name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const now = new Date().toISOString()
    const lead: Lead = {
      id: initialData?.id ?? generateId(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      source,
      status,
      score: 0,
      ownerId: userId,
      notes: notes.trim() || undefined,
      convertedAt: initialData?.convertedAt,
      convertedToContactId: initialData?.convertedToContactId,
      convertedToDealId: initialData?.convertedToDealId,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    }
    lead.score = calculateLeadScore(lead)
    onSave(lead)
  }

  const inputClass = "h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-all"
  const labelClass = "text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="animate-content-in duration-700 ease-out">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 animate-content-in [animation-delay:100ms]">
              <Label className={labelClass}>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                className={cn(inputClass, errors.firstName && "border-red-500")}
              />
            </div>
            <div className="space-y-1.5 animate-content-in [animation-delay:150ms]">
              <Label className={labelClass}>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Connor"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5 animate-content-in [animation-delay:200ms]">
          <Label className={labelClass}>Email Address</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.c@company.com"
              className={cn(inputClass, "pl-11", errors.email && "border-red-500")}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5 animate-content-in [animation-delay:250ms]">
          <Label className={labelClass}>Phone Number</Label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={cn(inputClass, "pl-11")}
            />
          </div>
        </div>

        {/* Company */}
        <div className="space-y-1.5 animate-content-in [animation-delay:300ms]">
          <Label className={labelClass}>Company Name</Label>
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Industries"
              className={cn(inputClass, "pl-11")}
            />
          </div>
        </div>

        {/* Source & Status */}
        <div className="grid grid-cols-2 gap-4 animate-content-in [animation-delay:350ms]">
          <div className="space-y-1.5">
            <Label className={labelClass}>Lead Source</Label>
            <div className="relative group">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className={cn(inputClass, "w-full appearance-none pl-4 pr-10 cursor-pointer")}
              >
                {(Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Lead Status</Label>
            <div className="relative group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className={cn(inputClass, "w-full appearance-none pl-4 pr-10 cursor-pointer")}
              >
                {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 animate-content-in [animation-delay:400ms]">
          <Label className={labelClass}>Initial Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any background information or specific requirements..."
            rows={4}
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-all resize-none p-4 min-h-[120px]"
          />
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 py-6 border-t border-slate-100 dark:border-slate-900/50 flex items-center gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-sans"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-[1.5] h-12 rounded-xl bg-[#F05623] hover:bg-[#D9481B] text-white font-bold shadow-lg shadow-orange-100 dark:shadow-none transition-all flex items-center justify-center gap-2 font-sans active:scale-[0.98]"
        >
          {initialData?.id ? (
             <>Save Changes</>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create Lead
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
