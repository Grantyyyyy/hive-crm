import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk as useClerkInstance } from "@clerk/clerk-react"

// We use `any` for user/session during the transition because the actual type
// will switch from Clerk → Supabase in Phase 3. Consumers only access fields
// through the typed hooks below (useAuth, useUser), so this is safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransitionalUser = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransitionalSession = any

// ── Context value ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: TransitionalUser | null
  session: TransitionalSession | null
  isLoaded: boolean
  isSignedIn: boolean
  userId: string
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * AuthProvider — wraps the app and provides authentication state.
 *
 * TRANSITION NOTE: During Phases 1–2, this sources auth state from Clerk
 * (since users still sign in via Clerk). In Phase 3, the internal source
 * will be swapped to Supabase Auth. The context interface stays identical,
 * so consuming components require zero changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkAuth = useClerkAuth()
  const { user, isLoaded: userLoaded } = useClerkUser()
  const clerk = useClerkInstance()

  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (clerkAuth.isLoaded && userLoaded) {
      setIsLoaded(true)
    }
  }, [clerkAuth.isLoaded, userLoaded])

  const signOut = useCallback(async () => {
    await clerk.signOut()
  }, [clerk])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!clerkAuth.isSignedIn) return null
    return clerkAuth.getToken()
  }, [clerkAuth])

  const isSignedIn = clerkAuth.isSignedIn ?? false
  const userId = user?.id ?? ""

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session: null, // Clerk manages session via cookies; not needed during transition
      isLoaded,
      isSignedIn,
      userId,
      signOut,
      getToken,
    }),
    [user, isLoaded, isSignedIn, userId, signOut, getToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Consumer hooks ────────────────────────────────────────────────────────────

/**
 * useAuth — mirrors Clerk's useAuth() hook.
 * Returns isLoaded, isSignedIn, userId, signOut, getToken.
 */
export function useAuth(): Pick<AuthContextValue, "isLoaded" | "isSignedIn" | "userId" | "signOut" | "getToken"> {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    signOut: ctx.signOut,
    getToken: ctx.getToken,
  }
}

/**
 * useUser — mirrors Clerk's useUser() hook.
 * Returns the current user object and isLoaded state.
 */
export function useUser(): { user: TransitionalUser | null; isLoaded: boolean } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useUser must be used within an AuthProvider")
  return { user: ctx.user, isLoaded: ctx.isLoaded }
}

/**
 * useSession — mirrors Clerk's useSession() hook.
 * Returns the current session object (null during transition since Clerk
 * manages sessions via cookies, not a JS session object).
 */
export function useSession(): { session: TransitionalSession | null } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useSession must be used within an AuthProvider")
  return { session: ctx.session }
}

/**
 * useOrganization — placeholder to mirror Clerk's useOrganization().
 * Supabase Auth doesn't have orgs natively; org logic lives in app_users table.
 * Returns null for now — will be removed in a later phase.
 */
export function useOrganization(): { organization: null; isLoaded: boolean } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useOrganization must be used within an AuthProvider")
  return { organization: null, isLoaded: ctx.isLoaded }
}

/**
 * useClerk — placeholder to mirror Clerk's useClerk() hook.
 * Returns signOut for now — will be removed in a later phase.
 */
export function useClerk(): { signOut: () => Promise<void> } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useClerk must be used within an AuthProvider")
  return { signOut: ctx.signOut }
}

/**
 * SignedIn — render-prop component mirroring Clerk's <SignedIn>.
 * Shows children only when the user is signed in.
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  return isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut — render-prop component mirroring Clerk's <SignedOut>.
 * Shows children only when the user is NOT signed in.
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  return !isSignedIn ? <>{children}</> : null
}

// ── Export the context for direct access ──────────────────────────────────────

export { AuthContext }
