import { useAuth } from "@/lib/AuthContext";
import { Router, Route, Switch, useLocation, Redirect } from "wouter";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Toaster } from "sonner";
import { CRMProvider, useCRMContext } from "@/lib/CRMContext";
import { useInventoryAlerts } from "@/lib/hooks/useInventoryAlerts";
import { AuthProvider, useUser } from "@/lib/AuthContext"
import { RequirePermission } from "@/components/RequirePermission";
import type { Organization } from "@/lib/types";
import { setAuthToken, subscribeAuth } from "@/lib/api";
import { logger } from "@/lib/logger";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { FontProvider } from "@/components/FontProvider";
import { AppLoader } from "@/components/AppLoader";

const LandingPage = React.lazy(() => import("@/pages/LandingPage").then(module => ({ default: module.LandingPage })));
const SignInPage = React.lazy(() => import("@/pages/SignInPage").then(module => ({ default: module.SignInPage })));
const SignUpPage = React.lazy(() => import("@/pages/SignUpPage").then(module => ({ default: module.SignUpPage })));
const OnboardingPage = React.lazy(() => import("@/pages/OnboardingPage"));
const AcceptInvitePage = React.lazy(() => import("@/pages/AcceptInvitePage"));
const Dashboard = React.lazy(() => import("@/pages/core/Dashboard").then(module => ({ default: module.Dashboard })));
const Contacts = React.lazy(() => import("@/pages/core/Contacts").then(module => ({ default: module.Contacts })));
const ContactDetail = React.lazy(() => import("@/pages/core/ContactDetail").then(module => ({ default: module.ContactDetail })));
const Deals = React.lazy(() => import("@/pages/core/Deals").then(module => ({ default: module.Deals })));
const DealDetail = React.lazy(() => import("@/pages/core/DealDetail").then(module => ({ default: module.DealDetail })));
const Activities = React.lazy(() => import("@/pages/core/Activities").then(module => ({ default: module.Activities })));
const Leads = React.lazy(() => import("@/pages/core/Leads").then(module => ({ default: module.Leads })));
const LeadDetail = React.lazy(() => import("@/pages/LeadDetail").then(module => ({ default: module.LeadDetail })));
const Tasks = React.lazy(() => import("@/pages/core/Tasks").then(module => ({ default: module.Tasks })));
const Projects = React.lazy(() => import("@/pages/core/Projects").then(module => ({ default: module.Projects })));
const ProjectDetail = React.lazy(() => import("@/pages/core/ProjectDetail").then(module => ({ default: module.ProjectDetail })));
const Workload = React.lazy(() => import("@/pages/core/Workload").then(module => ({ default: module.Workload })));
const SalesOrders = React.lazy(() => import("@/pages/sales/SalesOrders").then(module => ({ default: module.SalesOrders })));
const SalesOrderDetail = React.lazy(() => import("@/pages/sales/SalesOrderDetail").then(module => ({ default: module.SalesOrderDetail })));
const Quotes = React.lazy(() => import("@/pages/sales/Quotes").then(module => ({ default: module.Quotes })));
const QuoteDetail = React.lazy(() => import("@/pages/sales/QuoteDetail").then(module => ({ default: module.QuoteDetail })));
const PurchaseOrders = React.lazy(() => import("@/pages/logistics/PurchaseOrders").then(module => ({ default: module.PurchaseOrders })));
const PurchaseOrderDetail = React.lazy(() => import("@/pages/logistics/PurchaseOrderDetail").then(module => ({ default: module.PurchaseOrderDetail })));
const PurchaseRequests = React.lazy(() => import("@/pages/logistics/PurchaseRequests").then(module => ({ default: module.PurchaseRequests })));
const PurchaseRequestDetail = React.lazy(() => import("@/pages/logistics/PurchaseRequestDetail").then(module => ({ default: module.PurchaseRequestDetail })));
const Vendors = React.lazy(() => import("@/pages/logistics/Vendors").then(module => ({ default: module.Vendors })));
const VendorDetail = React.lazy(() => import("@/pages/logistics/VendorDetail").then(module => ({ default: module.VendorDetail })));
const Inventory = React.lazy(() => import("@/pages/logistics/Inventory").then(module => ({ default: module.Inventory })));
const InventoryDetail = React.lazy(() => import("@/pages/logistics/InventoryDetail").then(module => ({ default: module.InventoryDetail })));
const Reports = React.lazy(() => import("@/pages/logistics/Reports").then(module => ({ default: module.Reports })));
const Users = React.lazy(() => import("@/pages/settings/Users").then(module => ({ default: module.Users })));
const Roles = React.lazy(() => import("@/pages/settings/Roles").then(module => ({ default: module.Roles })));
const OrganizationsPage = React.lazy(() => import("@/pages/settings/OrganizationsPage").then(module => ({ default: module.OrganizationsPage })));
const ProfilePage = React.lazy(() => import("@/pages/settings/ProfilePage").then(module => ({ default: module.ProfilePage })));
const AuditLogs = React.lazy(() => import("@/pages/settings/AuditLogs").then(module => ({ default: module.AuditLogs })));
const Notifications = React.lazy(() => import("@/pages/settings/Notifications").then(module => ({ default: module.Notifications })));
const BrandingSettings = React.lazy(() => import("@/pages/settings/BrandingSettings").then(module => ({ default: module.BrandingSettings })));
const Discounts = React.lazy(() => import("@/pages/settings/Discounts").then(module => ({ default: module.Discounts })));
const Billing = React.lazy(() => import("@/pages/settings/Billing").then(module => ({ default: module.Billing })));

