import { Link } from "wouter";
import { SignedOut } from "@clerk/clerk-react";
import { BarChart3 } from "lucide-react";

export function Navbar() {
  return (
    <SignedOut>
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Enterprise CRM</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:bg-indigo-700 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
    </SignedOut>
  );
}
