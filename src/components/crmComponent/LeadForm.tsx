import { useState } from "react"
import { 
  Mail, 
  Phone, 
  Building2, 
  ChevronDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormActions } from "@/components/reusables/form-actions"
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
  const [position, setPosition] = useState(initialData?.position ?? "")
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
      position: position.trim() || undefined,
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        
        <div className="grid grid-cols-1 gap-y-6">
          {/* Section 1: Lead Information */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lead Information</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah"
                    className={cn(
                      "h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                      errors.firstName && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                  {errors.firstName && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Connor"
                    className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
                  <div className="group relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className={cn(
                        "h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                        errors.email && "border-red-500 ring-4 ring-red-500/10"
                      )}
                    />
                  </div>
                  {errors.email && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</Label>
                  <div className="group relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Company & Status */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-sky-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company & Strategy</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Name</Label>
                  <div className="group relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Industries"
                      className="h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Title / Position</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="CEO / Founder"
                    className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead Source</Label>
                  <div className="relative group">
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as LeadSource)}
                      className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                    >
                      {(Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead Status</Label>
                  <div className="relative group">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LeadStatus)}
                      className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                    >
                      {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Background */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Background & Notes</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Initial Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details about the lead's interest..."
                className="min-h-[120px] p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-medium transition-all focus:ring-4 focus:ring-teal-500/10 resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      <FormActions
        cancel={{ label: "Cancel", onClick: onCancel }}
        primary={{
          label: initialData?.id ? "Save Changes" : "Create Lead",
          type: "submit",
        }}
      />
    </form>
  )
}
