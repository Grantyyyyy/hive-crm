import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/clerk-react";
import { 
  LayoutDashboard, 
  UserRound, 
  Handshake, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  UserSearch,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check initial theme
    const stored = localStorage.getItem("crm_theme");
    if (stored === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("crm_theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/leads", label: "Leads", icon: UserSearch },
    { href: "/contacts", label: "Contacts", icon: UserRound },
    { href: "/deals", label: "Deals", icon: Handshake },
    { href: "/activities", label: "Activities", icon: Activity },
  ];

  const sidebarClass = cn(
    "fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border)] transition-[width] duration-180 ease-in-out",
    collapsed ? "w-[56px]" : "w-[220px]",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      
      <aside className={sidebarClass}>
        {/* Top Section */}
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--border-subtle)] px-4">
          <div className="flex items-center gap-3 w-full" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
            {/* App Icon (Diamond) */}
            <div className="w-3 h-3 bg-[var(--accent)] rotate-45 shrink-0" />
            
            {!collapsed && (
              <span className="text-[12px] uppercase tracking-[0.2em] text-[var(--text-primary)] font-mono">
                CRMO
              </span>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 flex flex-col w-full overflow-y-auto">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href) && link.href.length > 1);
            
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <div
                  className={cn(
                    "flex items-center h-[36px] px-4 transition-colors relative group cursor-pointer duration-120",
                    isActive 
                      ? "bg-[var(--bg-highlight)] text-[var(--text-primary)] border-l-2 border-[var(--accent)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-l-2 border-transparent"
                  )}
                  style={isActive ? {} : { borderLeftColor: "transparent" }}
                >
                  <div className="flex items-center gap-3 w-full" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                    <link.icon 
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-120", 
                        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                      )} 
                    />
                    {!collapsed && <span className="text-[12px] tracking-wide truncate">{link.label}</span>}
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-[calc(100%+8px)] hidden border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] uppercase tracking-widest text-[var(--text-primary)] group-hover:block z-50 whitespace-nowrap shadow-none">
                      {link.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-[var(--border-subtle)] p-3 shrink-0 flex flex-col gap-3">
          
          <div className={cn("flex items-center", collapsed ? "flex-col justify-center gap-4" : "justify-between px-1")}>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity duration-100 hover:opacity-85 focus:outline-none shrink-0"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {/* UserButton */}
            <div className="shrink-0 flex items-center justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => {
                const newVal = !collapsed;
                setCollapsed(newVal);
                localStorage.setItem("crm_sidebar_collapsed", String(newVal));
              }}
              className="w-8 h-8 hidden md:flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity duration-100 hover:opacity-85 focus:outline-none shrink-0"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
