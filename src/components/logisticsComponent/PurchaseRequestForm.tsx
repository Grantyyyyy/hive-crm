import { useState, useMemo } from "react"
import { Plus, Trash2, Package, AlertTriangle, Layers, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/reusables/form-actions"
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
  const [showInventory, setShowInventory] = useState(false)
  const [items, setItems] = useState(initialData?.items ?? [])
  const [purpose, setPurpose] = useState(initialData?.purpose ?? "")
  const [vendorSearch, setVendorSearch] = useState("")
  const [activeVendorItemId, setActiveVendorItemId] = useState<string | null>(null)
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

  const filteredVendors = useMemo(() => {
    // Get unique vendor IDs already used in this PR
    const usedVendorIds = new Set(items.map(i => i.vendorId).filter(id => !!id))

    return [...vendors]
      .filter(v =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        (v.category?.toLowerCase() ?? "").includes(vendorSearch.toLowerCase())
      )
      .sort((a, b) => {
        const aUsed = usedVendorIds.has(a.id) ? 1 : 0
        const bUsed = usedVendorIds.has(b.id) ? 1 : 0
        return bUsed - aUsed // Prioritize used vendors
      })
  }, [vendors, vendorSearch, items])

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
      ownerId: user?.id ?? "unknown",
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
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 pb-10">

        {/* Section 1: Identity & Priority */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3.5 bg-accent rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Context</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-accent outline-none",
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
                        ? "bg-white dark:bg-slate-800 text-accent shadow-sm border border-slate-200 dark:border-slate-700"
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
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] p-5 focus:ring-accent shadow-none border-dashed"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Items & Procurement */}
        <section className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div id="items" className="w-1 h-3.5 bg-accent rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Products & Procurement</h3>
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
                      showInventory ? "bg-accent-dim text-accent underline underline-offset-4" : "text-accent hover:bg-accent-dim"
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 flex-1">
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
                                setShowInventory(false)
                              }}
                              className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-start justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-accent truncate">{item.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight line-clamp-1">{item.sku} • {item.category}</div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <div className="text-[13px] font-black text-slate-900 dark:text-white">
                                  ${item.price.toFixed(2)}
                                </div>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md",
                                  atp > 0
                                    ? "bg-accent-dim text-accent"
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                                )}>
                                  {atp} Available
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      {inventoryItems.filter(item =>
                        item.status === 'active' &&
                        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 && (
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

          <div className="space-y-6">

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-none bg-slate-50/30 dark:bg-slate-900/30">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60">
                    <th className="px-6 py-4 w-1/2">Product / SKU</th>
                    <th className="px-4 py-4 w-48">Vendor</th>
                    <th className="px-4 py-4 w-[10%] text-center">Qty</th>
                    <th className="px-4 py-4 w-[15%] text-right">Unit Price</th>
                    <th className="px-4 py-4 w-[15%] text-right">Total</th>
                    <th className="px-6 py-4 w-12 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <input
                          className={cn(
                            "w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-accent",
                            errors[`item_${index}_name`] ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
                          )}
                          placeholder="Line item name or SKU..."
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        />
                        {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 tracking-wider">{errors[`item_${index}_name`]}</p>}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="relative group/vendor pt-1">
                          <div
                            onClick={() => !isSaving && setActiveVendorItemId(activeVendorItemId === item.id ? null : item.id)}
                            className={cn(
                              "flex items-center justify-between cursor-pointer group-hover/vendor:text-accent transition-colors",
                              activeVendorItemId === item.id && "text-accent"
                            )}
                          >
                            <span className={cn("text-[11px] font-black uppercase tracking-tighter truncate", !item.vendorId && "text-slate-300")}>
                              {item.vendorName || "Select Vendor..."}
                            </span>
                            <ChevronDown className={cn("w-3 h-3 text-slate-300 transition-transform", activeVendorItemId === item.id && "rotate-180 text-accent")} />
                          </div>

                          {activeVendorItemId === item.id && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[80] p-2 flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="px-2 pb-2 pt-1">
                                <input
                                  autoFocus
                                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-accent outline-none placeholder:text-slate-400"
                                  placeholder="Search vendors..."
                                  value={vendorSearch}
                                  onChange={(e) => setVendorSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-200">
                                {filteredVendors.length > 0 ? (
                                  filteredVendors.map(v => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        handleVendorChange(item.id, v.id)
                                        setActiveVendorItemId(null)
                                        setVendorSearch("")
                                      }}
                                      className="w-full text-left p-3 hover:bg-accent-dim transition-colors flex flex-col gap-0.5 first:rounded-t-lg last:rounded-b-lg"
                                    >
                                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">{v.name}</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.category || "General"}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    No vendors found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
                          value={item.estimatedPrice}
                          onChange={(e) => updateItem(item.id, { estimatedPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-4 align-top text-right pt-5 font-black text-slate-900 dark:text-white text-[13px] tracking-tight">
                        ${(item.quantity * item.estimatedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                    <td colSpan={6} className="px-6 py-10">
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>Line Total</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <span>VAT (12%)</span>
                          <span className="text-slate-900 dark:text-white min-w-[100px] text-right">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-48 h-px bg-slate-200 dark:bg-slate-800 my-1" />
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Total Amount</span>
                          <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                            ${totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </td>
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

      <FormActions
        leading={
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-slate-400">Requester</span>
            <span className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{user?.user_metadata?.full_name}</span>
          </div>
        }
        cancel={{ label: "Cancel", onClick: onCancel, disabled: isSaving }}
        primary={{
          label: isSaving ? "Submitting..." : "Submit for Review",
          onClick: () => handleSave("pending_review"),
          disabled: isSaving,
        }}
      />
    </div>
  )
}
