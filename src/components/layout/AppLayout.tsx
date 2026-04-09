import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
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
    <div className="flex min-h-screen bg-bg-base text-text-primary font-sans">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[padding] ease-in-out duration-300",
          collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        )}
      >
        <MobileTopBar setMobileOpen={setMobileOpen} />
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
