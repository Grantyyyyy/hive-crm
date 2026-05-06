import { useState, useMemo } from "react"
import { Plus, Trash2, Info, Package, Truck, MessageSquare, Building2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/reusables/form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { PurchaseOrder, PurchaseOrderStatus, InventoryItem, Vendor } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { generateId } from "@/lib/helpers"

interface PurchaseOrderFormProps {
  onSave: (order: PurchaseOrder) => void
  onCancel: () => void
  initialData?: Partial<PurchaseOrder>
  inventoryItems?: InventoryItem[]  // Added: inventory catalog for selection
  isSaving?: boolean
}

export function PurchaseOrderForm({ onSave, onCancel, initialData, inventoryItems = [], isSaving }: PurchaseOrderFormProps) {
  const [vendorName, setVendorName] = useState(initialData?.vendorName ?? "")
  const [vendorId, setVendorId] = useState(initialData?.vendorId ?? "")
  const [vendorSearch, setVendorSearch] = useState("")
  const [showVendorSelector, setShowVendorSelector] = useState(false)
  const [inventorySearch, setInventorySearch] = useState("")
  const [showInventory, setShowInventory] = useState(false)
  const { data: vendors } = useCRMResource<Vendor>("vendors")
  const [poNumber] = useState(initialData?.poNumber ?? `PO-${Math.floor(10000 + Math.random() * 90000)}`)
  const [referenceId, setReferenceId] = useState(initialData?.referenceId ?? "")
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [expectedDelivery, setExpectedDelivery] = useState(initialData?.expectedDelivery ? new Date(initialData.expectedDelivery).toISOString().split('T')[0] : "")
  const [items, setItems] = useState(initialData?.items ?? [])
  const [shippingInfo, setShippingInfo] = useState(initialData?.shippingInfo ?? "")
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes ?? "")
  const [vendorInstructions, setVendorInstructions] = useState(initialData?.vendorInstructions ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [items])

  const tax = subtotal * 0.12 // 12% VAT
  const totalAmount = subtotal + tax

  const canAddNewItem = useMemo(() => {
    if (items.length === 0) return true
    const lastItem = items[items.length - 1]
    return lastItem.name.trim() !== "" || lastItem.price > 0
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, price: 0, inventoryItemId: "" }])
    setShowInventory(false)
  }

  const handleInventorySelect = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    if (!item) return

    const existingItemIndex = items.findIndex(i => i.inventoryItemId === itemId)
    if (existingItemIndex > -1) {
      const newItems = [...items]
      newItems[existingItemIndex].quantity += 1
      setItems(newItems)
    } else {
      setItems([...items, {
        id: generateId(),
        inventoryItemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.movingAverageCost && item.movingAverageCost > 0
          ? item.movingAverageCost
          : item.price, // Fallback to retail price if no cost data is available
      }])
    }
    setShowInventory(false)
    setInventorySearch("")
  }

  const selectVendor = (vendor: Vendor) => {
    setVendorId(vendor.id)
    setVendorName(vendor.name)
    setShowVendorSelector(false)
  }

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.category?.toLowerCase() ?? "").includes(vendorSearch.toLowerCase())
    )
  }, [vendors, vendorSearch])

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => 
      item.status === 'active' &&
      (item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
       item.sku.toLowerCase().includes(inventorySearch.toLowerCase()))
    )
  }, [inventoryItems, inventorySearch])

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<{ name: string, quantity: number, price: number, inventoryItemId: string }>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!vendorId) newErrors.vendorName = "Please select a vendor"
    if (items.length === 0) newErrors.items = "At least one item is required"

    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = "Name required"
      if (item.quantity <= 0) newErrors[`item_${index}_qty`] = "Invalid qty"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (status: PurchaseOrderStatus) => {
    if (!validate()) return

    const order: PurchaseOrder = {
      id: initialData?.id ?? generateId(),
      poNumber,
      vendorId,
      vendorName,
      amount: totalAmount,
      status,
      date: new Date(date).toISOString(),
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : undefined,
      items,
      referenceId,
      shippingInfo,
      internalNotes,
      vendorInstructions,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(order)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 pb-10">

        {/* Section 1: Order Identity */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Vendor</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVendorSelector(!showVendorSelector)}
                  className={cn(
                    "w-full h-12 flex items-center justify-between px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm transition-all",
                    errors.vendorName ? "border-red-500 ring-1 ring-red-100" : "hover:border-teal-300 shadow-none",
                    !vendorName && "text-slate-400",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isSaving}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={cn("size-4", vendorName ? "text-teal-600" : "text-slate-400")} />
                    <span className="font-bold">{vendorName || "Choose a vendor catalog..."}</span>
                  </div>
                  <ChevronDown className={cn("size-4 text-slate-400 transition-transform", showVendorSelector && "rotate-180")} />
                </button>

                {showVendorSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 origin-top">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <Input
                          autoFocus
                          placeholder="Search vendors..."
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          className="pl-9 h-9 text-xs rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
                      {filteredVendors.length > 0 ? (
                        filteredVendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => selectVendor(vendor)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-teal-50 dark:hover:bg-teal-900/10 group",
                              vendorId === vendor.id && "bg-teal-50/50 dark:bg-teal-900/5 ring-1 ring-inset ring-teal-100 dark:ring-teal-900/20"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-black truncate", vendorId === vendor.id ? "text-teal-600" : "text-slate-900 dark:text-white group-hover:text-teal-600")}>
                                {vendor.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-tight mt-0.5">
                                {vendor.category || "General Vendor"} · {vendor.status}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center bg-slate-50/30">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">No matching vendors</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.vendorName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.vendorName}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Reference ID
                {initialData?.referenceId && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                    Auto-Linked
                  </span>
                )}
              </Label>
              <Input
                placeholder="External ID or PR Link..."
                value={referenceId}
                readOnly={!!initialData?.referenceId}
                disabled={!!initialData?.referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className={cn(
                  "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold",
                  initialData?.referenceId && "opacity-60 cursor-not-allowed select-none bg-slate-50 dark:bg-slate-800/50 font-mono text-xs text-slate-500"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Expected Delivery</Label>
              <DatePicker
                value={expectedDelivery}
                onChange={setExpectedDelivery}
                className="h-12 py-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Logistics & Destination */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shipping & Logistics</h3>
          </div>
          <Textarea
            placeholder="Enter precise destination address and shipping method instructions..."
            value={shippingInfo}
            onChange={(e) => setShippingInfo(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] p-5 focus:ring-teal-500 shadow-none border-dashed"
          />
        </section>

        {/* Section 3: Line Items */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Products & Catalog</h3>
            </div>
            <div className="flex items-center gap-3">
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
                      {filteredInventory.map((item) => {
                        const atp = item.stockQuantity - (item.reservedQuantity || 0)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleInventorySelect(item.id)}
                            className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-start justify-between gap-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-teal-600 truncate">{item.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight line-clamp-1">{item.sku} • {item.category}</div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <div className="text-[13px] font-black text-slate-900 dark:text-white">
                                ${item.price.toFixed(2)}
                              </div>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md",
                                atp > 0
                                  ? "bg-teal-50 text-teal-600 dark:bg-teal-900/30"
                                  : "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                              )}>
                                {atp} Available
                              </span>
                            </div>
                          </button>
                        )
                      })}
                      {filteredInventory.length === 0 && (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-300" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No products found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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



          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 overflow-hidden shadow-none">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60">
                  <th className="px-6 py-4 w-1/2">Product / SKU</th>
                  <th className="px-4 py-4 w-[12%] text-center">Qty</th>
                  <th className="px-4 py-4 w-[18%] text-right">Unit Price</th>
                  <th className="px-4 py-4 w-[15%] text-right">Total</th>
                  <th className="px-4 py-4 w-[60px] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <input
                        className={cn(
                          "w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-teal-400",
                          errors[`item_${index}_name`] ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
                        )}
                        placeholder="Line item name or SKU..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                      {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 tracking-wider">{errors[`item_${index}_name`]}</p>}
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
                      <input
                        type="number"
                        className="w-full h-9 bg-slate-50/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl focus:ring-4 focus:ring-teal-500/10 pl-2 pr-2 text-[13px] font-black text-slate-900 dark:text-slate-100 text-right transition-all outline-none"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-right pt-5 font-black text-slate-900 dark:text-white text-[13px] tracking-tight">
                      ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 align-top text-right pt-5">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-all scale-100 hover:scale-110 active:scale-90 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                    <td colSpan={5} className="px-6 py-10">
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>Line Total</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>VAT (12%)</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-48 h-px bg-slate-200 dark:border-slate-800 my-1" />
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Total Amount</span>
                          <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-2">{errors.items}</p>}
        </section>

        {/* Section 4: Remarks & Documentation */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Notes</h3>
            </div>
            <Textarea
              placeholder="Private notes for internal procurement team only..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] p-4 text-sm font-medium focus:ring-teal-500 border-dashed"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vendor Instructions</h3>
            </div>
            <Textarea
              placeholder="Specific delivery or billing instructions for the vendor..."
              value={vendorInstructions}
              onChange={(e) => setVendorInstructions(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] p-4 text-sm font-medium focus:ring-teal-500 border-dashed"
            />
          </div>
        </section>
      </div>
      
      <FormActions
        secondary={{
          label: isSaving ? "Saving..." : "Save as Draft",
          onClick: () => handleSave("draft"),
          disabled: isSaving,
        }}
        cancel={{ label: "Cancel", onClick: onCancel, disabled: isSaving }}
        primary={{
          label: isSaving ? "Creating..." : "Create Purchase Order",
          onClick: () => handleSave("pending"),
          disabled: isSaving,
        }}
      />
    </div>
  )
}
