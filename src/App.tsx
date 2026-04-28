import { useAuth } from "@/lib/AuthContext";
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
import { VendorDetail } from "@/pages/logistics/VendorDetail";
import { Users } from "@/pages/settings/Users";
import { Roles } from "@/pages/settings/Roles";
import { OrganizationsPage } from "./pages/settings/OrganizationsPage";
import { ProfilePage } from "@/pages/settings/ProfilePage";
import { AuditLogs } from "@/pages/settings/AuditLogs";
import { Notifications } from "@/pages/settings/Notifications";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { InProgress } from "@/pages/InProgress";
import { Inventory } from "@/pages/logistics/Inventory";
import { InventoryDetail } from "@/pages/logistics/InventoryDetail";
import { Reports } from "@/pages/logistics/Reports";
import { Design } from "@/pages/Design";
import { DialogsPreview } from "@/pages/DialogsPreview";
import { Fonts } from "@/pages/Fonts";
import { Toaster } from "sonner";
import { CRMProvider, useCRMContext, updateRow, insertRows } from "@/lib/CRMContext";
import { useCRMResource } from "@/lib/hooks";
import { useInventoryAlerts } from "@/lib/hooks/useInventoryAlerts";
import { AuthProvider, useUser } from "@/lib/AuthContext"
import { RequirePermission } from "@/components/RequirePermission";
import type { Quote, SalesOrder, InventoryItem, PurchaseRequest, PurchaseOrder, InventoryTransaction, Task, PurchaseReceipt, PurchaseReceiptItem, ReturnToSupplier } from "@/lib/types";
import { runScheduledJobs } from "@/services/scheduledJobs";
import type { JobAdapter } from "@/services/types";
import { setAuthToken, subscribeAuth } from "@/lib/api";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { FontProvider } from "@/components/FontProvider";

function Protected({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <ProtectedRoute component={Component} />
    </AppLayout>
  );
}

