import { useAuth } from "@/lib/AuthContext";
import { Router, Route, Switch, useLocation, Redirect } from "wouter";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/pages/LandingPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { Dashboard } from "@/pages/core/Dashboard";
import { Contacts } from "@/pages/core/Contacts";
import { ContactDetail } from "@/pages/core/ContactDetail";
import { Deals } from "@/pages/core/Deals";
import { DealDetail } from "@/pages/core/DealDetail";
import { Activities } from "@/pages/core/Activities";
import { Leads } from "@/pages/core/Leads";
import { LeadDetail } from "@/pages/LeadDetail";
import { Tasks } from "@/pages/core/Tasks";
import { Projects } from "@/pages/core/Projects";
import { ProjectDetail } from "@/pages/core/ProjectDetail";
import { Workload } from "@/pages/core/Workload";
import { SalesOrders } from "@/pages/sales/SalesOrders";
import { SalesOrderDetail } from "@/pages/sales/SalesOrderDetail";
import { Quotes } from "@/pages/sales/Quotes";
import { QuoteDetail } from "@/pages/sales/QuoteDetail";
import { PurchaseOrders } from "@/pages/logistics/PurchaseOrders";
import { PurchaseOrderDetail } from "@/pages/logistics/PurchaseOrderDetail";
import { PurchaseRequests } from "@/pages/logistics/PurchaseRequests";
import { PurchaseRequestDetail } from "@/pages/logistics/PurchaseRequestDetail";
import { Vendors } from "@/pages/logistics/Vendors";
import { VendorDetail } from "@/pages/logistics/VendorDetail";
import { Users } from "@/pages/settings/Users";
import { Roles } from "@/pages/settings/Roles";
import { OrganizationsPage } from "./pages/settings/OrganizationsPage";
import { ProfilePage } from "@/pages/settings/ProfilePage";
import { AuditLogs } from "@/pages/settings/AuditLogs";
import { Notifications } from "@/pages/settings/Notifications";
import { BrandingSettings } from "@/pages/settings/BrandingSettings";
import { Discounts } from "@/pages/settings/Discounts";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { InProgress } from "@/pages/InProgress";
import { Inventory } from "@/pages/logistics/Inventory";
import { InventoryDetail } from "@/pages/logistics/InventoryDetail";
import { Reports } from "@/pages/logistics/Reports";
import { Design } from "@/pages/Design";
import { DialogsPreview } from "@/pages/DialogsPreview";
import { Fonts } from "@/pages/Fonts";
import { Toaster } from "sonner";
import { CRMProvider, useCRMContext } from "@/lib/CRMContext";
import { useInventoryAlerts } from "@/lib/hooks/useInventoryAlerts";
import { AuthProvider, useUser } from "@/lib/AuthContext"
import { RequirePermission } from "@/components/RequirePermission";
import type { Organization } from "@/lib/types";
import { setAuthToken, subscribeAuth } from "@/lib/api";
import { logger } from "@/lib/logger";
import React, { useEffect, useRef, useState } from "react";
import { FontProvider } from "@/components/FontProvider";

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

        // Redirect to dashboard if they are already onboarded but trying to access onboarding
        if (organizationId && organizationId !== "null" && location === "/onboarding") {
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
  const appName = organizations[0]?.appName || "CRM Hub";

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  if (!authLoaded || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <FontProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
          <Toaster position="top-center" richColors />
          <main className="flex-[1_0_auto] flex flex-col">
            <InventoryAlertRunner />
            <Switch>
              {/* Public routes — no AppLayout */}
              <Route path="/" component={LandingPage} />
              <Route path="/sign-in">{() => (isSignedIn ? <Redirect to={organizationId && organizationId !== "null" ? "/dashboard" : "/onboarding"} /> : <SignInPage />)}</Route>
              <Route path="/sign-up">{() => (isSignedIn ? <Redirect to={organizationId && organizationId !== "null" ? "/dashboard" : "/onboarding"} /> : <SignUpPage />)}</Route>
              <Route path="/onboarding" component={OnboardingPage} />
              <Route path="/design">{() => <Design />}</Route>
              <Route path="/fonts">{() => <Fonts />}</Route>
              <Route path="/dialogs">{() => <DialogsPreview />}</Route>

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
                      <Route path="/in-progress">{() => <Protected component={InProgress} />}</Route>
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
