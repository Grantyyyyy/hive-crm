import { Link } from "wouter"
import { Construction, ArrowLeft, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InProgress() {
  return (
    <div className="flex-1 bg-bg-base flex flex-col items-center justify-center p-6 min-h-screen animate-fade-in font-outfit">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon / Illustration */}
        <div className="relative inline-flex mb-4">
          <div className="w-24 h-24 bg-accent-dim rounded-[2rem] flex items-center justify-center relative z-10">
            <Construction className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-bg-surface rounded-2xl shadow-lg flex items-center justify-center z-20 border border-border">
            <Terminal className="w-5 h-5 text-text-muted" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-text-primary uppercase">Feature in progress</h1>
          <p className="text-text-muted font-medium leading-relaxed">
            We're currently building out this section of the Enterprise Suite. 
            Check back soon for advanced sales analytics and automation tools.
          </p>
        </div>

        {/* Progress Decorative Element */}
        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full w-[65%] shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="default" className="h-12 px-8 flex items-center gap-3 mx-auto">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}
