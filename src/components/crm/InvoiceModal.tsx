import { useRef } from "react"
import { X, Printer, Download, Building2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SalesOrder } from "@/lib/types"

interface InvoiceModalProps {
  order: SalesOrder | null
  onClose: () => void
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  if (!order) return null

  const handlePrint = () => {
    const content = invoiceRef.current?.innerHTML
    if (!content) return
    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${order.orderNumber}</title>
        <meta charset="utf-8" />
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #fff; padding: 40px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
          .logo-box { width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
          h1.company { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 8px; }
          .invoice-badge { background: #eef2ff; color: #4f46e5; padding: 6px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
          .number { font-size: 28px; font-weight: 900; color: #0f172a; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; padding: 24px; background: #f8fafc; border-radius: 12px; }
          .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; }
          .meta-value { font-size: 14px; font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          thead tr { background: #f1f5f9; }
          th { padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; text-align: left; }
          td { padding: 14px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .total-row td { font-size: 15px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 20px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
          .status-badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 400)
  }

  const currency = order.currency || "USD"
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
  const issueDate = new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const dueDate = new Date(new Date(order.orderDate).getTime() + 30 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const badgeColor: Record<string, string> = {
    pending:   "bg-amber-50 text-amber-700 ring-amber-200",
    shipped:   "bg-blue-50 text-blue-700 ring-blue-200",
    delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-900/20 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice Preview</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">#{order.orderNumber}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <button onClick={onClose} className="ml-2 size-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice Document */}
        <div className="flex-1 overflow-y-auto">
          <div ref={invoiceRef} className="p-10 space-y-8 bg-white dark:bg-slate-900 font-sans">

            {/* Invoice Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="mt-1">
                  <p className="text-base font-black text-slate-900 dark:text-white">CRM Admin Co.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">123 Business Ave, Suite 100</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">San Francisco, CA 94103</p>
                </div>
              </div>
              <div className="text-right flex flex-col gap-2">
                <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  Invoice
                </span>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{order.orderNumber}</p>
                <span className={cn("inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 self-end", badgeColor[order.status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Bill To / Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Bill To</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Issue Date</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{issueDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Due Date</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dueDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Currency</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currency}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 rounded-l-xl">#</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Description</th>
                    <th className="px-5 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Qty</th>
                    <th className="px-5 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Unit Price</th>
                    <th className="px-5 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 text-xs text-slate-400 font-bold">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-5 py-4 text-sm text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="px-5 py-4 text-sm text-right text-slate-600 dark:text-slate-400">{fmt(item.price)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">{fmt(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tax (10%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                  <span className="text-base font-black text-slate-900 dark:text-white">Total Due</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Payment is due within 30 days. Thank you for your business.</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 font-medium uppercase tracking-widest">CRM Admin Co. &mdash; Enterprise Suite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
