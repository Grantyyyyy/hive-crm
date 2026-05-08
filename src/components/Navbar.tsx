import { Link } from "wouter";
import { useAuth, useUser } from "@/lib/AuthContext";
import { BarChart3, Moon, Sun, User, LogOut, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b glass border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/hub.svg" alt="Logo" className="w-full h-full object-contain p-1 invert" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary">Hive CRM</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          
          {isSignedIn ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-3 group outline-none">
                    <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-bold text-xs group-hover:scale-105 group-hover:ring-4 group-hover:ring-accent/10 transition-all">
                      {initials}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <p className="text-sm font-bold text-text-primary truncate">{user?.user_metadata?.full_name ?? "User"}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Link href="/dashboard" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-accent transition-all text-left">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link href="/settings/profile" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-accent transition-all text-left">
                      <User className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    <div className="h-[1px] bg-border my-2"></div>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red/80 hover:bg-red/10 hover:text-red transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
