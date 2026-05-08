import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Trash2, Info, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/reusables/form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus, Contact, InventoryItem, Discount, DiscountType } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { generateId } from "@/lib/helpers"
import { toast } from 'sonner'

interface SalesOrderFormProps {
  onSave: (order: SalesOrder) => void
  onCancel: () => void
  contacts: Contact[]
  inventory?: InventoryItem[]
  initialData?: Partial<SalesOrder>
  isSaving?: boolean
  className?: string
}

export function SalesOrderForm({ onSave, onCancel, contacts, inventory, initialData, isSaving, className }: SalesOrderFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "")
  const [orderDate] = useState(initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<any[]>(initialData?.items ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: allDiscounts } = useCRMResource<Discount>('discounts');
  const activeLineDiscounts = useMemo(() => allDiscounts.filter(d => d.isActive && d.scope === 'line_item'), [allDiscounts]);
  const activeOrderDiscounts = useMemo(() => allDiscounts.filter(d => d.isActive && d.scope === 'order'), [allDiscounts]);

  const [orderDiscountId, setOrderDiscountId] = useState<string | undefined>(initialData?.orderDiscountId);
  const [orderDiscountValue, setOrderDiscountValue] = useState<number | undefined>(initialData?.orderDiscountValue);
  const [orderDiscountType, setOrderDiscountType] = useState<DiscountType | undefined>(initialData?.orderDiscountType);
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

  // Raw subtotal before any order-level discount (but after line-item discounts)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      let itemTotal = item.quantity * item.price;
      if (item.discountId && item.discountValue !== undefined) {
        if (item.discountType === 'percentage') {
          itemTotal = itemTotal * (1 - item.discountValue / 100);
        } else if (item.discountType === 'fixed') {
          itemTotal = Math.max(0, itemTotal - item.discountValue);
        }
      }
      return sum + itemTotal;
    }, 0)
  }, [items])

  // Check if an order discount's minOrderAmount is met
  const isOrderDiscountValid = useCallback((discountId: string | undefined) => {
    if (!discountId) return true;
    const discount = activeOrderDiscounts.find(d => d.id === discountId);
    if (!discount || !discount.minOrderAmount) return true;
    return subtotal >= discount.minOrderAmount;
  }, [activeOrderDiscounts, subtotal]);

  // Auto-remove order discount if subtotal drops below minimum
  useEffect(() => {
    if (orderDiscountId && !isOrderDiscountValid(orderDiscountId)) {
      const discount = activeOrderDiscounts.find(d => d.id === orderDiscountId);
      if (discount?.minOrderAmount) {
        toast.warning(`Order discount "${discount.name}" removed`, {
          description: `Subtotal ($${subtotal.toFixed(2)}) is below the minimum of $${discount.minOrderAmount.toFixed(2)}.`
        });
        setOrderDiscountId(undefined);
        setOrderDiscountValue(undefined);
        setOrderDiscountType(undefined);
      }
    }
  }, [subtotal, orderDiscountId, activeOrderDiscounts, isOrderDiscountValid]);

  // Auto-remove line-item discounts if line total drops below minimum
  useEffect(() => {
    let changed = false;
    const updated = items.map(item => {
      if (!item.discountId) return item;
      const disc = activeLineDiscounts.find(d => d.id === item.discountId);
      if (!disc || !disc.minOrderAmount) return item;
      const lineTotal = item.quantity * item.price;
      if (lineTotal < disc.minOrderAmount) {
        toast.warning(`Discount "${disc.name}" removed from ${item.name}`, {
          description: `Line total ($${lineTotal.toFixed(2)}) is below the minimum of $${disc.minOrderAmount.toFixed(2)}.`
        });
        changed = true;
        return { ...item, discountId: undefined, discountValue: undefined, discountType: undefined };
      }
      return item;
    });
    if (changed) setItems(updated);
  }, [items, activeLineDiscounts]);

  const orderDiscountAmount = useMemo(() => {
    if (!orderDiscountId || orderDiscountValue === undefined) return 0;
    if (orderDiscountType === 'percentage') {
      return subtotal * (orderDiscountValue / 100);
    } else {
      return Math.min(subtotal, orderDiscountValue);
    }
  }, [subtotal, orderDiscountId, orderDiscountValue, orderDiscountType]);

  const discountedSubtotal = subtotal - orderDiscountAmount;
  const tax = discountedSubtotal * 0.12 // 12% VAT
  const totalValue = discountedSubtotal + tax

  const canAddNewItem = useMemo(() => {
    if (items.length === 0) return true
    const lastItem = items[items.length - 1]
    return lastItem.name.trim() !== "" || lastItem.price > 0
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, price: 0 }])
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
        quantity: 1,
        price: item.price,
        inventoryItemId: item.id
      }])
    }
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

    if (orderDiscountId) {
      const discount = activeOrderDiscounts.find(d => d.id === orderDiscountId);
      if (discount && discount.minOrderAmount && subtotal < discount.minOrderAmount) {
        newErrors.orderDiscount = `Minimum order amount of $${discount.minOrderAmount} required for this discount.`;
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstErrorId = Object.keys(newErrors)[0]
      setTimeout(() => {
        const el = document.getElementById(firstErrorId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            (el as any).focus()
          }
        }
      }, 100)
    }

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
      currency: "USD",
      status,
      orderDate: new Date(orderDate).toISOString(),
      items,
      orderDiscountId,
      orderDiscountValue,
      orderDiscountType,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(order)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans", className)}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth pb-10">

        <div className="grid grid-cols-1 gap-y-8">
          {/* Section 1: Order Identity */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-accent rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Customer</Label>
                <div className="relative group">
                  <div
                    className={cn(
                      "w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-4 focus-within:ring-accent/10 transition-all shadow-sm",
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
                          className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-accent outline-none"
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
                {errors.customerId && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.customerId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Date</Label>
                <DatePicker
                  value={orderDate}
                  disabled={true}
                  className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold cursor-not-allowed opacity-70"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Currency</Label>
                <div className="relative group">
                  <Input
                    value="USD ($)"
                    readOnly
                    className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-[13px] font-bold cursor-not-allowed border-none shadow-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Items & Financials */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div id="items" className="w-1 h-3.5 bg-accent rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Products & Pricing</h3>
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
                          showInventory ? "bg-accent-dim text-accent underline underline-offset-4" : "text-accent hover:bg-accent-dim/70"
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
                            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-accent outline-none"
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 flex-1">
                          {filteredInventory.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                addFromInventory(item)
                                setInventorySearch("")
                              }}
                              className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-start justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-accent truncate">{item.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight line-clamp-1">{item.sku} • {item.description}</div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white">{formatCurrency(item.price)}</div>
                                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">In Stock</div>
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
                              "w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-accent/60",
                              errors[`item_${index}_name`] ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
                            )}
                            placeholder="Product name..."
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
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="number"
                          className="w-full h-9 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl focus:ring-4 focus:ring-accent/10 p-0 text-[13px] font-black text-slate-900 dark:text-slate-100 text-center transition-all outline-none"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="number"
                          className="w-full h-9 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl focus:ring-4 focus:ring-accent/10 pl-2 pr-2 text-[13px] font-black text-slate-900 dark:text-slate-100 text-right transition-all outline-none"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="mt-2">
                          <select
                            className="w-full h-7 text-[10px] bg-slate-50 border border-slate-200 rounded text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            value={item.discountId || ""}
                            onChange={e => {
                              const val = e.target.value;
                              if (!val) {
                                updateItem(item.id, { discountId: undefined, discountValue: undefined, discountType: undefined });
                              } else {
                                const d = activeLineDiscounts.find(x => x.id === val);
                                if (d) {
                                  // Check minOrderAmount against line total
                                  const lineTotal = item.quantity * item.price;
                                  if (d.minOrderAmount && lineTotal < d.minOrderAmount) {
                                    toast.error(`Cannot apply "${d.name}"`, {
                                      description: `Line total ($${lineTotal.toFixed(2)}) must be at least $${d.minOrderAmount.toFixed(2)}.`
                                    });
                                    e.target.value = item.discountId || "";
                                    return;
                                  }
                                  updateItem(item.id, { discountId: d.id, discountValue: d.value, discountType: d.type });
                                }
                              }
                            }}
                          >
                            <option value="">No Discount</option>
                            {activeLineDiscounts.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`})</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-right pt-5">
                        <div className="flex flex-col items-end gap-1">
                          {item.discountId && item.discountValue !== undefined && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                            ${(() => {
                              let total = item.quantity * item.price;
                              if (item.discountId && item.discountValue !== undefined) {
                                if (item.discountType === 'percentage') total *= (1 - item.discountValue / 100);
                                else if (item.discountType === 'fixed') total = Math.max(0, total - item.discountValue);
                              }
                              return total;
                            })().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
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

            <div className="mt-8 flex justify-end">
              <div className="flex flex-col items-end min-w-[320px] gap-4">
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-full justify-between">
                  <span>Line Total</span>
                  <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
 
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-full justify-between">
                  <span>Order Discount</span>
                  <div className="flex flex-col items-end gap-1">
                    <select
                      className={cn(
                        "h-7 text-[10px] bg-slate-50 border border-slate-200 rounded text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 max-w-[140px]",
                        errors.orderDiscount && "border-red-500"
                      )}
                      value={orderDiscountId || ""}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                          setOrderDiscountId(undefined);
                          setOrderDiscountValue(undefined);
                          setOrderDiscountType(undefined);
                        } else {
                          const d = activeOrderDiscounts.find(x => x.id === val);
                          if (d) {
                            // Check minOrderAmount against subtotal
                            if (d.minOrderAmount && subtotal < d.minOrderAmount) {
                              toast.error(`Cannot apply "${d.name}"`, {
                                description: `Subtotal ($${subtotal.toFixed(2)}) must be at least $${d.minOrderAmount.toFixed(2)}.`
                              });
                              e.target.value = orderDiscountId || "";
                              return;
                            }
                            setOrderDiscountId(d.id);
                            setOrderDiscountValue(d.value);
                            setOrderDiscountType(d.type);
                          }
                        }
                        if (errors.orderDiscount) {
                          setErrors(prev => { const n = { ...prev }; delete n.orderDiscount; return n; });
                        }
                      }}
                    >
                      <option value="">No Order Discount</option>
                      {activeOrderDiscounts.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`})</option>
                      ))}
                    </select>
                    {orderDiscountAmount > 0 && (
                      <span className="text-accent">-${orderDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>
                {errors.orderDiscount && <p className="text-[9px] font-bold text-red-500 uppercase mt-[-8px] text-right">{errors.orderDiscount}</p>}
 
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-full justify-between">
                  <span>Discounted Total</span>
                  <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${discountedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
 
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-full justify-between">
                  <span>VAT (12%)</span>
                  <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1" />
                <div className="flex items-center gap-6 w-full justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Total Amount</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Fulfillment Note */}
          <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Processing & Fulfillment</h3>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed uppercase tracking-tight font-bold">
                New orders are set to <span className="text-amber-900 dark:text-amber-200 px-1 py-0.5 bg-amber-200/50 rounded">pending</span>. Fulfillment will be processed immediately after submission.
              </p>
            </div>
          </section>
        </div>
      </div>

      <FormActions
        className="z-20"
        secondary={{
          label: isSaving ? "Processing..." : "Park Order",
          onClick: () => handleSave("draft"),
          disabled: isSaving,
        }}
        cancel={{ label: "Cancel", onClick: onCancel, disabled: isSaving }}
        primary={{
          label: isSaving ? "Initializing..." : "Place Order",
          onClick: () => handleSave("pending"),
          disabled: isSaving,
        }}
      />
    </div>
  )
}
