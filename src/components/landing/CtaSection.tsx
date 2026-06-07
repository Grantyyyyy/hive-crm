import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";

interface CtaSectionProps {
  theme: LandingTheme;
  email: string;
  onEmailChange: (email: string) => void;
}

export function CtaSection({ theme, email, onEmailChange }: CtaSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-16 lg:py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div
          className={`relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center ${isDark ? "bg-slate-900 border border-slate-800" : "bg-accent-dim border border-accent/15"
            }`}
        >
          <div className="relative space-y-6 max-w-xl mx-auto">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Ready to get organized?
            </h2>
            <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Join the small teams using Hive to run their day with a lot less stress.
              It's free to start — see for yourself.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className={`flex-1 px-5 py-3.5 rounded-2xl text-base border focus:outline-none focus:ring-2 focus:ring-accent/40 ${isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
              />
              <Link
                href={`/sign-up?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl text-base font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
              >
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </form>

            <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              No credit card needed. Cancel any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
