import { ClerkProvider, useAuth, useOrganization } from "@clerk/clerk-react";
import { Router, Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { LandingPage } from "@/pages/LandingPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { Dashboard } from "@/pages/core/Dashboard";
import { Contacts } from "@/pages/core/Contacts";
import { ContactDetail } from "@/pages/core/ContactDetail";
import { Deals } from "@/pages/core/Deals";
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
import { setAuthToken, setOrganizationId } from "@/lib/api";
import React, { useEffect, useState } from "react";

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
      <AppContent />
    </ClerkProvider>
  );
}

export default App;
