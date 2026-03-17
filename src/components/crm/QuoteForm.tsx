import { useState, useMemo } from "react"
import { Plus, Trash2, Info, Package, Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Quote, QuoteStatus, Contact } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface QuoteFormProps {
  onSave: (quote: Quote) => void
  onCancel: () => void
  contacts: Contact[]
  initialData?: Partial<Quote>
}

export function QuoteForm({ onSave, onCancel, contacts, initialData }: QuoteFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "")
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : "")
  const [items, setItems] = useState(initialData?.items ?? [
    { id: generateId(), name: "Enterprise SaaS License", quantity: 1, price: 2500 },
    { id: generateId(), name: "Onboarding Support", quantity: 5, price: 150 }
  ])
  const [terms, setTerms] = useState(initialData?.terms ?? "Payment is due within 30 days. Standard service level agreements apply as per our master services contract.")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, price: 0 }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<{ name: string, quantity: number, price: number }>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!customerId) newErrors.customerId = "Customer is required"
    if (!date) newErrors.date = "Date is required"
    if (items.length === 0) newErrors.items = "At least one item is required"
    
    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = "Name required"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (status: QuoteStatus) => {
    if (!validate()) return

    const selectedContact = contacts.find(c => c.id === customerId)
    
    const quote: Quote = {
      id: initialData?.id ?? generateId(),
      quoteNumber: initialData?.quoteNumber ?? `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName: selectedContact?.name ?? "Unknown Customer",
      amount: subtotal,
      status,
      date: new Date(date).toISOString(),
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      items,
      terms,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(quote)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
        
        {/* Section: Basic Information */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer</Label>
              <select 
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none",
                  errors.customerId && "border-red-500"
                )}
              >
                <option value="">Select a customer...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
              {errors.customerId && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.customerId}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiration Date</Label>
              <Input 
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Currency</Label>
              <select className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none">
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
                <option>GBP - British Pound</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section: Items/Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Items & Products</h3>
            </div>
            <button 
              type="button"
              onClick={addItem}
              className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-4">Product Name</th>
                  <th className="px-5 py-4 w-24">Qty</th>
                  <th className="px-5 py-4 w-32">Price</th>
                  <th className="px-5 py-4 w-32 text-right">Total</th>
                  <th className="px-5 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr key={item.id} className="group transition-colors">
                    <td className="px-5 py-4">
                      <input 
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium"
                        placeholder="Item name..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                      {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1">{errors[`item_${index}_name`]}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        type="number"
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-medium"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">$</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-medium"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td colSpan={3} className="px-5 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Subtotal</td>
                  <td className="px-5 py-5 text-right text-lg font-black text-slate-900 dark:text-white">
                    ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.items}</p>}
        </section>

        {/* Section: Terms & Conditions */}
        <section className="space-y-6 pb-10">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Gavel className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Terms & Conditions</h3>
          </div>
          <Textarea 
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Enter specific terms, payment conditions, or legal notes here..."
            className="rounded-[1.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[120px] p-5 focus:ring-indigo-500 shadow-sm"
          />
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
              This quote will be sent as a secure link. Customer signature will be required for acceptance if generated through the primary workflow.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <Button 
          variant="outline"
          onClick={() => handleSave('draft')}
          className="rounded-xl border-slate-200 dark:border-slate-800 h-12 px-6 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-none"
        >
          Save as Draft
        </Button>
        <div className="flex gap-3">
          <Button 
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleSave('sent')}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
          >
            Generate & Send
          </Button>
        </div>
      </div>
    </div>
  )
}
