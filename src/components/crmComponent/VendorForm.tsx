import { useState } from "react"
import { Building2, Mail, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Vendor, VendorStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface VendorFormProps {
  initialData?: Partial<Vendor>
  onSave: (vendor: Vendor) => void
  onCancel: () => void
}

export function VendorForm({ initialData, onSave, onCancel }: VendorFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [website, setWebsite] = useState(initialData?.website ?? "")
  const [address, setAddress] = useState(initialData?.address ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [taxId, setTaxId] = useState(initialData?.taxId ?? "")
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms ?? "")
  const [notes, setNotes] = useState(initialData?.notes ?? "")
  const [status, setStatus] = useState<VendorStatus>(initialData?.status ?? "active")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Vendor name is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const vendor: Vendor = {
      id: initialData?.id ?? generateId(),
      name,
      email,
      phone,
      website,
      address,
      category,
      taxId,
      paymentTerms,
      notes,
      status,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(vendor)
  }

  const inputClass = "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm shadow-sm"
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block"

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950 font-sans border-l border-slate-200 dark:border-slate-800">
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        
        {/* Section: Company Information */}
        <section className="space-y-6 animate-content-in [animation-delay:50ms]">
          <div className="border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Building2 className="size-4 text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Company Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className={labelClass}>Vendor Name</Label>
              <Input
                placeholder="Acme Logistics Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(inputClass, errors.name && "border-red-500 focus:ring-red-500/20")}
              />
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Category / Trade</Label>
              <Input
                placeholder="Electronics Supplier"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Tax ID / VAT</Label>
              <Input
                placeholder="XX-XXXXXXX"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Section: Contact Details */}
        <section className="space-y-6 animate-content-in [animation-delay:150ms]">
          <div className="border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Mail className="size-4 text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Email Address</Label>
              <Input
                type="email"
                placeholder="vendor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Work Phone</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className={labelClass}>Website URL</Label>
              <Input
                placeholder="https://vendor-site.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className={labelClass}>Headquarters Address</Label>
              <Textarea
                placeholder="Street, City, State, ZIP..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] p-4 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section: Business Logic */}
        <section className="space-y-6 animate-content-in [animation-delay:250ms]">
          <div className="border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Activity className="size-4 text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Terms & Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={labelClass}>Payment Terms</Label>
              <Input
                placeholder="e.g. Net 30"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Vendor Status</Label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                {(['active', 'on_hold', 'inactive'] as VendorStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      status === s
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-slate-700 active:scale-95"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 pb-10">
              <Label className={labelClass}>Internal Notes</Label>
              <Textarea
                placeholder="Private remarks regarding performance, reliability, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[140px] p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 p-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-900/50 flex items-center justify-between gap-4 z-20 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="flex-1 rounded-xl font-bold text-xs uppercase tracking-[0.1em] h-12 transition-all hover:bg-slate-50 shadow-sm border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-[1.8] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-[0.15em] h-12 shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98]"
        >
          {initialData?.id ? "Save Changes" : "Register Partner"}
        </Button>
      </div>
    </form>
  )
}
