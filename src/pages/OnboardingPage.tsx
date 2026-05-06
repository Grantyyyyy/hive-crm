import { useState } from "react"
import { useLocation } from "wouter"
import { Building2, Loader2, ArrowRight, ShieldCheck } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { supabase } from "@/lib/supabaseClient"
import { setupFirstOrganization } from "@/lib/settingsService"
import { toast } from "sonner"
import { useAuth, useUser } from "@/lib/AuthContext"
import { logger } from "@/lib/logger"

export function OnboardingPage() {
  const [, navigate] = useLocation()
  const { userId, refreshSession } = useAuth()
  const { user } = useUser()
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !userId) return

    setLoading(true)
    try {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const result = await setupFirstOrganization(supabase, {
        name: orgName,
        slug,
        ownerId: userId,
        userEmail: user?.email || "",
        userName: user?.user_metadata?.full_name
      })

      const refreshedOrganizationId = await refreshSession()

      if (!refreshedOrganizationId && !result.organizationId) {
        throw new Error("Organization was created, but your session could not be updated. Apply the onboarding SQL migration and sign in again.")
      }

      toast.success("Organization created! Setting up your workspace...")

      navigate("/dashboard")
    } catch (error: any) {
      logger.error("Failed to setup organization:", error)
      toast.error(error.message || "Failed to create organization")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-teal-600/20">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
          Setup Workspace
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          Create your organization
        </h2>
        <p className="text-text-secondary font-medium text-sm mt-1.5">
          To get started, we need a workspace for your team.
        </p>
      </div>

      <form onSubmit={handleCreateOrg} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            required
            autoFocus
            className="w-full px-4 py-4 border border-border rounded-xl text-sm bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all shadow-sm"
          />
        </div>

        <div className="p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-tight">Admin Privileges</span>
          </div>
          <p className="text-xs text-teal-600/80 dark:text-teal-400/60 leading-relaxed">
            As the creator, you will be automatically assigned the <strong>Admin</strong> role with full access to all features.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !orgName.trim()}
          className="w-full px-5 py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Initialize Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="pt-4 border-t border-border mt-6">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/sign-up");
            }}
            className="w-full py-3 text-text-muted hover:text-text-primary text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            Back to Sign up
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
