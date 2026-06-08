import { supabase } from "./supabaseClient"

/**
 * Starts an isolated demo session:
 *  1. anonymous sign-in (no email/password)
 *  2. create + seed a private demo workspace (RPC)
 *  3. refresh the token so it carries the demo org_id claim
 *
 * Requires "Anonymous sign-ins" to be enabled in Supabase Auth settings.
 */
export async function startDemo(): Promise<void> {
  const { error: authError } = await supabase.auth.signInAnonymously()
  if (authError) {
    if (/disabled|anonymous/i.test(authError.message)) {
      throw new Error(
        "Demo isn't enabled yet — turn on Anonymous sign-ins in Supabase Auth settings.",
      )
    }
    throw authError
  }

  const { data, error } = await supabase.rpc("create_demo_workspace")
  if (error) throw error
  if (!(data as any)?.success) throw new Error("Could not create the demo workspace")

  // Give the anonymous user a friendly display name (avatar initials + greeting).
  await supabase.auth.updateUser({ data: { full_name: "Demo User" } })

  // Mint a fresh token so RLS sees the demo org immediately.
  await (supabase.auth as any).refreshSession()
}