function PermissionProtected({ module, action = "read", component: Component }: { module: string, action?: string, component: React.ComponentType }) {
  return (
    <AppLayout>
      <RequirePermission module={module} action={action} component={Component} />
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

  const { isLoaded: receiptsLoaded } = useCRMResource('purchase_receipts')
  const { isLoaded: rtsLoaded } = useCRMResource('return_to_suppliers')

  const dataReady = quotesLoaded && ordersLoaded && inventoryLoaded && prLoaded && poLoaded && txLoaded && receiptsLoaded && rtsLoaded
  const runOnce = useRef(false)

  const adapter = useMemo<JobAdapter>(() => ({
    getQuotes: () => ctx.getResource<Quote>('quotes').data,
    updateQuote: (id, patch) => updateRow<Quote>(ctx, 'quotes', id, patch),
    insertQuote: (q) => insertRows<Quote>(ctx, 'quotes', [q as any]).then(rows => rows[0] as Quote),

    getSalesOrders: () => ctx.getResource<SalesOrder>('orders').data,
    updateSalesOrder: (id, patch) => updateRow<SalesOrder>(ctx, 'orders', id, patch),
    updateSalesOrderItem: async (orderId, itemId, patch) => {
      const order = ctx.getResource<SalesOrder>('orders').data.find(o => o.id === orderId);
      if (!order) return;
      const updatedItems = order.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<SalesOrder>(ctx, 'orders', orderId, { items: updatedItems });
    },
    insertSalesOrder: (o) => insertRows<SalesOrder>(ctx, 'orders', [o as any]).then(rows => rows[0] as SalesOrder),

    getInventoryItems: () => ctx.getResource<InventoryItem>('inventory').data,
    updateInventoryItem: (id, patch) => updateRow<InventoryItem>(ctx, 'inventory', id, patch),
    insertInventoryItem: (item: Omit<InventoryItem, 'id'>) => insertRows<InventoryItem>(ctx, 'inventory', [item as any]).then(rows => rows[0] as InventoryItem),

    getPurchaseRequests: () => ctx.getResource<PurchaseRequest>('purchase_requests').data,
    updatePurchaseRequest: (id, patch) => updateRow<PurchaseRequest>(ctx, 'purchase_requests', id, patch),
    insertPurchaseRequest: (pr) => insertRows<PurchaseRequest>(ctx, 'purchase_requests', [pr as any]).then(rows => rows[0] as PurchaseRequest),

    getPurchaseOrders: () => ctx.getResource<PurchaseOrder>('purchase_orders').data,
    updatePurchaseOrder: (id, patch) => updateRow<PurchaseOrder>(ctx, 'purchase_orders', id, patch),
    updatePurchaseOrderItem: async (poId, itemId, patch) => {
      const po = ctx.getResource<PurchaseOrder>('purchase_orders').data.find(p => p.id === poId);
      if (!po) return;
      const updatedItems = po.items.map(item => item.id === itemId ? { ...item, ...patch } : item);
      await updateRow<PurchaseOrder>(ctx, 'purchase_orders', poId, { items: updatedItems as any });
    },
    insertPurchaseOrder: (po) => insertRows<PurchaseOrder>(ctx, 'purchase_orders', [po as any]).then(rows => rows[0] as PurchaseOrder),

    getInventoryTransactions: () => ctx.getResource<InventoryTransaction>('inventory_transactions').data,
    insertInventoryTransaction: (tx) => insertRows<InventoryTransaction>(ctx, 'inventory_transactions', [tx as any]).then(rows => rows[0] as InventoryTransaction),

    getTasks: () => ctx.getResource<Task>('tasks').data,
    updateTask: (id, patch) => updateRow<Task>(ctx, 'tasks', id, patch),

    getPurchaseReceipts: () => ctx.getResource<PurchaseReceipt>('purchase_receipts').data,
    getPurchaseReceiptItems: () => ctx.getResource<PurchaseReceiptItem>('purchase_receipt_items').data,
    insertPurchaseReceipt: (r) => insertRows<PurchaseReceipt>(ctx, 'purchase_receipts', [r as any]).then(rows => rows[0] as PurchaseReceipt),
    insertPurchaseReceiptItem: (i) => insertRows<PurchaseReceiptItem>(ctx, 'purchase_receipt_items', [i as any]).then(rows => rows[0] as PurchaseReceiptItem),

    getReturnToSuppliers: () => ctx.getResource<ReturnToSupplier>('return_to_suppliers').data,
    insertReturnToSupplier: (rts) => insertRows<ReturnToSupplier>(ctx, 'return_to_suppliers', [rts as any]).then(rows => rows[0] as ReturnToSupplier),
    updateReturnToSupplier: (id, patch) => updateRow<ReturnToSupplier>(ctx, 'return_to_suppliers', id, patch),

    runAtomicUpdate: (ops) => ctx.runAtomicUpdate(ops),
  }), [ctx])

  useEffect(() => {
    if (dataReady && !runOnce.current) {
      runOnce.current = true
      runScheduledJobs(adapter, ctx).catch(console.error)
    }
    if (dataReady) {
      const interval = setInterval(() => {
        runScheduledJobs(adapter, ctx).catch(console.error)
      }, 60_000)
      return () => clearInterval(interval)
    }
  }, [dataReady, adapter, ctx])

  return null
}

function InventoryAlertRunner() {
  useInventoryAlerts()
  return null
}

function AppContent() {
  const { isSignedIn, isLoaded: authLoaded, getToken, userId } = useAuth();
  const { user } = useUser();
  const [authReady, setAuthReady] = useState(false);

  /**
   * Synchronizes Supabase auth state with the app's API layer.
   * - Stores the Supabase access token for API requests
   * - Supabase auto-refreshes sessions, so no manual refresh interval needed
   */
  useEffect(() => {
    if (authLoaded) {
      if (isSignedIn) {
        // Cache the token for the legacy API layer
        getToken().then(token => {
          if (token) setAuthToken(token);
        });
      } else {
        setAuthToken(null);
      }
      setAuthReady(true);
    }
  }, [isSignedIn, authLoaded, getToken]);

  /**
   * Subscribe to Supabase session changes and propagate token to the API layer.
   */
  useEffect(() => {
    return subscribeAuth(({ token }) => {
      if (token) setAuthToken(token);
    });
  }, []);

  /**
   * Sync the current Supabase user into app_users on first load.
   */
  useEffect(() => {
    if (!user || !userId) return;
    import("@/lib/settingsService").then(async ({ upsertCurrentUser }) => {
      try {
        const { supabase } = await import("@/lib/supabaseClient");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const client = supabase;
        await upsertCurrentUser(client, {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
          username: user.user_metadata?.user_name ?? undefined,
        }, userId);
      } catch (e) {
        console.error("Failed to sync current user:", e);
      }
    });
  }, [user, userId]);

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
          <Navbar />
          <main className="flex-[1_0_auto] flex flex-col">
            <AutomationRunner />
            <InventoryAlertRunner />
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/sign-in" component={SignInPage} />
              <Route path="/sign-up" component={SignUpPage} />
              <Route path="/dashboard">
                {() => <Protected component={Dashboard} />}
              </Route>
              <Route path="/tasks">
                {() => <PermissionProtected module="tasks" component={Tasks} />}
              </Route>
              <Route path="/projects">
                {() => <PermissionProtected module="projects" component={Projects} />}
              </Route>
              <Route path="/projects/:id">
                {() => <PermissionProtected module="projects" component={ProjectDetail} />}
              </Route>
              <Route path="/workload">
                {() => <PermissionProtected module="projects" component={Workload} />}
              </Route>
              <Route path="/orders">
                {() => <PermissionProtected module="orders" component={SalesOrders} />}
              </Route>
              <Route path="/orders/:id">
                {() => <PermissionProtected module="orders" component={SalesOrderDetail} />}
              </Route>
              <Route path="/quotes">
                {() => <PermissionProtected module="quotes" component={Quotes} />}
              </Route>
              <Route path="/quotes/:id">
                {() => <PermissionProtected module="quotes" component={QuoteDetail} />}
              </Route>
              <Route path="/purchase-orders">
                {() => <PermissionProtected module="purchase_orders" component={PurchaseOrders} />}
              </Route>
              <Route path="/purchase-orders/:id">
                {() => <PermissionProtected module="purchase_orders" component={PurchaseOrderDetail} />}
              </Route>
              <Route path="/purchase-requests">
                {() => <PermissionProtected module="purchase_requests" component={PurchaseRequests} />}
              </Route>
              <Route path="/purchase-requests/:id">
                {() => <PermissionProtected module="purchase_requests" component={PurchaseRequestDetail} />}
              </Route>
              <Route path="/leads">
                {() => <PermissionProtected module="leads" component={Leads} />}
              </Route>
              <Route path="/leads/:id">
                {() => <PermissionProtected module="leads" component={LeadDetail} />}
              </Route>
              <Route path="/contacts">
                {() => <PermissionProtected module="contacts" component={Contacts} />}
              </Route>
              <Route path="/contacts/:id">
                {() => <PermissionProtected module="contacts" component={ContactDetail} />}
              </Route>
              <Route path="/deals">
                {() => <PermissionProtected module="deals" component={Deals} />}
              </Route>
              <Route path="/deals/:id">
                {() => <PermissionProtected module="deals" component={DealDetail} />}
              </Route>
              <Route path="/activities">
                {() => <PermissionProtected module="activities" component={Activities} />}
              </Route>
              <Route path="/inventory">
                {() => <PermissionProtected module="inventory" component={Inventory} />}
              </Route>
              <Route path="/inventory/:id">
                {() => <PermissionProtected module="inventory" component={InventoryDetail} />}
              </Route>
              <Route path="/reports">
                {() => <PermissionProtected module="reports" component={Reports} />}
              </Route>
              <Route path="/vendors">
                {() => <PermissionProtected module="vendors" component={Vendors} />}
              </Route>
              <Route path="/vendors/:id">
                {() => <PermissionProtected module="vendors" component={VendorDetail} />}
              </Route>
              <Route path="/settings/users">
                {() => <PermissionProtected module="users" component={Users} />}
              </Route>
              <Route path="/settings/roles">
                {() => <PermissionProtected module="roles" component={Roles} />}
              </Route>
              <Route path="/settings/organizations">
                {() => <PermissionProtected module="organizations" component={OrganizationsPage} />}
              </Route>
              <Route path="/settings/profile">
                {() => <Protected component={ProfilePage} />}
              </Route>
              <Route path="/settings/audit-logs">
                {() => <PermissionProtected module="users" component={AuditLogs} />}
              </Route>
              <Route path="/notifications">
                {() => <Protected component={Notifications} />}
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
              <Route path="/dialogs">
                {() => <DialogsPreview />}
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
    </FontProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CRMProvider>
          <AppContent />
        </CRMProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
