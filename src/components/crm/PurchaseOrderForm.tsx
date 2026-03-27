import { useState, useMemo } from "react"
import { Plus, Trash2, Info, Package, Truck, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { PurchaseOrder, PurchaseOrderStatus, InventoryItem } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface PurchaseOrderFormProps {
  onSave: (order: PurchaseOrder) => void
  onCancel: () => void
  initialData?: Partial<PurchaseOrder>
  inventoryItems?: InventoryItem[]  // Added: inventory catalog for selection
}

export function PurchaseOrderForm({ onSave, onCancel, initialData, inventoryItems = [] }: PurchaseOrderFormProps) {
  const [vendorName, setVendorName] = useState(initialData?.vendorName ?? "")
  const [poNumber] = useState(initialData?.poNumber ?? `PO-${Math.floor(10000 + Math.random() * 90000)}`)
  const [referenceId, setReferenceId] = useState(initialData?.referenceId ?? "")
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [expectedDelivery, setExpectedDelivery] = useState(initialData?.expectedDelivery ? new Date(initialData.expectedDelivery).toISOString().split('T')[0] : "")
  const [showInventory, setShowInventory] = useState(false)
  const [items, setItems] = useState(initialData?.items ?? [
    { id: generateId(), name: "", quantity: 1, price: 0, inventoryItemId: "" }
  ])
  const [shippingInfo, setShippingInfo] = useState(initialData?.shippingInfo ?? "")
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes ?? "")
  const [vendorInstructions, setVendorInstructions] = useState(initialData?.vendorInstructions ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, price: 0, inventoryItemId: "" }])
    setShowInventory(false)
  }

  const addFromInventory = (item: InventoryItem) => {
    setItems([...items, {
      id: generateId(),
      name: item.name,
      quantity: 10, // Default order quantity
      price: item.price * 0.7, // Default vendor price (70% of retail)
      inventoryItemId: item.id
    }])
    setShowInventory(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<{ name: string, quantity: number, price: number, inventoryItemId: string }>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!vendorName.trim()) newErrors.vendorName = "Vendor name is required"
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
      vendorId: initialData?.vendorId ?? generateId(), // Placeholder vendor ID
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 translate-x-0 transition-transform duration-300 ease-in-out">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 pb-32">

        {/* Section: Order Details */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Order Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Vendor Name</Label>
              <Input
                placeholder="Enter vendor name..."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className={cn(
                  "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                  errors.vendorName && "border-red-500"
                )}
              />
              {errors.vendorName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.vendorName}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reference ID</Label>
              <Input
                placeholder="REF-XXXX"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Delivery</Label>
              <DatePicker
                value={expectedDelivery}
                onChange={setExpectedDelivery}
                className="h-12 py-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </section>

        {/* Section: Shipping Information */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Shipping Information</h3>
          </div>
          <Textarea
            placeholder="Enter destination address and shipping method..."
            value={shippingInfo}
            onChange={(e) => setShippingInfo(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] p-5 focus:ring-indigo-500 shadow-sm"
          />
        </section>

        {/* Section: Products & Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Products & Items</h3>
            </div>
            <div className="flex items-center gap-2">
              {inventoryItems && inventoryItems.length > 0 && (
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
                    <div className="absolute right-0 top-full mt-1 w-72 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 divide-y divide-slate-50 dark:divide-slate-800">
                      {inventoryItems
                        .filter(item => item.status === 'active')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item) => {
                          const atp = item.stockQuantity - (item.reservedQuantity || 0)
                          return (
                            <button
                              key={item.id}
                              onClick={() => addFromInventory(item)}
                              className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group"
                            >
                              <div className="text-[12px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">{item.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                ATP: {atp} • ${item.price.toFixed(2)} • SKU: {item.sku}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="h-8 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-transparent px-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
            </div>
          </div>

          {inventoryItems && inventoryItems.length === 0 && (
            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              No active inventory items found. Items must be created in the Inventory module first.
            </p>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-4">Product / SKU</th>
                  <th className="px-5 py-4 w-24 text-center">Qty</th>
                  <th className="px-5 py-4 w-32 text-right">Unit Price</th>
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
                        placeholder="Item name or SKU..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                      {errors[`item_${index}_name`] && <p className="text-[8px] font-bold text-red-500 uppercase mt-1">{errors[`item_${index}_name`]}</p>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="number"
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-medium text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          className="w-24 bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-medium text-right"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td colSpan={3} className="px-5 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Amount</td>
                  <td className="px-5 py-5 text-right text-lg font-black text-slate-900 dark:text-white">
                    ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.items}</p>}
        </section>

        {/* Section: Internal Notes & Vendor Instructions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Internal Notes</h3>
            </div>
            <Textarea
              placeholder="Notes for internal used only..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[120px] p-4 text-sm focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Info className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vendor Instructions</h3>
            </div>
            <Textarea
              placeholder="Specific instructions for the vendor..."
              value={vendorInstructions}
              onChange={(e) => setVendorInstructions(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[120px] p-4 text-sm focus:ring-indigo-500"
            />
          </div>
        </section>
      </div>
      
      {/* Footer Actions */}
      <div className="px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSave('draft')}
          className="h-10 px-4 font-bold text-[11px] text-slate-500"
        >
          Save as Draft
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-10 px-4 font-bold text-[11px]"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave('pending')}
            className="h-10 px-6 font-black bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-lg shadow-sm"
          >
            Create Purchase Order
          </Button>
        </div>
      </div>
    </div>
  )
}
