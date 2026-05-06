import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormActions } from "@/components/reusables/form-actions"
import { cn } from "@/lib/utils"
import type { Vendor, VendorStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { useUser } from "@/lib/AuthContext"

interface VendorFormProps {
  initialData?: Partial<Vendor>
  onSave: (vendor: Vendor) => void
  onCancel: () => void
}

export function VendorForm({ initialData, onSave, onCancel }: VendorFormProps) {
  const { user } = useUser()
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
      ownerId: initialData?.ownerId ?? user?.id ?? "unknown",
    }

    onSave(vendor)
  }


  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        
        <div className="grid grid-cols-1 gap-y-8">
          {/* Section: Company Information */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company Identity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor Name</Label>
                <Input
                  placeholder="Acme Logistics Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn("h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10", errors.name && "border-red-500")}
                />
                {errors.name && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category / Trade</Label>
                <Input
                  placeholder="Electronics Supplier"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tax ID / VAT</Label>
                <Input
                  placeholder="XX-XXXXXXX"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
            </div>
          </section>

          {/* Section: Contact Details */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-sky-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact Access</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
                <Input
                  type="email"
                  placeholder="vendor@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Phone</Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website URL</Label>
                <Input
                  placeholder="https://vendor-site.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Headquarters Address</Label>
                <Textarea
                  placeholder="Street, City, State, ZIP..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-100 bg-white dark:bg-slate-900 min-h-[80px] p-4 text-xs font-medium focus:ring-4 focus:ring-teal-500/10 shadow-sm transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section: Business Logic */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Partnership Terms</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Terms</Label>
                <Input
                  placeholder="e.g. Net 30"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor Status</Label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner ring-1 ring-slate-200/50">
                  {(['active', 'on_hold', 'inactive'] as VendorStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        status === s
                          ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-slate-200/50"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Internal Notes</Label>
                <Textarea
                  placeholder="Private remarks regarding performance, reliability..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-100 bg-white dark:bg-slate-900 min-h-[120px] p-4 text-xs font-medium focus:ring-4 focus:ring-teal-500/10 shadow-sm transition-all"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <FormActions
        className="z-30"
        cancel={{ label: "Cancel", onClick: onCancel }}
        primary={{
          label: initialData?.id ? "Update Partner" : "Register Partner",
          type: "submit",
        }}
      />
    </form>
  )
}
