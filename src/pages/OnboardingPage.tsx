import React, { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateId } from "@/lib/helpers"

export default function OnboardingPage() {
  const { user } = useAuth()
  const [, navigate] = useLocation()
  const [orgName, setOrgName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const orgId = generateId()

      // Insert into organizations
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: orgName.trim(),
          owner_id: user.id
        })

      if (orgError) throw orgError

      // Upsert into app_users
      const { error: userError } = await supabase
        .from("app_users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          organization_id: orgId
        })

      if (userError) throw userError

      toast.success('Organization created!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error("Failed to create organization:", error)
      toast.error("Failed to create organization", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-teal-600" />
          </div>
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">GET STARTED</p>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your Organization</h1>
          <p className="text-slate-500 font-medium">Set up your workspace to get started.</p>
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
        </form>
      </div>
    </div>
  )
}
