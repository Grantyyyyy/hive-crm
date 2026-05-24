import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  User, 
  Shield, 
  Building2, 
  Bell, 
  History, 
  Settings as SettingsIcon,
  Palette,
  CreditCard,
  ChevronDown,
  MoreHorizontal
 } from "lucide-react";
 import { usePermission } from "@/lib/usePermission";
import { usePlan } from "@/lib/usePlan";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();
  const { can, hasFullAccess } = usePermission();
  const { canAccess } = usePlan();

  const settingsLinks = [
    { href: "/settings/profile", label: "Profile", icon: User },
    { href: "/settings/users", label: "Users", icon: User, perm: "users" },
    { href: "/settings/organizations", label: "Organizations", icon: Building2, perm: "organizations" },
    { href: "/settings/billing", label: "Billing", icon: CreditCard },
    { href: "/settings/notifications", label: "Notifications", icon: Bell },
    { href: "/settings/roles", label: "Roles", icon: Shield, perm: "roles" },
    { href: "/settings/branding", label: "Branding", icon: Palette, perm: "organizations" },
    { href: "/settings/discounts", label: "Discounts", icon: SettingsIcon, perm: "organizations" },
    { href: "/settings/audit-logs", label: "Audit Logs", icon: History, perm: "users" },
  ];

  const filteredLinks = settingsLinks.filter(link => {
    if (link.href === "/settings/roles" && !canAccess('customRoles')) return false;
    if (!link.perm) return true;
    if (hasFullAccess) return true;
    return can(link.perm as any, "read");
  });

  const mainLinks = filteredLinks.slice(0, 4);
  const moreLinks = filteredLinks.slice(4);
  const isMoreActive = moreLinks.some(link => location === link.href);

  return (
    <div className="flex flex-col h-full bg-bg-base/50 overflow-hidden">
      {/* Settings Top Navigation Section */}
      <div className="border-b border-border/50 bg-bg-surface/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {mainLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-3.5 transition-all duration-200 cursor-pointer group relative whitespace-nowrap",
                      isActive
                        ? "text-accent"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <link.icon className={cn(
                      "w-[18px] h-[18px] transition-colors", 
                      isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                    )} />
                    <span className={cn(
                      "text-[13px] font-bold tracking-wide",
                      isActive ? "text-accent" : "text-text-secondary"
                    )}>
                      {link.label}
                    </span>
                    
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--accent-rgb),0.3)]" />
                    )}
                  </div>
                </Link>
              );
            })}

            {moreLinks.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-3.5 transition-all duration-200 cursor-pointer group relative whitespace-nowrap",
                      isMoreActive
                        ? "text-accent"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <MoreHorizontal className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      isMoreActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                    )} />
                    <span className={cn(
                      "text-[13px] font-bold tracking-wide",
                      isMoreActive ? "text-accent" : "text-text-secondary"
                    )}>
                      More
                    </span>
                    <ChevronDown className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      isMoreActive ? "text-accent" : "text-text-muted"
                    )} />
                    
                    {isMoreActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--accent-rgb),0.3)]" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden">
                  <div className="grid gap-1">
                    {moreLinks.map((link) => {
                      const isActive = location === link.href;
                      return (
                        <Link key={link.href} href={link.href}>
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                              isActive
                                ? "bg-accent/10 text-accent"
                                : "text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-text-primary"
                            )}
                          >
                            <link.icon className={cn(
                              "w-4 h-4 transition-colors",
                              isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                            )} />
                            <span className="text-[13px] font-semibold">
                              {link.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </nav>
        </div>
      </div>

      {/* Settings Content Area */}
      <main className="flex-1 overflow-y-auto bg-bg-base/30 px-4 md:px-8 pt-4 pb-8">
        <div className="max-w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
