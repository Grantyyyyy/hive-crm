import { useState, useMemo } from "react"
import { Plus, Trash2, Package, AlertTriangle, Layers, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { PurchaseRequest, PurchaseRequestStatus, InventoryItem, Vendor } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { useUser } from "@/lib/AuthContext"

interface PurchaseRequestFormProps {
  onSave: (request: PurchaseRequest) => void
  onCancel: () => void
  initialData?: Partial<PurchaseRequest>
  inventoryItems?: InventoryItem[]  // Added: inventory catalog for selection
  vendors?: Vendor[]                // Optional: vendor list for per-item assignment
  isSaving?: boolean
  className?: string
}

export function PurchaseRequestForm({ onSave, onCancel, initialData, inventoryItems = [], vendors = [], isSaving, className }: PurchaseRequestFormProps) {
  const { user } = useUser()
  const [department, setDepartment] = useState(initialData?.department ?? "")
  const [requestNumber] = useState(initialData?.requestNumber ?? `PR-${Math.floor(10000 + Math.random() * 90000)}`)
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [priority, setPriority] = useState<PurchaseRequest['priority']>(initialData?.priority ?? "medium")
  const [searchTerm, setSearchTerm] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [items, setItems] = useState(initialData?.items ?? [
    { id: generateId(), name: "", quantity: 1, estimatedPrice: 0, inventoryItemId: "", vendorId: "", vendorName: "", trackInInventory: false }
  ])
  const [purpose, setPurpose] = useState(initialData?.purpose ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)
  }, [items])

  const tax = subtotal * 0.12 // 12% VAT
  const totalEstimate = subtotal + tax

  const canAddNewItem = useMemo(() => {
    if (items.length === 0) return true
    const lastItem = items[items.length - 1]
    return lastItem.name.trim() !== "" || lastItem.estimatedPrice > 0
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, estimatedPrice: 0, inventoryItemId: "", vendorId: "", vendorName: "", trackInInventory: false }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<{ name: string, quantity: number, estimatedPrice: number, inventoryItemId: string, vendorId: string, vendorName: string, trackInInventory: boolean }>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const handleVendorChange = (itemId: string, vendorId: string) => {
    if (!vendorId) {
      updateItem(itemId, { vendorId: '', vendorName: '' })
      return
    }
    const vendor = vendors.find(v => v.id === vendorId)
    if (vendor) {
      updateItem(itemId, { vendorId: vendor.id, vendorName: vendor.name })
    } else {
      updateItem(itemId, { vendorId: '', vendorName: '' })
    }
  }

  const handleInventorySelect = (inventoryItemId: string) => {
    const invItem = inventoryItems.find(i => i.id === inventoryItemId)
    if (invItem) {
      const existingItem = items.find(i => i.inventoryItemId === invItem.id)
      if (existingItem) {
        setItems(items.map(i => 
          i.inventoryItemId === invItem.id 
            ? { ...i, quantity: i.quantity + 10 } // Add default reorder qty
            : i
        ))
      } else {
        // Update first item or add new one with inventory data
        if (items.length === 1 && !items[0].name && !items[0].inventoryItemId) {
          setItems([{
            id: items[0].id,
            name: invItem.name,
            quantity: 10, // Default reorder quantity
            estimatedPrice: invItem.price * 0.7,
            inventoryItemId: invItem.id,
            trackInInventory: true
          }])
        } else {
          setItems([...items, {
            id: generateId(),
            name: invItem.name,
            quantity: 10,
            estimatedPrice: invItem.price * 0.7,
            inventoryItemId: invItem.id,
            trackInInventory: true
          }])
        }
      }
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!department.trim()) newErrors.department = "Department is required"
    if (items.length === 0) newErrors.items = "At least one item is required"

    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = "Name required"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (status: PurchaseRequestStatus) => {
    if (!validate()) return

    const request: PurchaseRequest = {
      id: initialData?.id ?? generateId(),
      requestNumber,
      requesterId: user?.id ?? "unknown",
      requesterName: user?.user_metadata?.full_name ?? "Unknown User",
      amount: totalEstimate,
      status,
      date: new Date(date).toISOString(),
      department,
      items,
      purpose,
      priority,
      justification: purpose || "Standard request",
      urgent: priority === 'urgent',
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(request)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 pb-32">

        {/* Section 1: Identity & Priority */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none",
                  errors.department && "border-red-500"
                )}
              >
                <option value="">Select Department...</option>
                <option value="IT">IT & Infrastructure</option>
                <option value="Marketing">Marketing & Creative</option>
                <option value="HR">Human Resources</option>
                <option value="Sales">Sales & Business Development</option>
                <option value="Ops">Operations</option>
              </select>
              {errors.department && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Level</Label>
              <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-12">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      priority === p
                        ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Purpose / Reason for Request</Label>
              <Textarea
                placeholder="Explain why this purchase is needed..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] p-5 focus:ring-teal-500 shadow-none border-dashed"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Items & Procurement */}
        <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Line Items & Catalog</h3>
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

          <div className="space-y-6">
            {/* Improved Item Selector: Quick Search and Add */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Quick Add from Catalog</Label>
                {inventoryItems.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {inventoryItems.filter(i => i.status === 'active').length} Active Products
                  </span>
                )}
              </div>

              <div className="relative group">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Type name or SKU to instantly add items..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-none"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    onFocus={() => setShowResults(true)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchTerm.length >= 1 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[320px] divide-y divide-slate-50 dark:divide-slate-800 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setShowResults(false)}
                  >
                    <div className="overflow-y-auto flex-1">
                      {inventoryItems
                        .filter(item =>
                          item.status === 'active' &&
                          (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((item) => {
                          const atp = item.stockQuantity - (item.reservedQuantity || 0)
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                handleInventorySelect(item.id)
                                setSearchTerm("")
                                setShowResults(false)
                              }}
                              className="w-full text-left px-5 py-4 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors flex items-center justify-between group/item"
                            >
                              <div className="flex flex-col min-w-0 flex-1 pr-4">
                                <span className="text-sm font-black text-slate-900 dark:text-white group-hover/item:text-teal-600 transition-colors truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5 truncate">
                                  SKU: {item.sku} · {item.category}
                                </span>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[13px] font-black text-slate-900 dark:text-white">
                                  ${item.price.toFixed(2)}
                                </span>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md mt-1",
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
                    </div>
                    {inventoryItems.filter(item =>
                      item.status === 'active' &&
                      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length === 0 && (
                        <div className="px-5 py-8 text-center bg-slate-50/30 dark:bg-slate-800/30">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">No matching products</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-bold">Try searching by category or full SKU</p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-none bg-slate-50/30 dark:bg-slate-900/30">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60">
                    <th className="px-6 py-4 w-1/2">Product / SKU</th>
                    <th className="px-4 py-4 w-48">Vendor</th>
                    <th className="px-4 py-4 w-[8%] text-center">Qty</th>
                    <th className="px-4 py-4 w-[15%] text-right">Unit Price</th>
                    <th className="px-4 py-4 w-[12%] text-right">Total</th>
                    <th className="px-4 py-4 w-[60px] text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-white dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-bold"
                          placeholder="Line item name or SKU..."
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        />
                        {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 tracking-wider">{errors[`item_${index}_name`]}</p>}
                      </td>
                      <td className="px-4 py-4">
                        {vendors.length > 0 ? (
                          <select
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-bold cursor-pointer hover:text-teal-600 transition-colors"
                            value={item.vendorId || ''}
                            onChange={(e) => handleVendorChange(item.id, e.target.value)}
                          >
                            <option value="">Choose Vendor...</option>
                            {vendors.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-bold"
                            placeholder="Type Vendor..."
                            value={item.vendorName || ''}
                            onChange={(e) => updateItem(item.id, { vendorName: e.target.value })}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 text-[10px] font-bold">$</span>
                          <input
                            type="number"
                            className="w-24 bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black text-right"
                            value={item.estimatedPrice}
                            onChange={(e) => updateItem(item.id, { estimatedPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">
                        ${(item.quantity * item.estimatedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right">
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
                    <td colSpan={6} className="px-6 py-10">
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>Line Total</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>VAT (12%)</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-48 h-px bg-slate-200 dark:bg-slate-800 my-1" />
                        <div className="flex items-center gap-12">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Total Amount</span>
                          <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                            ${totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.items}</p>}
          </div>
        </section>

        <section className="bg-amber-50/50 dark:bg-amber-900/5 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-1 h-3.5 bg-amber-500 rounded-full mt-1" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Procurement Policy Reminder</h4>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60 font-medium leading-relaxed">
                Requests over **$5,000** require CFO approval. Please ensure all quotes or bid documents are attached to the physical record after digital submission if required by your department head.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Requester</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">{user?.user_metadata?.full_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="h-10 px-6 font-bold text-[11px]"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave('pending_review')}
            disabled={isSaving}
            className="h-10 px-8 font-black bg-teal-600 hover:bg-teal-700 text-white text-[11px] rounded-lg shadow-sm uppercase tracking-widest disabled:bg-slate-200"
          >
            {isSaving ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>
    </div>
  )
}
