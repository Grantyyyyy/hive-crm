import { useState } from "react"
import { 
  Mail, 
  Phone, 
  Building2, 
  UserPlus, 
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Contact, ContactSource, CreateContactInput } from "@/lib/types"
import { SOURCE_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ContactFormProps {
  onSave: (contact: CreateContactInput) => void
  onCancel: () => void
  initialData?: Partial<Contact>
}

export function ContactForm({ onSave, onCancel, initialData }: ContactFormProps) {
  // Split name for UI
  const initialNameParts = (initialData?.name ?? "").split(" ")
  const [firstName, setFirstName] = useState(initialNameParts[0] ?? "")
  const [lastName, setLastName] = useState(initialNameParts.slice(1).join(" ") ?? "")
  
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [company, setCompany] = useState(initialData?.company ?? "")
  const [source, setSource] = useState<ContactSource>(initialData?.source ?? "manual")
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
    onSave({
      ...(initialData?.id && { id: initialData.id }),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      source,
    })
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
                placeholder="e.g. John"
                className={cn(inputClass, errors.firstName && "border-red-500")}
              />
            </div>
            <div className="space-y-1.5 animate-content-in [animation-delay:150ms]">
              <Label className={labelClass}>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
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
              placeholder="john.doe@example.com"
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
              placeholder="Acme Inc."
              className={cn(inputClass, "pl-11")}
            />
          </div>
        </div>

        {/* Source */}
        <div className="space-y-1.5 animate-content-in [animation-delay:350ms]">
          <Label className={labelClass}>Contact Source</Label>
          <div className="relative group">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ContactSource)}
              className={cn(inputClass, "w-full appearance-none pl-4 pr-10 cursor-pointer")}
            >
              {(Object.entries(SOURCE_LABELS) as [ContactSource, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
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
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="default"
          className="flex-[1.5]"
        >
          {initialData?.id ? (
             <>Save Changes</>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Contact
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
