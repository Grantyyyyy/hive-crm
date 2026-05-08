import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useAuth } from "@/lib/AuthContext";
import { usePermission } from "@/lib/usePermission";
import { supabase } from "@/lib/supabaseClient";
import { useCRMContext } from "@/lib/CRMContext";
import {
  LayoutDashboard,
  Users,
  Handshake,
  UserSearch,
  FileText,
  ShoppingBag,
  Package,
  BarChart3,
  UserCog,
  Shield,
  CheckSquare,
  Activity,
  ScrollText,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  FolderOpen,
  LogOut,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Organization } from "@/lib/types";


interface NavLink {
  href: string;
  label: string;
  icon: any;
  perm?: string;
}

interface NavGroup {
  title: string;
  links: NavLink[];
}


interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { userId, signOut, isLoaded, orgName } = useAuth();
  const { can, hasFullAccess, isLoaded: permLoaded } = usePermission();
  const ctx = useCRMContext();
  const { data: organizations } = ctx.getResource<Organization>("organizations");
  const org = organizations[0];
  const [roleName, setRoleName] = useState<string | null>(null);

  // Preserve sidebar nav scroll position across remounts (e.g. Protected ↔ PermissionProtected)
  const navRef = useRef<HTMLElement>(null);
  const SCROLL_KEY = "sidebar_nav_scroll";

  // On mount: restore persisted scroll position
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(SCROLL_KEY) ?? "0", 10);
    requestAnimationFrame(() => {
      if (navRef.current) {
        navRef.current.scrollTop = stored;
      }
    });
  }, []);

  // After each route change: re-apply the stored scroll (browser may reset it)
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(SCROLL_KEY) ?? "0", 10);
    requestAnimationFrame(() => {
      if (navRef.current) {
        navRef.current.scrollTop = stored;
      }
    });
  }, [location]);

  // Fetch role name from app_users + roles tables
  useEffect(() => {
    if (!isLoaded || !userId) {
      setRoleName(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('app_users')
      .select('roles(name)')
      .eq('auth_user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && (data as any)?.roles) {
          setRoleName((data as any).roles.name);
        } else if (!cancelled) {
          setRoleName(null);
        }
      });
    return () => { cancelled = true; };
  }, [userId, isLoaded]);

  const displayName = user?.user_metadata?.full_name
    ?? user?.email?.split("@")[0]
    ?? "User";
  const displayRole = roleName ?? "Member";
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  // Define nav groups with permission requirements
  // Organized by workflow: Overview → Pipeline → Projects → Sales → Supply Chain → Reports → Settings
  const navGroups: NavGroup[] = useMemo(() => [
    {
      title: "Overview",
      links: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Pipeline",
      links: [
        { href: "/leads", label: "Leads", icon: UserSearch, perm: "leads" as const },
        { href: "/contacts", label: "Contacts", icon: Users, perm: "contacts" as const },
        { href: "/deals", label: "Deals", icon: Handshake, perm: "deals" as const },
        { href: "/activities", label: "Activities", icon: Activity, perm: "activities" as const },
      ]
    },
    {
      title: "Projects",
      links: [
        { href: "/projects", label: "Projects", icon: FolderOpen, perm: "projects" as const },
        { href: "/tasks", label: "Tasks", icon: CheckSquare, perm: "tasks" as const },
        { href: "/workload", label: "Workload", icon: UserCog, perm: "projects" as const },
      ]
    },
    {
      title: "Sales",
      links: [
        { href: "/quotes", label: "Quotes", icon: FileText, perm: "quotes" as const },
        { href: "/orders", label: "Orders", icon: ShoppingBag, perm: "orders" as const },
      ]
    },
    {
      title: "Supply Chain",
      links: [
        { href: "/inventory", label: "Inventory", icon: Package, perm: "inventory" as const },
        { href: "/purchase-orders", label: "P. Orders", icon: ScrollText, perm: "purchase_orders" as const },
        { href: "/purchase-requests", label: "P. Requests", icon: Layers, perm: "purchase_requests" as const },
        { href: "/vendors", label: "Vendors", icon: Building2, perm: "vendors" as const },
      ]
    },
    {
      title: "Reports",
      links: [
        { href: "/reports", label: "Reports", icon: BarChart3, perm: "reports" as const },
      ]
    },
    {
      title: "System",
      links: [
        { href: "/settings", label: "Settings", icon: SettingsIcon },
      ]
    },
  ], [])

  // Filter nav links based on permissions (only hide if permissions are loaded and user doesn't have full access)
  const groups = useMemo(() => {
    return navGroups.map(group => ({
      ...group,
      links: group.links.filter(link => {
        // No perm required — always visible (dashboard, profile)
        if (!link.perm) return true
        // Permissions not loaded yet — hide until we know (prevents flashing)
        if (!permLoaded) return false
        // Full access bypass
        if (hasFullAccess) return true
        // Check for read permission on the module
        return can(link.perm!, "read")
      }),
    })).filter(group => group.links.length > 0) // drop empty groups
  }, [navGroups, permLoaded, hasFullAccess, can])

  const sidebarClass = cn(
    "fixed inset-y-0 left-0 z-50 flex flex-col bg-bg-surface border-r border-border transition-[width] duration-300 ease-in-out",
    collapsed ? "w-[72px]" : "w-[260px]",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  );

  // ── User avatar + sign-out popover (non-collapsed) ──────────────────────
  const UserMenu = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 w-full p-1 rounded-xl hover:bg-bg-elevated/50 transition-colors cursor-pointer">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-bold text-xs">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-sm font-semibold text-text-primary truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-text-muted font-medium truncate uppercase tracking-tight">
                {displayRole}
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="top">
        <div className="px-3 py-2 border-b border-border mb-2">
          <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
          <p className="text-xs text-text-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => { signOut(); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red/80 hover:bg-red/10 hover:text-red transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </PopoverContent>
    </Popover>
  );

  // ── Compact avatar for collapsed sidebar ────────────────────────────────
  const CompactUserAvatar = () => (
    <button
      onClick={() => signOut()}
      className="w-9 h-9 shrink-0 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-bold text-xs hover:ring-2 hover:ring-accent/30 transition-all cursor-pointer"
      title={`Sign out (${displayName})`}
    >
      {initials}
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        {/* Top Section / Logo */}
        <div className={cn("flex h-20 shrink-0 items-center transition-all duration-300", collapsed ? "px-0 justify-center" : "px-6")}>
          <div className={cn("flex items-center gap-3 overflow-hidden", collapsed ? "w-auto" : "w-full")}>
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img src={org?.appLogoUrl || "/hub.svg"} alt="Logo" className="w-full h-full object-contain p-1.5 invert" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-bold text-text-primary truncate leading-tight">
                  {org?.appName || "Hive CRM"}
                </span>
                <span className="text-[11px] text-text-muted font-medium truncate uppercase tracking-wider">
                  {org?.appTagline || "Enterprise Suite"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav ref={navRef as React.Ref<HTMLElement>} className="flex-1 py-4 flex flex-col w-full overflow-y-auto px-3 scrollbar-hide">
          {groups.map((group, groupIdx) => (
            <div key={group.title} className={cn("mb-6", groupIdx === 0 && "mt-2")}>
              {!collapsed && (
                <h3 className="px-4 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-text-muted">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href) && link.href.length > 1);

                  return (
                    <Link key={link.href} href={link.href} onClick={() => { localStorage.setItem(SCROLL_KEY, String(navRef.current?.scrollTop ?? 0)); setMobileOpen(false); }}>
                      <div
                        className={cn(
                          "flex items-center h-11 px-4 rounded-xl transition-all relative group cursor-pointer",
                          isActive
                            ? "bg-accent-dim text-accent font-semibold shadow-sm shadow-accent/5"
                            : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                        )}
                      >
                        <div className="flex items-center gap-3 w-full" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                          <link.icon
                            className={cn(
                              "w-[18px] h-[18px] shrink-0 transition-colors",
                              isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                            )}
                          />
                          {!collapsed && (
                            <span
                              className={cn(
                                "text-[13px] tracking-wide truncate transition-colors",
                                isActive ? "text-text-primary font-bold" : "text-inherit"
                              )}
                            >
                              {link.label}
                            </span>
                          )}
                        </div>

                        {/* Tooltip for collapsed state */}
                        {collapsed && (
                          <div className="absolute left-[calc(100%+12px)] hidden bg-text-primary text-bg-surface px-3 py-1.5 rounded-lg text-xs font-medium group-hover:block z-50 whitespace-nowrap shadow-xl animate-in fade-in slide-in-from-left-2">
                            {link.label}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Organization Name */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Organization</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{orgName ?? '—'}</p>
            </div>
          </div>
        )}

        {/* Bottom Section - User Profile */}
        <div className="p-4 border-t border-border shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <UserMenu />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                className="p-1.5 h-8 w-8 text-text-muted shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <CompactUserAvatar />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                className="p-1.5 h-8 w-8 text-text-muted"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
