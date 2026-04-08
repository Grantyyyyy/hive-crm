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
}

export function PurchaseRequestForm({ onSave, onCancel, initialData, inventoryItems = [], vendors = [] }: PurchaseRequestFormProps) {
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

  const totalEstimate = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)
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

        {/* Section: Request Info */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Request Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
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
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-12">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      priority === p
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
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
                className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] p-5 focus:ring-indigo-500 shadow-sm transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section: Requested Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Requested Items</h3>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={addItem}
              className="h-auto p-0 font-bold text-indigo-600 dark:text-indigo-400"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Item
            </Button>
          </div>

          {/* Improved Item Selector: Quick Search and Add */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Add from Inventory</Label>
              {inventoryItems.length > 0 && (
                <span className="text-[10px] font-medium text-slate-400">
                  {inventoryItems.filter(i => i.status === 'active').length} active items available
                </span>
              )}
            </div>

            <div className="relative group">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 min-w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by Item Name, SKU, or Category..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm group-focus-within:shadow-md"
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
                            className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group/item"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:text-indigo-600 transition-colors">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                SKU: {item.sku} · {item.category}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                ${item.price.toFixed(2)}
                              </span>
                              <span className={cn(
                                "text-[9px] font-bold uppercase",
                                atp <= 5 ? "text-amber-500" : "text-slate-400"
                              )}>
                                ATP: {atp}
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
                      <div className="px-5 py-8 text-center bg-slate-50/50 dark:bg-slate-800/50">
                        <p className="text-sm font-bold text-slate-400">No matching items found</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Check spelling or try SKU</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm font-sans">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Item Name / Description</th>
                  <th className="px-6 py-4 w-48">Vendor</th>
                  <th className="px-6 py-4 w-32 text-center">Track in Inv.</th>
                  <th className="px-6 py-4 w-28 text-center">Quantity</th>
                  <th className="px-6 py-4 w-36 text-right">Est. Cost</th>
                  <th className="px-6 py-4 w-36 text-right">Total Est.</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-6 py-4">
                      <input
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-bold"
                        placeholder="What do you need?..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                      {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1">{errors[`item_${index}_name`]}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {vendors.length > 0 ? (
                        <select
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-bold cursor-pointer"
                          value={item.vendorId || ''}
                          onChange={(e) => handleVendorChange(item.id, e.target.value)}
                        >
                          <option value="">No vendor</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-bold"
                          placeholder="Vendor name..."
                          value={item.vendorName || ''}
                          onChange={(e) => updateItem(item.id, { vendorName: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        checked={item.trackInInventory ?? !!item.inventoryItemId}
                        onChange={(e) => updateItem(item.id, { trackInInventory: e.target.checked })}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          className="w-24 bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black text-right"
                          value={item.estimatedPrice}
                          onChange={(e) => updateItem(item.id, { estimatedPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                      ${(item.quantity * item.estimatedPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td colSpan={5} className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total Estimated Budget</td>
                  <td className="px-6 py-6 text-right text-xl font-black text-indigo-600 dark:text-indigo-400">
                    ${totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.items}</p>}
        </section>

        {/* Info Box */}
        <section className="pb-10">
          <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-5">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">Policy Reminder</h4>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/60 font-medium leading-relaxed">
                Requests over $5,000 require CFO approval. Please ensure all quotes are attached after submission if required by your department head.
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
            className="h-10 px-6 font-bold text-[11px]"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave('pending_review')}
            className="h-10 px-8 font-black bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-lg shadow-sm uppercase tracking-widest"
          >
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  )
}
