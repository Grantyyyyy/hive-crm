import { Search, Bell, HelpCircle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "@/lib/ThemeProvider";

export function Header() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.slice(0, 2).toUpperCase() || "AR";

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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red border-2 border-bg-surface rounded-full"></span>
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
        <div className="h-8 w-[1px] bg-border mx-2"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
