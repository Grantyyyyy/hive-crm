import { useState, useMemo, useRef, useEffect } from "react"
import { Trash2, ChevronDown, Info, Plus, Search, Tag, X, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/reusables/form-actions"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { Quote, QuoteStatus, Contact, InventoryItem } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { DebouncedInput } from "@/components/reusables/DebouncedInput"
import { MobileLineItemCard } from "@/components/reusables/MobileLineItemCard"
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
  const [showCatalogMobile, setShowCatalogMobile] = useState(false)
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
    <div className={cn(
      "flex h-full bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden",
      Boolean(inventory && inventory.length > 0) ? "flex-col lg:flex-row" : "flex-col",
      className
    )}>
      
      {/* Left Pane: Proposal Builder */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth pb-10">

          <div className="grid grid-cols-1 gap-y-8">
            {/* Section 1: Quote Identity & Timeline */}
            <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-3.5 bg-accent rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proposal Context</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5 col-span-full md:col-span-2 lg:col-span-1">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Customer</Label>
                  
                  {selectedCustomer ? (
                    <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 animate-in fade-in duration-200 shadow-sm h-11">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center font-black text-[10px]">
                          {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[12px] font-black text-slate-900 dark:text-white truncate">{selectedCustomer.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold tracking-tight truncate uppercase mt-0.5">
                            {selectedCustomer.company ? `${selectedCustomer.company} • ` : ""}{selectedCustomer.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomerId("")}
                        className="h-7 px-2 rounded-lg text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-wider border border-transparent hover:border-red-500/10 hover:bg-red-500/5 transition-all"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div 
                        className={cn(
                          "w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-4 focus-within:ring-accent/10 transition-all shadow-sm",
                          errors.customerId && "border-red-500 ring-4 ring-red-500/10"
                        )}
                        onClick={() => !isSaving && setShowCustomerDropdown(!showCustomerDropdown)}
                      >
                        <span className={cn("text-[13px] font-bold truncate", !customerId && "text-slate-400")}>
                          Select a customer...
                        </span>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", showCustomerDropdown && "rotate-180")} />
                      </div>

                      {showCustomerDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[70] p-2 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-2 pb-2">
                            <DebouncedInput
                              type="text"
                              autoFocus
                              placeholder="Search customers..."
                              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-accent outline-none"
                              value={customerSearch}
                              onChange={(val) => setCustomerSearch(val)}
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
                                className="w-full text-left p-3 hover:bg-accent-dim transition-colors flex flex-col gap-0.5"
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
                  )}
                  {errors.customerId && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.customerId}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration Date</Label>
                  <DatePicker
                    value={validUntil}
                    onChange={setValidUntil}
                    className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-accent/10 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Currency</Label>
                  <div className="relative group">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-accent/10 transition-all shadow-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Items & Financials */}
            <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div id="items" className="w-1 h-3.5 bg-accent rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Line Items & Catalog</h3>
                </div>
                {errors.items && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mr-auto px-4">{errors.items}</p>}
                <div className="flex items-center gap-3">
                  {Boolean(inventory && inventory.length > 0) && (
                    <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCatalogMobile(true)}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent-dim lg:hidden border border-accent/15"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Browse Catalog
                  </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addItem}
                    disabled={!canAddNewItem}
                    className={cn(
                      "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border border-slate-200 dark:border-slate-800 transition-all active:scale-95",
                      !canAddNewItem
                        ? "opacity-40 grayscale cursor-not-allowed"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <Plus className="w-3 h-3 mr-2" /> Add Manual Row
                  </Button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-4 bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl border-2 border-dashed border-slate-200/50 dark:border-slate-800/50 my-2 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Your Proposal is Empty</h4>
                    <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed uppercase tracking-tight">
                      {Boolean(inventory && inventory.length > 0)
                        ? "Add items manually or select products from the catalog sidebar on the right."
                        : "Add items manually to configure your proposal quote."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2" /> Add Manual Item
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-none bg-slate-50/30 dark:bg-slate-900/30">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60">
                        <th className="px-6 py-4 w-1/2">Product / SKU</th>
                        <th className="px-4 py-4 w-[20%] text-center">Qty</th>
                        <th className="px-4 py-4 w-[18%] text-right">Unit Price</th>
                        <th className="px-4 py-4 w-[15%] text-right">Total</th>
                        <th className="px-6 py-4 w-12 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/20">
                      {items.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors animate-in fade-in slide-in-from-left-4 duration-200">
                          <td className="px-6 py-4 align-top">
                            <div className="space-y-1.5 pt-1">
                              <DebouncedInput
                                id={`item_${index}_name`}
                                ref={index === items.length - 1 ? lastItemRef : null}
                                className={cn(
                                  "w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-accent/60 outline-none",
                                  errors[`item_${index}_name`] ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
                                )}
                                placeholder="Primary item name..."
                                value={item.name}
                                onChange={(val) => {
                                  updateItem(item.id, { name: val })
                                  if (errors[`item_${index}_name`]) setErrors(prev => {
                                    const n = { ...prev }
                                    delete n[`item_${index}_name`]
                                    return n
                                  })
                                }}
                              />
                              <DebouncedInput
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-slate-500 dark:text-slate-400 placeholder:text-slate-300 transition-colors focus:placeholder:text-accent/60 outline-none"
                                placeholder="Optional technical description..."
                                value={item.description || ""}
                                onChange={(val) => updateItem(item.id, { description: val })}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden h-9 w-[100px] mx-auto transition-all focus-within:ring-2 focus-within:ring-accent/20">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-black"
                              >
                                -
                              </button>
                              <DebouncedInput
                                type="number"
                                min={0}
                                onKeyDown={(e) => {
                                  if (e.key === '-') e.preventDefault()
                                }}
                                className="w-8 bg-transparent border-none text-[12px] font-black text-slate-900 dark:text-slate-100 text-center focus:ring-0 p-0 outline-none"
                                value={item.quantity}
                                onChange={(val) => updateItem(item.id, { quantity: Math.max(0, parseInt(val) || 0) })}
                              />
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-black"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="relative flex items-center h-9 w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden px-2 max-w-[110px] ml-auto transition-all focus-within:ring-2 focus-within:ring-accent/20">
                              <span className="text-[10px] font-bold text-slate-400 mr-1">$</span>
                              <DebouncedInput
                                type="number"
                                min={0}
                                onKeyDown={(e) => {
                                  if (e.key === '-') e.preventDefault()
                                }}
                                className="w-full bg-transparent border-none text-[12px] font-black text-slate-900 dark:text-slate-100 text-right focus:ring-0 p-0 outline-none"
                                value={item.price}
                                onChange={(val) => updateItem(item.id, { price: Math.max(0, parseFloat(val) || 0) })}
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
                    </tbody>
                  </table>
                  </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                  {items.map((item, index) => (
                    <MobileLineItemCard
                      key={item.id}
                      id={item.id}
                      index={index}
                      name={item.name}
                      quantity={item.quantity}
                      price={item.price}
                      description={item.description}
                      error={errors[`item_${index}_name`]}
                      lastItemRef={index === items.length - 1 ? lastItemRef : null}
                      onUpdate={(fields) => {
                        updateItem(item.id, fields)
                        if (fields.name && errors[`item_${index}_name`]) {
                          setErrors(prev => {
                            const n = { ...prev }
                            delete n[`item_${index}_name`]
                            return n
                          })
                        }
                      }}
                      onRemove={() => removeItem(item.id)}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </div>
              )}

              <div className="mt-8 flex justify-end">
                <div className="w-full lg:max-w-md bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Tag className="w-4 h-4 text-accent" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Proposal Pricing</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>VAT (12%)</span>
                      <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(tax)}</span>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800/80 my-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">Total Amount</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                        {formatCurrency(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Legal & Terms */}
            <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60 animate-in fade-in duration-300">
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
                  className="w-full h-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] font-medium p-4 focus:ring-4 focus:ring-accent/10 transition-all shadow-sm resize-none"
                />
              </div>
            </section>
          </div>
        </div>

        <FormActions
          className="z-20 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
          secondary={{
            label: isSaving ? "Saving..." : "Save for Review",
            onClick: () => handleSave("draft"),
            disabled: isSaving,
          }}
          cancel={{ label: "Cancel", onClick: onCancel, disabled: isSaving }}
          primary={{
            label: isSaving ? "Finalizing..." : "Add Proposal",
            onClick: () => handleSave("sent"),
            disabled: isSaving,
          }}
        />
      </div>

      {/* Mobile Catalog Backdrop */}
      {Boolean(inventory && inventory.length > 0) && showCatalogMobile && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowCatalogMobile(false)}
        />
      )}

      {/* Sidebar: Product Catalog (Right Pane) */}
      {Boolean(inventory && inventory.length > 0) && (
        <div className={cn(
        "w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col h-full overflow-hidden transition-transform duration-300 lg:translate-x-0 lg:static fixed right-0 top-0 bottom-0 z-50 shadow-2xl lg:shadow-none",
        showCatalogMobile ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Product Catalog</h3>
          </div>
          <button
            onClick={() => setShowCatalogMobile(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
            <DebouncedInput
              type="text"
              placeholder="Search catalog..."
              className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-accent outline-none shadow-sm"
              value={inventorySearch}
              onChange={(val) => setInventorySearch(val)}
            />
          </div>
        </div>

        {/* Product Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredInventory.map(item => {
            // Count current quantity of this item in active order
            const activeItem = items.find(i => i.id === item.id || i.name === item.name);
            const activeQty = activeItem ? activeItem.quantity : 0;
            
            return (
              <div
                key={item.id}
                onClick={() => addFromInventory(item)}
                className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl hover:border-accent hover:shadow-md transition-all duration-200 cursor-pointer group flex items-start justify-between gap-4 relative overflow-hidden"
              >
                {activeQty > 0 && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-accent/10 rounded-bl-2xl flex items-center justify-center">
                    <span className="text-[10px] font-black text-accent">{activeQty}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-black text-slate-900 dark:text-white group-hover:text-accent truncate transition-colors pr-6">{item.name}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-1 tracking-tight truncate uppercase">{item.sku}</div>
                  {item.description && (
                    <div className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-1 italic">{item.description}</div>
                  )}
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1 mt-0.5">
                  <div className="text-[12px] font-black text-slate-900 dark:text-white">{formatCurrency(item.price)}</div>
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">In Stock</div>
                </div>
              </div>
            );
          })}
          
          {filteredInventory.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No products found</p>
            </div>
          )}
        </div>
      </div>
      )}
      
    </div>
  )
}
