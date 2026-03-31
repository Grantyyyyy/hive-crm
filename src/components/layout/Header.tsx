import { Search, Bell, HelpCircle, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/lib/ThemeProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocation } from "wouter";
import { getUserInitials } from "@/lib/helpers";

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const initials = getUserInitials(user);

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search leads, products, or orders..."
            className="w-full h-11 pl-11 pr-4 bg-bg-elevated border-transparent rounded-xl text-sm focus:bg-bg-surface focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative transition-all hover:bg-accent/5 hover:text-accent">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red border-2 border-bg-surface rounded-full"></span>
        </Button>
        <Button variant="ghost" size="icon" className="transition-all hover:bg-accent/5 hover:text-accent">
          <HelpCircle className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="transition-all hover:bg-accent/5 hover:text-accent">
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
        <div className="h-8 w-[1px] bg-border mx-2"></div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 pl-2 group outline-none">
              <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-bold text-xs group-hover:scale-105 group-hover:ring-4 group-hover:ring-accent/10 transition-all">
                {initials}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="px-3 py-2 border-b border-border mb-2">
              <p className="text-sm font-bold text-text-primary truncate">{user?.fullName || "User"}</p>
              <p className="text-xs text-text-muted truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setLocation("/settings/profile")}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-accent transition-all text-left"
              >
                <User className="w-4 h-4" />
                Profile Settings
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-accent transition-all text-left">
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
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
    </header>
  );
}
