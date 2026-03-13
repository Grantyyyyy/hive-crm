import { Link, useLocation } from "wouter";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl sm:inline-block">AuthApp</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <SignedIn>
              <Link 
                href="/dashboard" 
                className={`transition-colors hover:text-foreground/80 ${location === '/dashboard' ? 'text-foreground' : 'text-foreground/60'}`}
              >
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
