import { useState } from "react"
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  ChevronDown, 
  CheckCircle2,
  Info 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormActions } from "@/components/reusables/form-actions"
import { cn } from "@/lib/utils"
import type { AppUser, Role } from "@/lib/types"

export interface UserFormData {
  name: string
  email: string
  roleId: string
  inviteMode: boolean
}

interface UserFormProps {
  onSave: (data: UserFormData) => void
  onCancel: () => void
  initialData?: AppUser | null
  availableRoles: Role[]
  isPending?: boolean
  organizationId?: string | null
}

export function UserForm({
  onSave,
  onCancel,
  initialData,
  availableRoles,
  isPending,
  organizationId
}: UserFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [roleId, setRoleId] = useState(initialData?.roleId ?? "")
  const [inviteMode, setInviteMode] = useState(!organizationId ? false : true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!initialData

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Full name is required"
    if (!email.trim()) newErrors.email = "Email address is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      name: name.trim(),
      email: email.trim(),
      roleId,
      inviteMode: isEditing ? false : inviteMode
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        
        {/* Mode Switcher (only for new users) */}
        {!isEditing && (
          <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-accent rounded-full" />
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Creation Mode</h3>
                <p className="text-[10px] font-medium text-slate-400">Choose how to add this member</p>
              </div>
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => setInviteMode(true)}
                disabled={!organizationId}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  inviteMode 
                    ? "bg-accent text-white shadow-md shadow-accent/20" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                  !organizationId && "opacity-50 cursor-not-allowed"
                )}
              >
                Invite
              </button>
              <button
                type="button"
                onClick={() => setInviteMode(false)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  !inviteMode 
                    ? "bg-accent text-white shadow-md shadow-accent/20" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                Manual
              </button>
            </div>
          </div>
        )}

        {/* Info Box for Invite Mode */}
        {!isEditing && inviteMode && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1">Email Invitation</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80 font-medium leading-relaxed">
                  The user will receive a secure link to activate their account and set their own password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Identity Section */}
        <section className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3.5 bg-accent rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity & Contact</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</Label>
              <div className="group relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isEditing}
                  placeholder="e.g. Alexander Pierce"
                  className={cn(
                    "h-12 pl-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-accent/10",
                    errors.name && "border-red-500 ring-4 ring-red-500/10",
                    isEditing && "opacity-75 bg-slate-50 cursor-not-allowed"
                  )}
                />
              </div>
              {errors.name && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide px-1">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
              <div className="group relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditing}
                  placeholder="alexander@company.com"
                  className={cn(
                    "h-12 pl-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-accent/10",
                    errors.email && "border-red-500 ring-4 ring-red-500/10",
                    isEditing && "opacity-75 bg-slate-50 cursor-not-allowed"
                  )}
                />
              </div>
              {errors.email && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide px-1">{errors.email}</p>}
            </div>
          </div>
        </section>

        {/* Access Control Section */}
        <section className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Access Control</h3>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Role</Label>
            <div className="relative group">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
                className="w-full h-12 pl-11 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-accent/10 transition-all shadow-sm"
              >
                <option value="">Select a role...</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="mt-4 p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl flex gap-3 border border-slate-200 dark:border-slate-700">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                    Roles define what modules and actions this member can access across the organization. You can manage role permissions in the Roles tab.
                </p>
            </div>
          </div>
        </section>
      </div>

      <FormActions
        cancel={{ label: "Cancel", onClick: onCancel, disabled: isPending }}
        primary={{
          label: isPending ? (
            <>
              <div className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            isEditing ? "Update Role" : (inviteMode ? "Send Invitation" : "Create User")
          ),
          type: "submit",
          disabled: isPending,
        }}
      />
    </form>
  )
}
