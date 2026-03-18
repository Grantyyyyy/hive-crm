import { Search, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";

export function Header() {
  const { user } = useUser();
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.username?.slice(0, 2).toUpperCase() || "AR";

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 dark:bg-slate-950/80 dark:border-slate-800">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads, products, or orders..."
            className="w-full h-11 pl-11 pr-4 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none dark:bg-slate-900 dark:focus:bg-slate-950"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full dark:border-slate-950"></span>
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2 dark:bg-slate-800"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs dark:bg-indigo-900/20 dark:border-indigo-500/20 dark:text-indigo-400">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
