import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateId } from "@/lib/helpers"

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${base || "org"}-${generateId().slice(0, 6)}`
}

export default function OnboardingPage() {
  const { user, refreshSession } = useAuth()
  const [, navigate] = useLocation()
  const [orgName, setOrgName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [canCreate, setCanCreate] = useState(true)

  // When launched from the org switcher ("Create organization") the user already
  // has a workspace and is spinning up an additional one.
  const isAdditional =
    typeof window !== "undefined" && window.location.search.includes("new=1")

  // Pre-check the free-tier org limit so the user sees it before submitting.
  useEffect(() => {
    let cancelled = false
    supabase
      .rpc("can_create_organization")
      .then(({ data, error }) => {
        if (!cancelled && !error) setCanCreate(data !== false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc("initialize_organization", {
        org_name: orgName.trim(),
        org_slug: slugify(orgName),
        user_email: user.email,
        user_full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      })

      if (error) throw error
      if (!(data as any)?.success) {
        throw new Error("Organization setup did not complete.")
      }

      // Mint a fresh token carrying the new org as the active org, then enter it.
      await refreshSession()
      toast.success("Organization created!")
      window.location.assign("/dashboard")
    } catch (error: any) {
      console.error("Failed to create organization:", error)
      toast.error("Failed to create organization", {
        description: error.message,
      })
      setIsLoading(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Organization limit reached</h1>
          <p className="text-slate-500 font-medium mb-6">
            The free plan is limited to 2 organizations. Upgrade an existing organization to create more.
          </p>
          <Button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-teal-600" />
          </div>
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {isAdditional ? "NEW WORKSPACE" : "GET STARTED"}
            </p>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {isAdditional ? "Create a new organization" : "Create your Organization"}
          </h1>
          <p className="text-slate-500 font-medium">
            {isAdditional
              ? "You'll become its Admin and switch to it automatically."
              : "Set up your workspace to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="orgName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              ORGANIZATION NAME
            </Label>
            <Input
              id="orgName"
              type="text"
              placeholder="e.g. Acme Corp"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-2"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !orgName.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              "Create Organization"
            )}
          </Button>

          {isAdditional && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
