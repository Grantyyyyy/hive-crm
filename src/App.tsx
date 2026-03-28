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
import { Users } from "@/pages/settings/Users";
import { Roles } from "@/pages/settings/Roles";
import { ProfilePage } from "@/pages/settings/ProfilePage";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { InProgress } from "@/pages/InProgress";
import { Inventory } from "@/pages/logistics/Inventory";
import { InventoryDetail } from "@/pages/logistics/InventoryDetail";
import { Reports } from "@/pages/logistics/Reports";
import { Design } from "@/pages/Design";
import { Fonts } from "@/pages/Fonts";
import { Toaster } from "sonner";
import { CRMProvider, useCRMContext, updateRow, insertRows } from "@/lib/CRMContext";
import { useCRMResource } from "@/lib/hooks";
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, PurchaseOrder, InventoryTransaction } from "@/lib/types";
import { runScheduledJobs } from "@/services/scheduledJobs";
import type { JobAdapter } from "@/services/types";
import { setAuthToken, setOrganizationId } from "@/lib/api";
import React, { useEffect, useRef, useMemo, useState } from "react";

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

function AutomationRunner() {
  const ctx = useCRMContext()
  const { isLoaded: quotesLoaded } = useCRMResource('quotes')
  const { isLoaded: ordersLoaded } = useCRMResource('orders')
  const { isLoaded: inventoryLoaded } = useCRMResource('inventory')
  const { isLoaded: prLoaded } = useCRMResource('purchase_requests')
  const { isLoaded: poLoaded } = useCRMResource('purchase_orders')
  const { isLoaded: txLoaded } = useCRMResource('inventory_transactions')

  const dataReady = quotesLoaded && ordersLoaded && inventoryLoaded && prLoaded && poLoaded && txLoaded
  const runOnce = useRef(false)

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0] as Quote),

    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0] as SalesOrder),

    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item: Omit<InventoryItem, 'id'>) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),

    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0] as PurchaseRequest),

    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0] as PurchaseOrder),

    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0] as InventoryTransaction),
  }), [ctx])

  useEffect(() => {
    if (dataReady && !runOnce.current) {
      runOnce.current = true
      runScheduledJobs(adapter, ctx).catch(console.error)
    }
  }, [dataReady, adapter, ctx])

  return null
}

function AppContent() {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      if (isAuthLoaded && isOrgLoaded) {
        if (isSignedIn) {
          try {
            const token = await getToken();
            setAuthToken(token);
            setOrganizationId(organization?.id || null);
          } catch (e) {
            console.error('Failed to sync auth:', e);
          }
        } else {
          setAuthToken(null);
          setOrganizationId(null);
        }
        setAuthReady(true);
      }
    };
    syncAuth();

    // Refresh token every 50 seconds if signed in
    let interval: NodeJS.Timeout;
    if (isSignedIn) {
      interval = setInterval(syncAuth, 50000);
    }
    return () => clearInterval(interval);
  }, [isSignedIn, isAuthLoaded, isOrgLoaded, getToken, organization]);

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
        <Toaster position="top-center" richColors />
        <Navbar />
        <main className="flex-[1_0_auto] flex flex-col">
          <AutomationRunner />
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
            <Route path="/projects">
              {() => <Protected component={Projects} />}
            </Route>
            <Route path="/projects/:id">
              {() => <Protected component={ProjectDetail} />}
            </Route>
            <Route path="/workload">
              {() => <Protected component={Workload} />}
            </Route>
            <Route path="/orders">
              {() => <Protected component={SalesOrders} />}
            </Route>
            <Route path="/orders/:id">
              {() => <Protected component={SalesOrderDetail} />}
            </Route>
            <Route path="/quotes">
              {() => <Protected component={Quotes} />}
            </Route>
            <Route path="/quotes/:id">
              {() => <Protected component={QuoteDetail} />}
            </Route>
            <Route path="/purchase-orders">
              {() => <Protected component={PurchaseOrders} />}
            </Route>
            <Route path="/purchase-orders/:id">
              {() => <Protected component={PurchaseOrderDetail} />}
            </Route>
            <Route path="/purchase-requests">
              {() => <Protected component={PurchaseRequests} />}
            </Route>
            <Route path="/purchase-requests/:id">
              {() => <Protected component={PurchaseRequestDetail} />}
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
            <Route path="/inventory/:id">
              {() => <Protected component={InventoryDetail} />}
            </Route>
            <Route path="/reports">
              {() => <Protected component={Reports} />}
            </Route>
            <Route path="/vendors">
              {() => <Protected component={Vendors} />}
            </Route>
            <Route path="/settings/users">
              {() => <Protected component={Users} />}
            </Route>
            <Route path="/settings/roles">
              {() => <Protected component={Roles} />}
            </Route>
            <Route path="/settings/profile">
              {() => <Protected component={ProfilePage} />}
            </Route>
            <Route path="/in-progress">
              {() => <Protected component={InProgress} />}
            </Route>
            <Route path="/design">
              {() => <Design />}
            </Route>
            <Route path="/fonts">
              {() => <Fonts />}
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
  );
}

export function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <CRMProvider>
          <AppContent />
        </CRMProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
