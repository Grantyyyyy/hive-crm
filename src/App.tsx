import { ClerkProvider, useAuth, useOrganization } from "@clerk/clerk-react";
import { Router, Route, Switch } from "wouter";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { LandingPage } from "@/pages/LandingPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { Dashboard } from "@/pages/core/Dashboard";
import { Contacts } from "@/pages/core/Contacts";
import { ContactDetail } from "@/pages/core/ContactDetail";
import { Deals } from "@/pages/core/Deals";
import { DealDetail } from "@/pages/core/DealDetail";
import { Activities } from "@/pages/core/Activities";
import { Leads } from "@/pages/core/Leads";
import { LeadDetail } from "@/pages/LeadDetail";
import { Tasks } from "@/pages/core/Tasks";
import { SalesOrders } from "@/pages/sales/SalesOrders";
import { Quotes } from "@/pages/sales/Quotes";
import { PurchaseOrders } from "@/pages/logistics/PurchaseOrders";
import { PurchaseRequests } from "@/pages/logistics/PurchaseRequests";
import { Users } from "@/pages/settings/Users";
import { Roles } from "@/pages/settings/Roles";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { InProgress } from "@/pages/InProgress";
import { Inventory } from "@/pages/logistics/Inventory";
import { Reports } from "@/pages/logistics/Reports";
import { Toaster } from "sonner";
import { CRMProvider } from "@/lib/CRMContext";
import React from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in .env.local");
}

function Protected({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <ProtectedRoute component={Component} />
    </AppLayout>
  );
}

function AppContent() {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const updateAuth = async () => {
      if (isSignedIn && isAuthLoaded) {
        let token = null;
        try {
          token = await getToken();
          setAuthToken(token);
        } catch (e) {
          console.error('Failed to get token:', e);
        }
      } else {
        setAuthToken(null);
      }
      setAuthReady(true);
    };
    updateAuth();

    // Refresh token every 50 seconds (Clerk tokens are short-lived)
    const interval = setInterval(updateAuth, 50000);
    return () => clearInterval(interval);
  }, [isSignedIn, isAuthLoaded]);

  useEffect(() => {
    setOrganizationId(organization?.id || null);
  }, [organization]);

  if (!isAuthLoaded || !isOrgLoaded || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
        <Toaster position="bottom-right" richColors />
        <Navbar />
        <main className="flex-[1_0_auto] flex flex-col">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/sign-in" component={SignInPage} />
            <Route path="/sign-up" component={SignUpPage} />
            <Route path="/dashboard">
              {() => <Protected component={Dashboard} />}
            </Route>
            <Route path="/tasks">
              {() => <Protected component={Tasks} />}
            </Route>
            <Route path="/orders">
              {() => <Protected component={SalesOrders} />}
            </Route>
            <Route path="/quotes">
              {() => <Protected component={Quotes} />}
            </Route>
            <Route path="/purchase-orders">
              {() => <Protected component={PurchaseOrders} />}
            </Route>
            <Route path="/purchase-requests">
              {() => <Protected component={PurchaseRequests} />}
            </Route>


            <Route path="/leads">
              {() => <Protected component={Leads} />}
            </Route>
            <Route path="/leads/:id">
              {() => <Protected component={LeadDetail} />}
            </Route>
            <Route path="/contacts">
              {() => <Protected component={Contacts} />}
            </Route>
            <Route path="/contacts/:id">
              {() => <Protected component={ContactDetail} />}
            </Route>
            <Route path="/deals">
              {() => <Protected component={Deals} />}
            </Route>
            <Route path="/activities">
              {() => <Protected component={Activities} />}
            </Route>
            <Route path="/inventory">
              {() => <Protected component={Inventory} />}
            </Route>
            <Route path="/reports">
              {() => <Protected component={Reports} />}
            </Route>
            <Route path="/settings/users">
              {() => <Protected component={Users} />}
            </Route>
            <Route path="/settings/roles">
              {() => <Protected component={Roles} />}
            </Route>
            <Route path="/in-progress">
              {() => <Protected component={InProgress} />}
            </Route>
            <Route>
              {() => <Protected component={InProgress} />}
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <CRMProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
              <Navbar />
              <main className="flex-[1_0_auto] flex flex-col">
                <Switch>
                  <Route path="/" component={LandingPage} />
                  <Route path="/sign-in" component={SignInPage} />
                  <Route path="/sign-up" component={SignUpPage} />
                  <Route path="/dashboard">
                    {() => <Protected component={Dashboard} />}
                  </Route>
                  <Route path="/tasks">
                    {() => <Protected component={Tasks} />}
                  </Route>
                  <Route path="/orders">
                    {() => <Protected component={SalesOrders} />}
                  </Route>
                  <Route path="/quotes">
                    {() => <Protected component={Quotes} />}
                  </Route>
                  <Route path="/purchase-orders">
                    {() => <Protected component={PurchaseOrders} />}
                  </Route>
                  <Route path="/purchase-requests">
                    {() => <Protected component={PurchaseRequests} />}
                  </Route>


                  <Route path="/leads">
                    {() => <Protected component={Leads} />}
                  </Route>
                  <Route path="/leads/:id">
                    {() => <Protected component={LeadDetail} />}
                  </Route>
                  <Route path="/contacts">
                    {() => <Protected component={Contacts} />}
                  </Route>
                  <Route path="/contacts/:id">
                    {() => <Protected component={ContactDetail} />}
                  </Route>
                  <Route path="/deals">
                    {() => <Protected component={Deals} />}
                  </Route>
                  <Route path="/deals/:id">
                    {() => <Protected component={DealDetail} />}
                  </Route>
                  <Route path="/activities">
                    {() => <Protected component={Activities} />}
                  </Route>
                  <Route path="/inventory">
                    {() => <Protected component={Inventory} />}
                  </Route>
                  <Route path="/reports">
                    {() => <Protected component={Reports} />}
                  </Route>
                  <Route path="/in-progress">
                    {() => <Protected component={InProgress} />}
                  </Route>
                  {/* Fallback route */}

                  <Route>
                    <div className="flex-1 flex items-center justify-center">
                      <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                    </div>
                  </Route>
                </Switch>
              </main>
            </div>
            <Toaster
              position="top-center"
              className="font-sans"
              toastOptions={{
                classNames: {
                  toast: "w-full flex items-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl p-4 font-sans text-sm font-medium text-slate-900 dark:text-slate-100",
                  title: "font-bold",
                  description: "text-slate-500 dark:text-slate-400 text-xs mt-0.5",
                  actionButton: "bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-auto",
                  cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                  icon: "w-5 h-5",
                  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40",
                  error: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40",
                  warning: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40",
                  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40",
                }
              }}
            />
          </Router>
        </CRMProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
