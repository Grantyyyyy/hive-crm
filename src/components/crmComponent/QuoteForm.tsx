import { useState, useMemo, useRef, useEffect } from "react"
import { Trash2, ChevronDown, Info, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { Quote, QuoteStatus, Contact, InventoryItem } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface QuoteFormProps {
  onSave: (quote: Quote) => void
  onCancel: () => void
  contacts: Contact[]
  inventory?: InventoryItem[]
  initialData?: Partial<Quote>
  isSaving?: boolean
  className?: string
}

export function QuoteForm({ onSave, onCancel, contacts, inventory, initialData, isSaving, className }: QuoteFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "")
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : "")
  const [items, setItems] = useState<any[]>(initialData?.items ?? [])
  const [terms, setTerms] = useState(initialData?.terms ?? "")
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showInventory, setShowInventory] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [inventorySearch, setInventorySearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const lastItemRef = useRef<HTMLInputElement>(null)

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.company?.toLowerCase() ?? "").includes(customerSearch.toLowerCase())
    )
  }, [contacts, customerSearch])

  const selectedCustomer = useMemo(() => {
    return contacts.find(c => c.id === customerId)
  }, [contacts, customerId])

  const filteredInventory = useMemo(() => {
    if (!inventory) return []
    return inventory.filter(item => 
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(inventorySearch.toLowerCase())
    )
  }, [inventory, inventorySearch])

  useEffect(() => {
    if (items.length > 0 && !items[items.length - 1].name) {
      lastItemRef.current?.focus()
    }
  }, [items.length])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [items])

  const tax = subtotal * 0.12 // 12% VAT
  const totalValue = subtotal + tax

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const canAddNewItem = useMemo(() => {
    if (items.length === 0) return true
    const lastItem = items[items.length - 1]
    return lastItem.name.trim() !== ""
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", description: "", quantity: 1, price: 0 }])
    setShowInventory(false)
  }

  const addFromInventory = (item: InventoryItem) => {
    const existingItem = items.find(i => i.inventoryItemId === item.id)
    if (existingItem) {
      setItems(items.map(i => 
        i.inventoryItemId === item.id 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
      ))
    } else {
      setItems([...items, {
        id: generateId(),
        name: item.name,
        description: item.description || "",
        quantity: 1,
        price: item.price,
        inventoryItemId: item.id
      }])
    }
    setShowInventory(false)
    setInventorySearch("")
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

    if (Object.keys(newErrors).length > 0) {
      const firstErrorId = Object.keys(newErrors)[0]
      setTimeout(() => {
        const el = document.getElementById(firstErrorId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Optionally focus if it's an input
          if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            (el as any).focus()
          }
        }
      }, 100)
    }

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
      currency,
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
    <div className={cn("flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans", className)}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth pb-10">

        <div className="grid grid-cols-1 gap-y-8">
          {/* Section 1: Quote Identity & Timeline */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proposal Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Customer</Label>
                <div className="relative group">
                  <div 
                    className={cn(
                      "w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-4 focus-within:ring-teal-500/10 transition-all shadow-sm",
                      errors.customerId && "border-red-500 ring-4 ring-red-500/10"
                    )}
                    onClick={() => !isSaving && setShowCustomerDropdown(!showCustomerDropdown)}
                  >
                    <span className={cn("text-[13px] font-bold truncate", !customerId && "text-slate-400")}>
                      {selectedCustomer 
                        ? `${selectedCustomer.name}${selectedCustomer.company ? ` (${selectedCustomer.company})` : ""}` 
                        : "Select a customer..."}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", showCustomerDropdown && "rotate-180")} />
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[70] p-2 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-2 pb-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search customers..."
                          className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredContacts.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCustomerId(c.id)
                              setShowCustomerDropdown(false)
                              if (errors.customerId) setErrors(prev => {
                                const n = { ...prev }
                                delete n.customerId
                                return n
                              })
                            }}
                            className="w-full text-left p-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex flex-col gap-0.5"
                          >
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white">{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {c.company ? `${c.company} • ` : ""}{c.email}
                            </span>
                          </button>
                        ))}
                        {filteredContacts.length === 0 && (
                          <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No customers found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.customerId && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.customerId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration Date</Label>
                <DatePicker
                  value={validUntil}
                  onChange={setValidUntil}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Currency</Label>
                <div className="relative group">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-teal-500 transition-colors" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Items & Financials */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div id="items" className="w-1 h-3.5 bg-teal-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Line Items & Catalog</h3>
              </div>
              {errors.items && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mr-auto px-4">{errors.items}</p>}
              <div className="flex items-center gap-3">
                {inventory && inventory.length > 0 && (
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!canAddNewItem}
                      onClick={() => setShowInventory(!showInventory)}
                      className={cn(
                        "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        !canAddNewItem ? "opacity-40 grayscale cursor-not-allowed" :
                          showInventory ? "bg-teal-50 text-teal-700 underline underline-offset-4" : "text-teal-600 hover:bg-teal-50/50"
                      )}
                    >
                      Quick Add
                    </Button>
                    {showInventory && canAddNewItem && (
                      <div className="absolute right-0 top-full mt-3 w-80 max-h-96 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-950/5">
                        <div className="p-3 border-b border-slate-50 dark:border-slate-800">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search catalog..."
                            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 flex-1">
                          {filteredInventory.map(item => (
                            <button
                              key={item.id}
                              onClick={() => addFromInventory(item)}
                              className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-start justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-teal-600 truncate">{item.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight line-clamp-1">{item.sku} • {item.description}</div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white">
                                  {formatCurrency(item.price)}
                                </div>
                                <div className={cn(
                                  "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md",
                                  (item.stockQuantity - item.reservedQuantity) > 0 
                                    ? "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" 
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                )}>
                                  {item.stockQuantity - item.reservedQuantity} Avail
                                </div>
                              </div>
                            </button>
                          ))}
                          {filteredInventory.length === 0 && (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Info className="w-4 h-4 text-slate-300" />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No products found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addItem}
                  disabled={!canAddNewItem}
                  className={cn(
                    "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-800 transition-all active:scale-95",
                    !canAddNewItem
                      ? "opacity-40 grayscale cursor-not-allowed"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Plus className="w-3 h-3 mr-2" /> Add Manual Row
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-none bg-slate-50/30 dark:bg-slate-900/30">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60">
                    <th className="px-6 py-4 w-1/2">Product / SKU</th>
                    <th className="px-4 py-4 w-[12%] text-center">Qty</th>
                    <th className="px-4 py-4 w-[18%] text-right">Unit Price</th>
                    <th className="px-4 py-4 w-[15%] text-right">Total</th>
                    <th className="px-6 py-4 w-12 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/20">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1.5 pt-1">
                          <input
                            id={`item_${index}_name`}
                            ref={index === items.length - 1 ? lastItemRef : null}
                            className={cn(
                              "w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-teal-400",
                              errors[`item_${index}_name`] ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
                            )}
                            placeholder="Primary item name..."
                            value={item.name}
                            onChange={(e) => {
                              updateItem(item.id, { name: e.target.value })
                              if (errors[`item_${index}_name`]) setErrors(prev => {
                                const n = { ...prev }
                                delete n[`item_${index}_name`]
                                return n
                              })
                            }}
                          />
                          <input
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-slate-500 dark:text-slate-400 placeholder:text-slate-300 transition-colors focus:placeholder:text-teal-400"
                            placeholder="Optional technical description..."
                            value={item.description || ""}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="number"
                          className="w-full h-9 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl focus:ring-4 focus:ring-teal-500/10 p-0 text-[13px] font-black text-slate-900 dark:text-slate-100 text-center transition-all outline-none"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full h-9 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl focus:ring-4 focus:ring-teal-500/10 pl-2 pr-2 text-[13px] font-black text-slate-900 dark:text-slate-100 text-right transition-all outline-none"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-right pt-5">
                        <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                          {formatCurrency(item.quantity * item.price)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top text-right pt-5">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-all scale-100 hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-dashed animate-[spin_10s_linear_infinite]" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Items Configured</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="flex flex-col items-end min-w-[320px] gap-4">
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Line Total</span>
                  <span className="text-slate-900 dark:text-white min-w-[100px] text-right">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>VAT (12%)</span>
                  <span className="text-slate-900 dark:text-white min-w-[100px] text-right">{formatCurrency(tax)}</span>
                </div>
                <div className="w-48 h-px bg-slate-200 dark:bg-slate-800 my-1" />
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Total Amount</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Legal & Terms */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legal Agreement & Terms</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Contractual Clauses & Payment Terms</Label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Detail payment schedules, delivery timelines, and project scope..."
                className="w-full h-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-2xl text-[13px] font-medium p-4 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.05)] z-20">
        <Button
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={isSaving}
          className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-800 transition-all hover:bg-slate-50 active:scale-95"
        >
          {isSaving ? "Saving..." : "Save for Review"}
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave('sent')}
            disabled={isSaving}
            className="h-9 px-8 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {isSaving ? "Finalizing..." : "Add Proposal"}
          </Button>
        </div>
      </div>
    </div>
  )
}
