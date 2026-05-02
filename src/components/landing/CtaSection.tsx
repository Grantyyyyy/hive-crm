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
    <section className={`py-6 lg:py-8 relative overflow-hidden ${isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900 border-t border-slate-200"}`}>
      <div className={`absolute inset-0 bg-size-[50px_50px] ${isDark ? "bg-grid-white/[0.05]" : "bg-grid-slate-900/[0.03]"}`} />
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 text-center space-y-10 relative z-10">
        <h2 className="text-5xl lg:text-8xl font-sans font-black tracking-tight uppercase leading-[0.8] mb-4">
          Ready to <br />
          <span className="text-[#0D9488]">Get Started?</span>
        </h2>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className={`flex flex-col sm:flex-row gap-0 group border-2 border-[#0D9488] rounded-3xl overflow-hidden ${isDark ? "shadow-2xl" : "shadow-lg"}`}>
            <input
              type="email"
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={`flex-1 px-8 py-5 text-sm font-black border-none focus:outline-none uppercase ${isDark ? "bg-white text-slate-900" : "bg-slate-50 text-slate-900"}`}
            />
            <Link
              href={`/sign-up?email=${encodeURIComponent(email)}`}
              className="bg-[#0D9488] px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#0F766E] transition-all flex items-center justify-center gap-4 text-white"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${isDark ? "opacity-40" : "text-slate-500"}`}>
            No credit card required. Secure and Private Deployment.
          </p>
        </div>
      </div>
    </section>
  );
}
