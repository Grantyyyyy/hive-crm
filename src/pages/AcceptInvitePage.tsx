import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useLocation } from "wouter"
import { toast } from "sonner"

export default function AcceptInvitePage() {
  const { isLoaded, user, refreshSession } = useAuth()
  const [, navigate] = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      navigate("/sign-in")
      return
    }

    const setupAccount = async () => {
      try {
        // Membership rows are created at invite time, so the accepting user
        // should already belong to at least one organization.
        const { data: memberships, error: rpcError } = await supabase.rpc("get_my_memberships")
        if (rpcError) throw rpcError

        if (!memberships || memberships.length === 0) {
          // No membership — they likely need to create their own workspace.
          navigate("/onboarding")
          return
        }

        // Prefer an already-active org, otherwise the first one.
        const active = memberships.find((m: any) => m.is_active) ?? memberships[0]
        await supabase.rpc("set_active_org", { p_org_id: active.organization_id })

        // Mint a fresh token carrying the org_id claim, then enter the app.
        await refreshSession()
        navigate("/dashboard")
      } catch (err: any) {
        console.error("Failed to set up account:", err)
        setError("Something went wrong. Please contact your admin.")
        toast.error("Failed to set up account")
      }
    }

    setupAccount()
  }, [isLoaded, user, navigate, refreshSession])

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 max-w-sm w-full text-center">
        {error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-r-transparent mx-auto mb-4"></div>
            <p className="text-slate-700 dark:text-slate-300">Setting up your account…</p>
          </>
        )}
      </div>
    </div>
  )
}
