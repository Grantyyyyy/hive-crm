import { ClerkProvider } from "@clerk/clerk-react";
import { Router, Route, Switch } from "wouter";
import { LandingPage } from "@/pages/LandingPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { Dashboard } from "@/pages/Dashboard";
import { Contacts } from "@/pages/Contacts";
import { ContactDetail } from "@/pages/ContactDetail";
import { Deals } from "@/pages/Deals";
import { Activities } from "@/pages/Activities";
import { Leads } from "@/pages/Leads";
import { LeadDetail } from "@/pages/LeadDetail";
import { Tasks } from "@/pages/Tasks";
import { SalesOrders } from "@/pages/SalesOrders";
import { Quotes } from "@/pages/Quotes";
// import { TaskDetail } from "@/pages/TaskDetail";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { InProgress } from "@/pages/InProgress";
import { Inventory } from "@/pages/Inventory";
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

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
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
      </Router>
    </ClerkProvider>
  );
}

export default App;
