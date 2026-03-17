import { useState, useMemo } from "react"
import { Plus, Trash2, Info, Package, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus, Contact } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface SalesOrderFormProps {
  onSave: (order: SalesOrder) => void
  onCancel: () => void
  contacts: Contact[]
  initialData?: Partial<SalesOrder>
}

export function SalesOrderForm({ onSave, onCancel, contacts, initialData }: SalesOrderFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "")
  const [orderDate] = useState(initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [items, setItems] = useState(initialData?.items ?? [
    { id: generateId(), name: "Standard Product A", quantity: 1, price: 500 },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalValue = useMemo(() => {
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
    if (items.length === 0) newErrors.items = "At least one item is required"
    
    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = "Name required"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (status: SalesOrderStatus) => {
    if (!validate()) return

    const selectedContact = contacts.find(c => c.id === customerId)
    
    const order: SalesOrder = {
      id: initialData?.id ?? generateId(),
      orderNumber: initialData?.orderNumber ?? `SO-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName: selectedContact?.name ?? "Unknown Customer",
      totalValue: totalValue,
      status,
      orderDate: new Date(orderDate).toISOString(),
      items,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(order)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
        
        {/* Section: Basic Information */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Order Information</h3>
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
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Order Date</Label>
              <Input 
                type="date"
                value={orderDate}
                readOnly
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Currency</Label>
              <Input 
                value="USD ($)"
                readOnly
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Section: Items/Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Order Items</h3>
            </div>
            <button 
              type="button"
              onClick={addItem}
              className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Product
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
                        placeholder="Product name..."
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
                  <td colSpan={3} className="px-5 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Value</td>
                  <td className="px-5 py-5 text-right text-lg font-black text-slate-900 dark:text-white">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.items}</p>}
        </section>

        {/* Section: Shipping Info (Placeholder) */}
        <section className="space-y-6 pb-10">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Shipping & Fulfillment</h3>
          </div>
          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              New orders are set to <span className="font-bold uppercase tracking-tighter">pending</span> by default. Fulfillment workflows will be triggered upon saving.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0 gap-3">
        <Button 
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => handleSave('pending')}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
        >
          Complete Order
        </Button>
      </div>
    </div>
  )
}
