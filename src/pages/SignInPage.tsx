/**
 * SignInPage
 *
 * NAVBAR TIP — Hide your Navbar on this route.
 * In App.tsx, render auth pages WITHOUT AppLayout:
 *
 *   <Route path="/sign-in" component={SignInPage} />     ← no layout wrapper
 *   <Route path="/dashboard">
 *     <AppLayout><Dashboard /></AppLayout>               ← has layout
 *   </Route>
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function SignInPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
      if (error) { setError(error.message); return; }
      navigate("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── LEFT PANEL — Branding ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden
                      bg-slate-900 dark:bg-slate-950">

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[260px] h-[260px] rounded-full bg-teal-400/5 blur-[90px] pointer-events-none" />

        {/* Top — status pill */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400">
              All systems operational
            </span>
          </span>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10 space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">
            Enterprise CRM Platform
          </p>
          <h1 className="text-5xl font-bold text-white leading-[1.08] tracking-tight">
            Everything your<br />
            sales team needs<br />
            <span className="text-teal-400">in one place.</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
            Leads, deals, contacts, projects, and inventory — unified and always in sync.
          </p>
        </div>

        {/* Bottom — progress bar + trust stats */}
        <div className="relative z-10">
          {/* Segmented progress bar */}
          <div className="flex items-center gap-px mb-6">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-0.5 rounded-full"
                style={{
                  backgroundColor:
                    i < 28 ? "rgb(20 184 166 / 0.55)" : "rgb(255 255 255 / 0.07)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-8">
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "256-bit", label: "Encryption" },
              { value: "SOC 2", label: "Compliant" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white font-bold text-base">{stat.value}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16
                      bg-white dark:bg-slate-900">

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
              Welcome back
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1.5">
              Enter your credentials to continue.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-700 dark:text-red-400 text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}