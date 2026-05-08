import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { Building2 } from "lucide-react"

export default function AcceptInvitePage() {
  const { isLoaded, user } = useAuth()
  const [, navigate] = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      // Should not happen since this page requires auth
      navigate("/login")
      return
    }

    const setupAccount = async () => {
      try {
        const organizationId = user.user_metadata?.organization_id
        const roleId = user.user_metadata?.role_id

        if (!organizationId || !roleId) {
          throw new Error("Invalid invite link")
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from("app_users")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle()

        if (!existingUser) {
          // Insert new user
          const { error: insertError } = await supabase
            .from("app_users")
            .insert({
              auth_user_id: user.id,
              email: user.email,
              organization_id: organizationId,
              role_id: roleId
            })

          if (insertError) throw insertError
        }

        // Success - navigate to dashboard
        navigate("/dashboard")
      } catch (err: any) {
        console.error("Failed to setup account:", err)
        setError("Something went wrong. Please contact your admin.")
        toast.error("Failed to setup account")
      }
    }

    setupAccount()
  }, [isLoaded, user, navigate])

  if (!isLoaded) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 max-w-sm w-full text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-r-transparent mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300">Setting up your account…</p>
        </div>
      </div>
    )
  }

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