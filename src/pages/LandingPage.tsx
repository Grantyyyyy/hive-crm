import { Link } from "wouter";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -z-10" />
        
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">AuthApp</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl loading-relaxed">
                A blazingly fast modern React application built from scratch with Vite, robust Clerk authentication, wouter navigation, and stunning Tailwind CSS v4 styling.
              </p>
            </div>
            
            <div className="w-full max-w-md space-y-2 pt-8">
              <SignedOut>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/sign-in">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                      Create an Account
                    </Button>
                  </Link>
                </div>
              </SignedOut>
              
              <SignedIn>
                <div className="flex justify-center">
                  <Link href="/dashboard">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