function RouteFallback() {
  return <AppLoader fullScreen />;
}

function Protected({ component: Component }: { component: React.ComponentType }) {
  return <ProtectedRoute component={Component} />;
}

function PermissionProtected({ module, action = "read", component: Component }: { module: string, action?: string, component: React.ComponentType }) {
  return <RequirePermission module={module} action={action} component={Component} />;
}

function InventoryAlertRunner() {
  useInventoryAlerts()
  return null
}

function AppContent() {
  const { isSignedIn, isLoaded: authLoaded, getToken, userId, organizationId } = useAuth();
  const { user } = useUser();
  const [authReady, setAuthReady] = useState(false);
  const [location, navigate] = useLocation();

  /**
   * Synchronizes Supabase auth state with the app's API layer.
   * - Stores the Supabase access token for API requests
   * - Handles onboarding and dashboard redirection guards
   */
  useEffect(() => {
    if (authLoaded) {
      if (isSignedIn) {
        // Cache the token for the legacy API layer
        getToken().then(token => {
          if (token) setAuthToken(token);
        });

        // Redirect to onboarding if no organization is set
        logger.debug("Auth Guard Check:", { organizationId, location });
        if ((!organizationId || organizationId === "null") && location !== "/onboarding" && location !== "/sign-in" && location !== "/sign-up") {
          logger.debug("Redirecting to /onboarding");
          navigate("/onboarding");
        }

        // Redirect to dashboard if they are already onboarded but trying to access onboarding,
        // UNLESS they are intentionally creating an additional organization (?new=1).
        const creatingNewOrg =
          typeof window !== "undefined" && window.location.search.includes("new=1");
        if (organizationId && organizationId !== "null" && location === "/onboarding" && !creatingNewOrg) {
          logger.debug("Redirecting to /dashboard");
          navigate("/dashboard");
        }
      } else {
        setAuthToken(null);
      }
      setAuthReady(true);
    }
  }, [isSignedIn, authLoaded, getToken, organizationId, navigate, location]);

  /**
   * Subscribe to Supabase session changes and propagate token to the API layer.
   */
  useEffect(() => {
    return subscribeAuth(({ token }) => {
      if (token) setAuthToken(token);
    });
  }, []);

  const upsertedRef = useRef(false);

  /**
   * Sync the current Supabase user into app_users on first load.
   */
  useEffect(() => {
    if (!user || !userId || upsertedRef.current) return;
    upsertedRef.current = true;
    import("@/lib/settingsService").then(async ({ upsertCurrentUser }) => {
      try {
        const { supabase } = await import("@/lib/supabaseClient");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await upsertCurrentUser(supabase, {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
          username: user.user_metadata?.user_name ?? undefined,
        }, userId);
      } catch (e) {
        logger.error("Failed to sync current user:", e);
      }
    });
  }, [user, userId]);
  
  const ctx = useCRMContext();
  const { data: organizations } = ctx.getResource<Organization>("organizations");
  const appName = organizations[0]?.appName || "Hive CRM";

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  if (!authLoaded || !authReady) {
    return <AppLoader fullScreen />;
  }

  return (
    <FontProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
          <Toaster 
            position="top-right" 
            expand={true}
            richColors={false} // Disable default rich colors to avoid solid backgrounds
            toastOptions={{
              className: 'premium-glass-toast',
            }}
          />
          <main className="flex-[1_0_auto] flex flex-col">
            <InventoryAlertRunner />
            <Suspense fallback={<RouteFallback />}>
            <Switch>
              {/* Public routes — no AppLayout */}
              <Route path="/" component={LandingPage} />
              <Route path="/sign-in">{() => (isSignedIn ? <Redirect to={organizationId && organizationId !== "null" ? "/dashboard" : "/onboarding"} /> : <SignInPage />)}</Route>
              <Route path="/sign-up">{() => (isSignedIn ? <Redirect to={organizationId && organizationId !== "null" ? "/dashboard" : "/onboarding"} /> : <SignUpPage />)}</Route>
              <Route path="/onboarding" component={OnboardingPage} />
              <Route path="/accept-invite" component={AcceptInvitePage} />

              {/* All authenticated routes — single persistent AppLayout */}
              <Route>
                {() => (
                  <AppLayout>
                    <Switch>
                      <Route path="/dashboard">{() => <Protected component={Dashboard} />}</Route>
                      <Route path="/tasks">{() => <PermissionProtected module="tasks" component={Tasks} />}</Route>
                      <Route path="/projects/:id">{() => <PermissionProtected module="projects" component={ProjectDetail} />}</Route>
                      <Route path="/projects">{() => <PermissionProtected module="projects" component={Projects} />}</Route>
                      <Route path="/workload">{() => <PermissionProtected module="projects" component={Workload} />}</Route>
                      <Route path="/orders/:id">{() => <PermissionProtected module="orders" component={SalesOrderDetail} />}</Route>
                      <Route path="/orders">{() => <PermissionProtected module="orders" component={SalesOrders} />}</Route>
                      <Route path="/quotes/:id">{() => <PermissionProtected module="quotes" component={QuoteDetail} />}</Route>
                      <Route path="/quotes">{() => <PermissionProtected module="quotes" component={Quotes} />}</Route>
                      <Route path="/purchase-orders/:id">{() => <PermissionProtected module="purchase_orders" component={PurchaseOrderDetail} />}</Route>
                      <Route path="/purchase-orders">{() => <PermissionProtected module="purchase_orders" component={PurchaseOrders} />}</Route>
                      <Route path="/purchase-requests/:id">{() => <PermissionProtected module="purchase_requests" component={PurchaseRequestDetail} />}</Route>
                      <Route path="/purchase-requests">{() => <PermissionProtected module="purchase_requests" component={PurchaseRequests} />}</Route>
                      <Route path="/leads/:id">{() => <PermissionProtected module="leads" component={LeadDetail} />}</Route>
                      <Route path="/leads">{() => <PermissionProtected module="leads" component={Leads} />}</Route>
                      <Route path="/contacts/:id">{() => <PermissionProtected module="contacts" component={ContactDetail} />}</Route>
                      <Route path="/contacts">{() => <PermissionProtected module="contacts" component={Contacts} />}</Route>
                      <Route path="/deals/:id">{() => <PermissionProtected module="deals" component={DealDetail} />}</Route>
                      <Route path="/deals">{() => <PermissionProtected module="deals" component={Deals} />}</Route>
                      <Route path="/activities">{() => <PermissionProtected module="activities" component={Activities} />}</Route>
                      <Route path="/inventory/:id">{() => <PermissionProtected module="inventory" component={InventoryDetail} />}</Route>
                      <Route path="/inventory">{() => <PermissionProtected module="inventory" component={Inventory} />}</Route>
                      <Route path="/reports">{() => <PermissionProtected module="reports" component={Reports} />}</Route>
                      <Route path="/vendors/:id">{() => <PermissionProtected module="vendors" component={VendorDetail} />}</Route>
                      <Route path="/vendors">{() => <PermissionProtected module="vendors" component={Vendors} />}</Route>
                      <Route path="/notifications">{() => <Protected component={Notifications} />}</Route>

                      {/* Settings routes with SettingsLayout nested inside AppLayout */}
                      <Route path="/settings/users">{() => <SettingsLayout><RequirePermission module="users" action="read" component={Users} /></SettingsLayout>}</Route>
                      <Route path="/settings/roles">{() => <SettingsLayout><RequirePermission module="roles" action="read" component={Roles} /></SettingsLayout>}</Route>
                      <Route path="/settings/organizations">{() => <SettingsLayout><RequirePermission module="organizations" action="read" component={OrganizationsPage} /></SettingsLayout>}</Route>
                      <Route path="/settings/branding">{() => <SettingsLayout><RequirePermission module="organizations" action="read" component={BrandingSettings} /></SettingsLayout>}</Route>
                      <Route path="/settings/discounts">{() => <SettingsLayout><RequirePermission module="organizations" action="read" component={Discounts} /></SettingsLayout>}</Route>
                      <Route path="/settings/profile">{() => <SettingsLayout><ProtectedRoute component={ProfilePage} /></SettingsLayout>}</Route>
                      <Route path="/settings/audit-logs">{() => <SettingsLayout><RequirePermission module="users" action="read" component={AuditLogs} /></SettingsLayout>}</Route>
                      <Route path="/settings/notifications">{() => <SettingsLayout><ProtectedRoute component={Notifications} /></SettingsLayout>}</Route>
                      <Route path="/settings/billing">{() => <SettingsLayout><ProtectedRoute component={Billing} /></SettingsLayout>}</Route>
                      <Route path="/settings">{() => <SettingsLayout><ProtectedRoute component={ProfilePage} /></SettingsLayout>}</Route>

                      {/* 404 */}
                      <Route>
                        <div className="flex-1 flex items-center justify-center">
                          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                        </div>
                      </Route>
                    </Switch>
                  </AppLayout>
                )}
              </Route>
            </Switch>
            </Suspense>
          </main>
        </div>
      </Router>
    </FontProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CRMProvider>
            <AppContent />
          </CRMProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
