import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  User, 
  Shield, 
  Building2, 
  Bell, 
  History, 
  Settings as SettingsIcon,
  ChevronRight,
  Palette
} from "lucide-react";
import { usePermission } from "@/lib/usePermission";
import { PageHeader } from "@/components/reusables/PageHeader";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();
  const { can, hasFullAccess } = usePermission();

  const settingsLinks = [
    { href: "/settings/profile", label: "Profile", icon: User },
    { href: "/settings/notifications", label: "Notifications", icon: Bell },
    { href: "/settings/users", label: "Users", icon: User, perm: "users" },
    { href: "/settings/roles", label: "Roles", icon: Shield, perm: "roles" },
    { href: "/settings/organizations", label: "Organizations", icon: Building2, perm: "organizations" },
    { href: "/settings/branding", label: "Branding", icon: Palette, perm: "organizations" },
    { href: "/settings/discounts", label: "Discounts", icon: SettingsIcon, perm: "organizations" },
    { href: "/settings/audit-logs", label: "Audit Logs", icon: History, perm: "users" },
  ];

  const filteredLinks = settingsLinks.filter(link => {
    if (!link.perm) return true;
    if (hasFullAccess) return true;
    return can(link.perm as any, "read");
  });

  return (
    <div className="flex flex-col h-full bg-bg-base/50">
      <PageHeader 
        category="System Configuration"
        title="Settings"
        description="Manage your account preferences and system configurations."
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sub-Sidebar */}
        <aside className="w-72 border-r border-border/50 bg-bg-surface/20 backdrop-blur-sm p-6 overflow-y-auto">
          <nav className="space-y-1">
            {filteredLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-text-muted group-hover:text-text-primary")} />
                      <span className="text-sm font-medium tracking-wide">{link.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg-base/30 px-8 pt-4 pb-8">
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
