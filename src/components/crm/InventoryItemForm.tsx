import { useState } from "react"
import { Package, Hash, Tag, DollarSign, Database, Activity, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { InventoryItem, InventoryStatus, StockLevel } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItem>
  onSave: (item: InventoryItem) => void
  onCancel: () => void
}

export function InventoryItemForm({ initialData, onSave, onCancel }: InventoryItemFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [sku, setSku] = useState(initialData?.sku ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "0")
  const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity?.toString() ?? "0")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [status, setStatus] = useState<InventoryStatus>(initialData?.status ?? "active")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Product name is required"
    if (!sku.trim()) newErrors.sku = "SKU is required"
    if (!category.trim()) newErrors.category = "Category is required"
    if (parseFloat(price) < 0) newErrors.price = "Invalid price"
    if (parseInt(stockQuantity) < 0) newErrors.stockQuantity = "Invalid quantity"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const qty = parseInt(stockQuantity)
    let level: StockLevel = 'in_stock'
    if (qty <= 0) level = 'out_of_stock'
    else if (qty <= 10) level = 'low_stock'

    const item: InventoryItem = {
      id: initialData?.id ?? generateId(),
      name,
      sku,
      category,
      price: parseFloat(price),
      stockQuantity: qty,
      reservedQuantity: initialData?.reservedQuantity ?? 0,
      stockLevel: level,
      status,
      description,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(item)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300">
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-32">
        
        {/* Section: Basic Information */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Name</Label>
              <div className="relative group">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="e.g. Premium Wireless Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all",
                    errors.name && "border-red-500 focus:ring-red-500/20"
                  )}
                />
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SKU / Item Code</Label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="SKU-XXXX-X"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={cn(
                    "h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all",
                    errors.sku && "border-red-500"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="e.g. Electronics"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={cn(
                    "h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all",
                    errors.category && "border-red-500"
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Pricing & Stock */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Pricing & Inventory</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit Price ($)</Label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={cn(
                    "h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all",
                    errors.price && "border-red-500"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Stock Quantity</Label>
              <div className="relative group">
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  type="number"
                  placeholder="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className={cn(
                    "h-12 pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all",
                    errors.stockQuantity && "border-red-500"
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Details */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Additional Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</Label>
              <Textarea
                placeholder="Product technical specifications and details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[120px] p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Status</Label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                {(['active', 'draft'] as InventoryStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                      status === s
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 z-20">
        <Button
          variant="outlineNeutral"
          onClick={onCancel}
          className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest h-12 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            className="rounded-xl px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
          >
            Create Product
          </Button>
        </div>
      </div>
    </div>
  )
}
