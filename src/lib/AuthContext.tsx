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
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setIsLoaded(true)
    })

    // Listen for auth state changes (sign-in, sign-out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // onAuthStateChange will fire and update state
  }, [])

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
      signOut,
      getToken,
    }),
    [user, session, isLoaded, isSignedIn, userId, signOut, getToken]
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
