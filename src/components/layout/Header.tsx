import { Search, Bell, HelpCircle, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocation } from "wouter";
import { NotificationPanel } from "./NotificationPanel";
import { useCRMResource } from "@/lib/hooks";
import type { Notification } from "@/lib/types";

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const { data: notifications } = useCRMResource<Notification>('notifications');
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
      <div className="flex-1 max-w-xl">
        <button 
          onClick={onSearchClick}
          className="relative group w-full flex items-center text-left h-11 px-4 bg-bg-elevated border-transparent rounded-xl text-sm hover:bg-bg-surface hover:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none cursor-text"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors mr-3" />
          <span className="flex-1 text-slate-400">Search leads, products, or orders...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-bg-surface px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative transition-all hover:bg-accent/5 hover:text-accent">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 border-2 border-bg-surface rounded-full flex items-center justify-center text-[8px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-none" align="end" sideOffset={8}>
            <NotificationPanel />
          </PopoverContent>
        </Popover>
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
              <p className="text-sm font-bold text-text-primary truncate">{user?.user_metadata?.full_name ?? "User"}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
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
