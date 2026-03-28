import { Link } from "wouter";
import { SignedOut } from "@clerk/clerk-react";
import { BarChart3, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "./ui/button";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <SignedOut>
      <header className="sticky top-0 z-50 w-full border-b bg-bg-surface/70 backdrop-blur-md border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-text-primary">Enterprise CRM</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <div className="flex items-center space-x-6">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>
    </SignedOut>
  );
}
