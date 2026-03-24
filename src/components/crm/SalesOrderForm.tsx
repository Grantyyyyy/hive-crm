import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Trash2, Info, Package, Truck, Calendar, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus, Contact, InventoryItem } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface SalesOrderFormProps {
  onSave: (order: SalesOrder) => void
  onCancel: () => void
  contacts: Contact[]
  inventory?: InventoryItem[]
  initialData?: Partial<SalesOrder>
  className?: string
}

export function SalesOrderForm({ onSave, onCancel, contacts, inventory, initialData, className }: SalesOrderFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "")
  const [orderDate] = useState(initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<any[]>(initialData?.items ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showInventory, setShowInventory] = useState(false)
  const lastItemRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (items.length > 0 && !items[items.length - 1].name) {
      lastItemRef.current?.focus()
    }
  }, [items.length])

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", description: "", quantity: 1, price: 0 }])
    setShowInventory(false)
  }

  const addFromInventory = (item: InventoryItem) => {
    setItems([...items, { id: generateId(), name: item.name, description: item.description || "", quantity: 1, price: item.price }])
    setShowInventory(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: any) => {
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
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-950", className)}>
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">

        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</Label>
            <div className="relative">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={cn(
                  "w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none appearance-none dark:text-slate-200",
                  errors.customerId && "border-red-500"
                )}
              >
                <option value="">Select a customer...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {errors.customerId && <p className="text-[9px] font-medium text-red-500">{errors.customerId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={orderDate}
                readOnly
                className="h-10 pl-9 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed text-xs font-medium dark:text-slate-400 disabled:opacity-100 shadow-none border-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currency</Label>
            <div className="relative">
              <Input
                value="USD ($)"
                readOnly
                className="h-10 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed text-xs font-medium dark:text-slate-400 disabled:opacity-100 shadow-none border-none"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Items</h3>
            <div className="flex items-center gap-2">
              {inventory && inventory.length > 0 && (
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInventory(!showInventory)}
                    className="h-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 px-3"
                  >
                    Quick Add
                  </Button>
                  {showInventory && (
                    <div className="absolute right-0 top-full mt-1 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 divide-y divide-slate-50 dark:divide-slate-800">
                      {inventory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            addFromInventory(item)
                          }}
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group"
                        >
                          <div className="text-[12px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">{item.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">${item.price} • SKU: {item.sku}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="outlineNeutral"
                size="sm"
                onClick={addItem}
                className="h-8 text-[11px] font-bold rounded-lg px-3 border-slate-200 dark:border-slate-800"
              >
                + Product
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">Product Details</th>
                  <th className="px-4 py-3 w-20 border-b border-slate-100 dark:border-slate-800 text-center">Qty</th>
                  <th className="px-4 py-3 w-32 border-b border-slate-100 dark:border-slate-800 text-right">Price</th>
                  <th className="px-4 py-3 w-32 border-b border-slate-100 dark:border-slate-800 text-right">Total</th>
                  <th className="px-4 py-3 w-12 border-b border-slate-100 dark:border-slate-800 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <input
                          ref={index === items.length - 1 ? lastItemRef : null}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300"
                          placeholder="Product name..."
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        />
                        <input
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[10px] text-slate-500 dark:text-slate-400 placeholder:text-slate-300 font-medium"
                          placeholder="Add details..."
                          value={item.description || ""}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md focus:ring-0 p-1 text-[12px] font-bold text-slate-900 dark:text-slate-100 text-center transition-all"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md focus:ring-0 p-1 text-[12px] font-bold text-slate-900 dark:text-slate-100 text-right transition-all"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-right text-[13px] font-black text-slate-900 dark:text-white">
                      ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pr-4">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Value</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Shipping Section Placeholder */}
        <div className="pt-2">
          <div className="p-4 rounded-xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              New orders are set to <span className="font-bold uppercase tracking-widest text-amber-900 dark:text-amber-200 px-1 py-0.5 bg-amber-200/50 rounded">pending</span>. Fulfillment will be processed after logging.
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0 gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-9 px-4 font-bold text-[11px]"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => handleSave('pending')}
          className="h-9 px-6 font-black bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-lg shadow-sm"
        >
          Complete Order
        </Button>
      </div>
    </div>
  )
}