import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTopBar } from "./MobileTopBar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("crm_sidebar_collapsed") === "true");
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[padding] ease-in-out duration-200",
          collapsed ? "md:pl-16" : "md:pl-60"
        )}
      >
        <MobileTopBar setMobileOpen={setMobileOpen} />
        {/* Main Content Area */}
        {children}
      </div>
    </div>
  );
}
