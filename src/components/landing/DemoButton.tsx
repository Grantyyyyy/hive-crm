import { useState } from "react"
import { useLocation } from "wouter"
import { PlayCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startDemo } from "@/lib/startDemo"

/** "Try live demo" CTA — spins up an isolated, pre-seeded demo workspace. */
export function DemoButton({ className }: { className?: string }) {
  const [, navigate] = useLocation()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      await startDemo()
      navigate("/dashboard")
    } catch (e) {
      setLoading(false)
      toast.error("Couldn't start the demo", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Setting up demo…
        </>
      ) : (
        <>
          <PlayCircle className="w-5 h-5" />
          Try live demo
        </>
      )}
    </button>
  )
}
