import { useRef } from "react"
import { X, Printer, Download, Building2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PurchaseOrder } from "@/lib/types"

interface VendorInvoiceModalProps {
  order: PurchaseOrder | null
  onClose: () => void
}

export function VendorInvoiceModal({ order, onClose }: VendorInvoiceModalProps) {
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
        <title>Vendor Invoice ${order.poNumber}</title>
        <meta charset="utf-8" />
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #fff; padding: 40px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
          .logo-box { width: 48px; height: 48px; background: #0d9488; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
          h1.company { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 8px; }
          .invoice-badge { background: #f0fdfa; color: #0d9488; padding: 6px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
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

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  const issueDate = new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 ring-slate-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    sent: "bg-blue-50 text-blue-700 ring-blue-200",
    received: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
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
            <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vendor Invoice</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{order.poNumber}</h2>
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
          <div ref={invoiceRef} className="p-10 space-y-8 bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-white">

            {/* Invoice Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="size-12 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200 dark:shadow-none">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="mt-1 text-slate-900 dark:text-white">
                  <p className="text-base font-black uppercase tracking-tight">CRM Admin Co.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 italic">Consolidated Procurement & Distribution</p>
                </div>
              </div>
              <div className="text-right flex flex-col gap-2">
                <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 italic tabular-nums">
                  PURCHASE INVOICE
                </span>
                <p className="text-3xl font-black text-slate-900 dark:text-white italic tabular-nums">{order.poNumber}</p>
                <span className={cn("inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 self-end", statusColors[order.status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Bill Info / Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Vendor (Purchased From)</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{order.vendorName}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Purchase Date</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{issueDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Payment Status</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{order.status === 'received' ? 'Ready for Payment' : 'Pending Receipt'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Reference</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.poNumber}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 rounded-l-xl italic">#</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 italic">Description</th>
                    <th className="px-5 py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 italic">Qty</th>
                    <th className="px-5 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 italic">Unit Price</th>
                    <th className="px-5 py-3.5 text-right text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 rounded-r-xl italic">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, i) => (
                    <tr key={item.id} className="text-slate-900 dark:text-white font-medium">
                      <td className="px-5 py-4 text-xs text-slate-400 font-bold tabular-nums italic">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-4 text-sm font-bold">{item.name}</td>
                      <td className="px-5 py-4 text-sm text-center tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-4 text-sm text-right tabular-nums">{fmt(item.price)}</td>
                      <td className="px-5 py-4 text-sm font-black text-right tabular-nums">{fmt(item.quantity * item.price)}</td>
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
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Tax (10%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                  <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Grand Total</span>
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400 tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest italic leading-relaxed">Generated Internal Document &bull; Purchase Record Only</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 font-medium uppercase tracking-[0.2em]">CRM Enterprise Procurement Hub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
