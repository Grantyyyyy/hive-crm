import { useState } from "react"
import { useLocation } from "wouter"
import { Building2, Check, Plus, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/AuthContext"

/**
 * Org identity + switcher shown inside the sidebar organization popover.
 * Lists every organization the user belongs to and lets them switch the
 * active workspace (which hard-reloads under a fresh org-scoped token).
 */
export function OrgSwitcher() {
  const { memberships, organizationId, orgName, switchOrg, signOut } = useAuth()
  const [, navigate] = useLocation()
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async (orgId: string) => {
    if (orgId === organizationId || switching) return
    setSwitching(true)
    try {
      await switchOrg(orgId) // hard-reloads on success
    } catch (e) {
      setSwitching(false)
      toast.error("Couldn't switch organization", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <div>
      <div className="px-3 py-2 border-b border-border mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Organization</p>
        <p className="text-sm font-bold text-text-primary truncate">{orgName ?? "—"}</p>
      </div>

      {memberships.length > 1 && (
        <div className="mb-2 max-h-56 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-text-muted">Switch to</p>
          {memberships.map((m) => {
            const active = m.organizationId === organizationId
            return (
              <button
                key={m.organizationId}
                onClick={() => handleSwitch(m.organizationId)}
                disabled={switching}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-bg-elevated transition-all text-left disabled:opacity-60"
              >
                <div className="size-7 shrink-0 rounded-md bg-accent-dim border border-accent/20 flex items-center justify-center text-accent">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 min-w-0 truncate font-medium text-text-primary">{m.organizationName}</span>
                {active && <Check className="w-4 h-4 text-accent shrink-0" />}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => navigate("/onboarding?new=1")}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-bg-elevated transition-all text-left"
      >
        <Plus className="w-4 h-4" />
        Create organization
      </button>

      <button
        onClick={() => signOut()}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all text-left"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )
}
