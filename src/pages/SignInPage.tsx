import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AuthLayout } from "@/components/layout/AuthLayout";

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
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
          Welcome back
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          Sign in to your account
        </h2>
        <p className="text-text-secondary font-medium text-sm mt-1.5">
          Enter your credentials to continue.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-600 dark:text-red-400 text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
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
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-colors flex items-center justify-center gap-2"
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
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-text-secondary font-medium">
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
          Request access
        </Link>
      </p>
    </AuthLayout>
  );
}