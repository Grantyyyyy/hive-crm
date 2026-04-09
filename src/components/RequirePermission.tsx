import React from "react"
import { useLocation } from "wouter"
import { usePermission } from "@/lib/usePermission"

interface RequirePermissionProps {
  /** The module to check (e.g., "users", "roles", "leads") */
  module: string
  /** The action to check (e.g., "read", "create", "update", "delete") */
  action: string
  /** Component to render if permission is granted */
  component: React.ComponentType<any>
  /** Route to redirect to if permission is denied (default: /dashboard) */
  fallbackRoute?: string
  [key: string]: any
}

/**
 * RequirePermission — wraps a route component and checks that the current
 * user has the specified permission before rendering it.
 *
 * If the user does not have the permission, they are redirected to /dashboard
 * (or the specified fallbackRoute) with a toast notification.
 *
 * Usage in App.tsx:
 *   <Route path="/settings/users">
 *     {() => (
 *       <AppLayout>
 *         <RequirePermission module="users" action="read" component={Users} />
 *       </AppLayout>
 *     )}
 *   </Route>
 */
export function RequirePermission({
  module,
  action,
  component: Component,
  fallbackRoute = "/dashboard",
  ...rest
}: RequirePermissionProps) {
  const { can, isLoaded, hasFullAccess } = usePermission()
  const [, navigate] = useLocation()
  const [checked, setChecked] = React.useState(false)
  const [allowed, setAllowed] = React.useState(false)

  React.useEffect(() => {
    if (!isLoaded) return
    // Full access bypass — users with all permissions skip individual checks
    if (hasFullAccess || can(module, action)) {
      setAllowed(true)
    } else {
      setAllowed(false)
      navigate(fallbackRoute)
    }
    setChecked(true)
  }, [isLoaded, can, hasFullAccess, module, action, navigate, fallbackRoute])

  if (!isLoaded || !checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent" />
      </div>
    )
  }

  if (!allowed) {
    return null
  }

  return <Component {...rest} />
}
