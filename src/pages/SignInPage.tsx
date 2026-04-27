import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  ArrowRight,
  TrendingUp,
  Fingerprint,
  Loader2,
  GitBranch,
  Mail
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
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
      const { error } = await (supabase.auth as any).signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-brand selection:text-black flex flex-col p-6 overflow-hidden">
      
      {/* 1. TOP NAV BAR */}
      <nav className="w-full flex justify-between items-center px-4 py-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer transition-all hover:scale-105">
          <div className="w-8 h-8 bg-brand rounded-none flex items-center justify-center">
            <Plus className="w-5 h-5 text-black" />
          </div>
          <span className="font-display font-black text-xl tracking-[-0.05em] uppercase text-white">Hub.</span>
        </Link>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">System Entry Gate</p>
      </nav>

      {/* 2. BENTO GRID LOGIN */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Welcome Block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-8 bg-[#0D0D0D] border border-white/5 p-12 flex flex-col justify-end min-h-[320px] rounded-[2.5rem] relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-8">
               <TrendingUp className="w-12 h-12 text-white/5 group-hover:text-brand/20 transition-colors duration-700" />
             </div>
             <div className="space-y-4">
               <div className="text-[10px] font-black uppercase tracking-[0.5em] text-brand">Secure Access</div>
               <h1 className="text-5xl md:text-7xl font-display font-black uppercase leading-[0.85] tracking-tight">Identity <br /> Validation.</h1>
             </div>
          </motion.div>

          {/* Social Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-4 bg-[#0D0D0D] border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-4"
          >
            <button className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-white/5 group">
               <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                 <Mail className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-black tracking-widest text-white/40 group-hover:text-white uppercase leading-none">Google Node</span>
            </button>
            <button className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border border-white/5 group">
               <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                 <GitBranch className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-black tracking-widest text-white/40 group-hover:text-white uppercase leading-none">Github Sync</span>
            </button>
          </motion.div>

          {/* Login Form Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-7 bg-brand/5 border border-brand/20 p-10 rounded-[2.5rem] space-y-6"
          >
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="REGISTRY EMAIL"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none focus:border-brand transition-colors text-white placeholder:text-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SECURITY TOKEN"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none focus:border-brand transition-colors text-white placeholder:text-white/20"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    Enter Protocol <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                New Operator?{" "}
                <Link href="/sign-up" className="text-brand hover:underline">
                  Register Node
                </Link>
              </p>
            </form>
          </motion.div>

          {/* Security Node Block */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-5 bg-[#0D0D0D] border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
               <Fingerprint className="w-8 h-8 text-brand" />
               <div className="w-4 h-4 rounded-full bg-brand/30 animate-pulse" />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-brand">Security L3 Active</p>
               <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">ISO-27001 / SOC2 TYPE II COMPLIANT NODE ACCESS ONLY.</p>
            </div>
          </motion.div>
        </div>
      </main>

    </div>
  );
}
