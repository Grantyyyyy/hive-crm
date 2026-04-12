import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { supabase } from "./supabaseClient"
import type { Session, User } from "@supabase/supabase-js"

// ── Context value ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoaded: boolean
  isSignedIn: boolean
  userId: string
  organizationId: string | null
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Helper: extract org_id from JWT claims ────────────────────────────────────

function extractOrgId(session: Session | null): string | null {
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return payload?.org_id ?? null
  } catch {
    return null
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * AuthProvider — wraps the app and provides authentication state from Supabase.
 *
 * Uses Supabase's getSession() + onAuthStateChange for real-time auth tracking.
 * The exported hooks mirror Clerk's interface so swapping required zero changes
 * in consuming components.
 *
 * Mapping:
 *   AuthContext.user        → Supabase User
 *   AuthContext.session     → Supabase Session
 *   AuthContext.isLoaded    → Auth init complete
 *   AuthContext.isSignedIn  → !!session && !!user
 *   AuthContext.userId      → user.id
 *   AuthContext.signOut()   → supabase.auth.signOut()
 *   AuthContext.getToken()  → session.access_token
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setOrganizationId(extractOrgId(initialSession))
      setIsLoaded(true)
    }).catch((err) => {
      console.error('Failed to get initial session:', err)
      setIsLoaded(true)
    })

    // Listen for auth state changes (sign-in, sign-out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setOrganizationId(extractOrgId(newSession))
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    // onAuthStateChange will fire and update state; force-clear local state regardless
    setSession(null);
    setUser(null);
    setIsLoaded(true);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!session) return null
    return session.access_token
  }, [session])

  const isSignedIn = !!session && !!user
  const userId = user?.id ?? ""

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoaded,
      isSignedIn,
      userId,
      organizationId,
      signOut,
      getToken,
    }),
    [user, session, isLoaded, isSignedIn, userId, organizationId, signOut, getToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Consumer hooks ────────────────────────────────────────────────────────────

/**
 * useAuth — mirrors Clerk's useAuth() hook.
 * Returns isLoaded, isSignedIn, userId, organizationId, signOut, getToken.
 */
export function useAuth(): Pick<AuthContextValue, "isLoaded" | "isSignedIn" | "userId" | "organizationId" | "signOut" | "getToken"> {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    signOut: ctx.signOut,
    getToken: ctx.getToken,
  }
}

/**
 * useUser — mirrors Clerk's useUser() hook.
 * Returns the Supabase User object and isLoaded state.
 */
export function useUser(): { user: User | null; isLoaded: boolean } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useUser must be used within an AuthProvider")
  return { user: ctx.user, isLoaded: ctx.isLoaded }
}

/**
 * useSession — mirrors Clerk's useSession() hook.
 * Returns the Supabase Session object.
 */
export function useSession(): { session: Session | null } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useSession must be used within an AuthProvider")
  return { session: ctx.session }
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
