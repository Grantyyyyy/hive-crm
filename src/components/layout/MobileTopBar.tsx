import { Menu } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

interface MobileTopBarProps {
  setMobileOpen: (open: boolean) => void;
}

export function MobileTopBar({ setMobileOpen }: MobileTopBarProps) {
  return (
    <header className="md:hidden flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileOpen(true)}
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-lg">CRM App</span>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
