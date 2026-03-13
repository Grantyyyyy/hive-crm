import { ClerkProvider } from "@clerk/clerk-react";
import { Router, Route, Switch } from "wouter";
import { LandingPage } from "@/pages/LandingPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { Dashboard } from "@/pages/Dashboard";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in .env.local");
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/sign-in" component={SignInPage} />
              <Route path="/sign-up" component={SignUpPage} />
              <Route path="/dashboard">
                {() => <ProtectedRoute component={Dashboard} />}
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
