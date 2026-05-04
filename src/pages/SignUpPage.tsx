import { useState } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabaseClient"
import { Link } from "wouter"
import { BarChart3, Loader2, ArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"

export function SignUpPage() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const { error } = await (supabase.auth as any).signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
      // Navigate after a short delay so the user sees the success message
      setTimeout(() => navigate("/dashboard"), 2000)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-teal-600/20 lg:hidden">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
          Get started
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          Create your account
        </h2>
        <p className="text-text-secondary font-medium text-sm mt-1.5">
          Enter your details to start your journey.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl">
            Account created! Redirecting you...
          </div>
        )}

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
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password || !confirmPassword}
          className="w-full mt-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign in link */}
      <p className="mt-8 text-center text-sm text-text-secondary font-medium">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
