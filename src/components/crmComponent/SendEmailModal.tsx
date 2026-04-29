import { useState, useEffect } from "react"
import { X, Send, FileText, Mail, Check } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Quote, SalesOrder } from "@/lib/types"

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document:
  | { type: "quote"; data: Quote }
  | { type: "invoice"; data: SalesOrder }
  | null
  customerEmail?: string
  onSuccess?: () => void
}

export function SendEmailModal({ open, onOpenChange, document, customerEmail: contactEmail, onSuccess }: SendEmailModalProps) {
  const [customerEmail, setCustomerEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Sync fields when document changes
  useEffect(() => {
    if (open && document) {
      if (document.type === "quote") {
        setSubject(`Quote #${document.data.quoteNumber} from Your Company`)
      } else {
        setSubject(`Invoice #${document.data.orderNumber} from Your Company`)
      }
      setMessage("")
      if (contactEmail) {
        setCustomerEmail(contactEmail)
      }
    }
  }, [open, document?.data?.id, contactEmail])

  const isQuote = document?.type === "quote"
  const items = document?.data.items || []
  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0)
  const currency = document?.data.currency || "USD"
  const docNumber = document
    ? (document.type === "quote"
      ? (document.data as Quote).quoteNumber
      : (document.data as SalesOrder).orderNumber)
    : ""
  const customerName = document?.data.customerName || ""

  const currencySymbol = (curr: string) => ({ USD: "$", EUR: "€", GBP: "£" }[curr] || "$")
  const fmt = (amt: number) => `${currencySymbol(currency)}${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`

  const handleSend = async () => {
    if (!document || !customerEmail.trim()) {
      toast.error("Customer email is required")
      return
    }

    setIsSending(true)
    try {
      if (isQuote) {
        const { sendQuoteEmail } = await import("@/services/emailService")
        await sendQuoteEmail(document.data as Quote, customerEmail.trim(), message || undefined)
      } else {
        const { sendInvoiceEmail } = await import("@/services/emailService")
        await sendInvoiceEmail(document.data as SalesOrder, customerEmail.trim(), message || undefined)
      }
      toast.success("Email Sent", {
        description: `${isQuote ? "Quote" : "Invoice"} #${docNumber} emailed to ${customerEmail}.`,
      })

      // Audit log
      const { supabase } = await import("@/lib/supabaseClient")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        let organizationId = null
        if (session?.access_token) {
          try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]))
            organizationId = payload?.org_id ?? null
          } catch {}
        }
        supabase.from('audit_log').insert({
          entity_type: isQuote ? 'quotes' : 'orders',
          entity_id: document.data.id,
          action: isQuote ? 'EMAIL_SENT' : 'INVOICE_EMAILED',
          changed_by: user.id,
          organization_id: organizationId,
          diff: { email: customerEmail, timestamp: new Date().toISOString() }
        }).then(({ error }: any) => {
          if (error) console.error("Failed to emit audit log:", error)
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (e: unknown) {
      toast.error("Failed to send email", {
        description: (e as Error).message || "Check server logs for details.",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onClose={handleClose}
        className="max-w-2xl bg-slate-50 dark:bg-slate-950 border-none rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center border border-teal-100/50 dark:border-teal-800/50 shadow-inner">
                <Mail className="size-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                  Send {isQuote ? "Quote" : "Invoice"}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                  #{docNumber} • {customerName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Customer Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Customer Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all dark:text-slate-200"
              autoFocus
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all dark:text-slate-200"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Custom Message <span className="text-slate-300 dark:text-slate-600">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to include in the email..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none dark:text-slate-200 placeholder:text-slate-300"
            />
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Attachment & Summary
              </span>
            </div>

            <div className="space-y-1">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-bold tabular-nums shrink-0 ml-4">
                    {fmt(item.quantity * item.price)}
                  </span>
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-[10px] font-bold text-slate-400">+{items.length - 5} more items</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-lg font-black text-teal-600 dark:text-teal-400 tabular-nums">
                {fmt(total)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Check className="w-3.5 h-3.5 text-teal-500" />
              PDF will be attached: {isQuote ? "Quote" : "Invoice"}_{isQuote ? (document.data as Quote).quoteNumber : (document.data as SalesOrder).orderNumber}.pdf
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <Button variant="ghost" onClick={handleClose} className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSend}
            disabled={isSending || !customerEmail.trim()}
            className={cn(
              "h-9 px-8 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95",
              (!customerEmail.trim() || isSending) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Email
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
