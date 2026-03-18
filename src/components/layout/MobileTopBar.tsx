import { Menu } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

interface MobileTopBarProps {
  setMobileOpen: (open: boolean) => void;
}

export function MobileTopBar({ setMobileOpen }: MobileTopBarProps) {
  return (
    <header className="md:hidden flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-bold text-lg">CRM App</span>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
