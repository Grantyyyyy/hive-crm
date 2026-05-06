import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { AuthSession as Session, AuthUser as User } from "@supabase/supabase-js"
import { supabase } from "./supabaseClient"
import { logger } from "./logger"
import { DEFAULT_BRAND_COLOR, type BrandColorId, isBrandColorId } from "./brandColors"

function logAuthEvent(action: string, userId: string, session: Session | null) {
  let organizationId: string | null = null

  if (session?.access_token) {
    try {
      const payload = JSON.parse(atob(session.access_token.split(".")[1]))
      organizationId = payload?.org_id ?? null
    } catch {
      // Ignore malformed JWTs for audit logging purposes.
    }
  }

  supabase.from("audit_log").insert({
    entity_type: "auth",
    entity_id: userId,
    action,
    changed_by: userId,
    organization_id: organizationId,
    diff: { event: action, timestamp: new Date().toISOString() },
  }).then(({ error }: any) => {
    if (error) {
      logger.error("[AuthContext] Failed to emit auth audit log:", error)
    }
  })
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoaded: boolean
  isSignedIn: boolean
  userId: string
  organizationId: string | null
  brandColor: BrandColorId
  setBrandColor: (brandColor: BrandColorId) => void
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
  refreshSession: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function extractOrgId(session: Session | null): string | null {
  if (!session?.access_token) return null

  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1]))
    return payload?.org_id ?? null
  } catch (error) {
    logger.error("Failed to parse JWT:", error)
    return null
  }
}

async function resolveOrganizationId(session: Session | null): Promise<string | null> {
  const jwtOrgId = extractOrgId(session)
  if (jwtOrgId) return jwtOrgId

  const authUserId = session?.user?.id
  if (!authUserId) return null

  try {
    const { data, error } = await supabase.rpc("get_my_org_id")
    if (error) throw error
    if (data) return data
  } catch (error: any) {
    const message = String(error?.message || "")
    const missingRpc =
      message.includes("get_my_org_id") &&
      (message.includes("Could not find the function") || message.includes("does not exist"))

    if (!missingRpc) {
      logger.warn("[AuthContext] get_my_org_id() fallback failed:", error)
    }
  }

  try {
    const { data, error } = await supabase
      .from("app_users")
      .select("organization_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle()

    if (error) throw error
    return data?.organization_id ?? null
  } catch (error) {
    logger.warn("[AuthContext] app_users org lookup fallback failed:", error)
    return null
  }
}

async function resolveAuthProfile(session: Session | null): Promise<{ organizationId: string | null; brandColor: BrandColorId }> {
  const authUserId = session?.user?.id
  if (!authUserId) {
    return { organizationId: null, brandColor: DEFAULT_BRAND_COLOR }
  }

  let organizationId = extractOrgId(session)
  let brandColor = DEFAULT_BRAND_COLOR

  try {
    const { data, error } = await supabase
      .from("app_users")
      .select("organization_id, brand_color")
      .eq("auth_user_id", authUserId)
      .maybeSingle()

    if (error) throw error
    if (!organizationId) organizationId = data?.organization_id ?? null
    if (isBrandColorId(data?.brand_color)) brandColor = data.brand_color
  } catch (error) {
    logger.warn("[AuthContext] app_users profile lookup failed:", error)
  }

  if (!organizationId) {
    organizationId = await resolveOrganizationId(session)
  }

  return { organizationId, brandColor }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState<BrandColorId>(DEFAULT_BRAND_COLOR)
  const [isLoaded, setIsLoaded] = useState(false)

  const initialized = useRef(false)
  const syncVersionRef = useRef(0)
  const hadSessionRef = useRef(false)
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const syncSessionState = async (nextSession: Session | null, seedRefs = false) => {
      const syncVersion = ++syncVersionRef.current
      const nextUser = nextSession?.user ?? null
      const { organizationId: nextOrganizationId, brandColor: nextBrandColor } = await resolveAuthProfile(nextSession)

      if (cancelled || syncVersion !== syncVersionRef.current) return

      setSession(nextSession)
      setUser(nextUser)
      setOrganizationId(nextOrganizationId)
      setBrandColor(nextBrandColor)
      setIsLoaded(true)

      if (seedRefs) {
        hadSessionRef.current = !!nextSession
        prevUserIdRef.current = nextUser?.id ?? null
        initialized.current = true
        return
      }

      if (!initialized.current) return

      const hasSessionNow = !!nextUser
      const hadSessionBefore = hadSessionRef.current

      if (hasSessionNow && !hadSessionBefore && nextSession) {
        logAuthEvent("LOGIN", nextSession.user.id, nextSession)
      }

      hadSessionRef.current = hasSessionNow
      if (nextUser?.id) {
        prevUserIdRef.current = nextUser.id
      }
    }

    ;(supabase.auth as any).getSession().then(async ({ data: { session: initialSession } }: any) => {
      await syncSessionState(initialSession, true)
    }).catch((error: any) => {
      logger.error("Failed to get initial session:", error)
      setIsLoaded(true)
      initialized.current = true
    })

    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((_event: string, nextSession: Session | null) => {
      void syncSessionState(nextSession)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    if (prevUserIdRef.current) {
      try {
        await supabase.from("audit_log").insert({
          entity_type: "auth",
          entity_id: prevUserIdRef.current,
          action: "LOGOUT",
          changed_by: prevUserIdRef.current,
          organization_id: organizationId,
          diff: { event: "LOGOUT", timestamp: new Date().toISOString() },
        })
      } catch (error: any) {
        logger.error("[AuthContext] Failed to emit LOGOUT audit log:", error)
      }
    }

    try {
      await (supabase.auth as any).signOut()
    } catch (error: any) {
      logger.error("Sign out failed:", error)
    }

    setSession(null)
    setUser(null)
    setOrganizationId(null)
    setBrandColor(DEFAULT_BRAND_COLOR)
    setIsLoaded(true)
  }, [organizationId])

  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await (supabase.auth as any).refreshSession()
      if (error) throw error

      if (data.session) {
        const { organizationId: nextOrganizationId, brandColor: nextBrandColor } = await resolveAuthProfile(data.session)
        setSession(data.session)
        setUser(data.session.user)
        setOrganizationId(nextOrganizationId)
        setBrandColor(nextBrandColor)
        return nextOrganizationId
      }
    } catch (error: any) {
      logger.error("Failed to refresh session:", error)
    }

    return null
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
      organizationId,
      brandColor,
      setBrandColor,
      signOut,
      getToken,
      refreshSession,
    }),
    [user, session, isLoaded, isSignedIn, userId, organizationId, brandColor, signOut, getToken, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Pick<AuthContextValue, "isLoaded" | "isSignedIn" | "userId" | "organizationId" | "brandColor" | "setBrandColor" | "signOut" | "getToken" | "refreshSession"> {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")

  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    brandColor: ctx.brandColor,
    setBrandColor: ctx.setBrandColor,
    signOut: ctx.signOut,
    getToken: ctx.getToken,
    refreshSession: ctx.refreshSession,
  }
}

export function useUser(): { user: User | null; isLoaded: boolean } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useUser must be used within an AuthProvider")
  return { user: ctx.user, isLoaded: ctx.isLoaded }
}

export function useSession(): { session: Session | null } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useSession must be used within an AuthProvider")
  return { session: ctx.session }
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  return isSignedIn ? <>{children}</> : null
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  return !isSignedIn ? <>{children}</> : null
}

export { AuthContext }
