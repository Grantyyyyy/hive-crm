import { Trash2, Tag } from "lucide-react"
import { DebouncedInput } from "./DebouncedInput"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export interface MobileLineItemCardProps {
  id: string
  index: number
  name: string
  quantity: number
  price: number
  description?: string
  discountId?: string
  discountValue?: number
  discountType?: "percentage" | "fixed"
  activeLineDiscounts?: Array<{
    id: string
    name: string
    value: number
    type: "percentage" | "fixed"
    minOrderAmount?: number
  }>
  error?: string
  lastItemRef?: React.Ref<any>
  onUpdate: (fields: {
    name?: string
    quantity?: number
    price?: number
    description?: string
    discountId?: string
    discountValue?: number
    discountType?: "percentage" | "fixed"
  }) => void
  onRemove: () => void
  formatCurrency?: (val: number) => string
}

export function MobileLineItemCard({
  index,
  name,
  quantity,
  price,
  description,
  discountId,
  discountValue,
  discountType,
  activeLineDiscounts,
  error,
  lastItemRef,
  onUpdate,
  onRemove,
  formatCurrency,
}: MobileLineItemCardProps) {
  // Calculate line total locally
  const baseTotal = quantity * price;
  const lineTotal = discountId && discountValue !== undefined 
    ? (discountType === 'percentage' ? (baseTotal * (1 - discountValue / 100)) : (baseTotal - discountValue))
    : baseTotal;

  const defaultFormat = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const displayCurrency = formatCurrency || defaultFormat;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl space-y-3.5 relative overflow-hidden transition-all shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Row 1: Title & Delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Product Name / SKU</Label>
          <DebouncedInput
            id={`item_${index}_name_mobile`}
            ref={lastItemRef}
            className={cn(
              "w-full bg-transparent border-b border-transparent focus:border-accent/30 focus:ring-0 p-0 text-[13px] font-black placeholder:text-slate-300 transition-colors focus:placeholder:text-accent/60 outline-none pb-0.5 mt-0.5",
              error ? "text-red-500 placeholder:text-red-300" : "text-slate-900 dark:text-slate-100"
            )}
            placeholder={description !== undefined ? "Primary item name..." : "Product name..."}
            value={name}
            onChange={(val) => onUpdate({ name: val })}
          />
          {description !== undefined && (
            <DebouncedInput
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-slate-500 dark:text-slate-400 placeholder:text-slate-300 transition-colors focus:placeholder:text-accent/60 outline-none mt-1"
              placeholder="Optional technical description..."
              value={description || ""}
              onChange={(val) => onUpdate({ description: val })}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-300 hover:text-red-500 transition-all scale-100 hover:scale-110 active:scale-95 shrink-0 mt-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Grid of Qty & Unit Price */}
      <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
        {/* Qty Selector */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Quantity</Label>
          <div className="flex items-center justify-between border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900 shadow-sm overflow-hidden h-9 w-full transition-all focus-within:ring-2 focus-within:ring-accent/20">
            <button
              type="button"
              onClick={() => onUpdate({ quantity: Math.max(0, quantity - 1) })}
              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-black"
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
              value={quantity}
              onChange={(val) => onUpdate({ quantity: Math.max(0, parseInt(val) || 0) })}
            />
            <button
              type="button"
              onClick={() => onUpdate({ quantity: quantity + 1 })}
              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-black"
            >
              +
            </button>
          </div>
        </div>

        {/* Unit Price */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Unit Price</Label>
          <div className="relative flex items-center h-9 w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden px-2 transition-all focus-within:ring-2 focus-within:ring-accent/20">
            <span className="text-[10px] font-bold text-slate-400 mr-1">$</span>
            <DebouncedInput
              type="number"
              min={0}
              onKeyDown={(e) => {
                if (e.key === '-') e.preventDefault()
              }}
              className="w-full bg-transparent border-none text-[12px] font-black text-slate-900 dark:text-slate-100 text-right focus:ring-0 p-0 outline-none"
              value={price}
              onChange={(val) => onUpdate({ price: Math.max(0, parseFloat(val) || 0) })}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Discount Selector & Line Total */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
        {/* Discount Select */}
        <div className="flex-1 max-w-[160px]">
          {activeLineDiscounts && (
            <Popover>
              <PopoverTrigger asChild>
                {discountId && activeLineDiscounts.find(x => x.id === discountId) ? (
                  <button type="button" className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-accent/20 transition-all select-none">
                    <Tag className="w-2.5 h-2.5" />
                    {activeLineDiscounts.find(x => x.id === discountId)?.name} ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`})
                  </button>
                ) : (
                  <button type="button" className="text-[9px] font-black uppercase tracking-wider text-slate-400 border border-slate-200/60 dark:border-slate-800/60 px-2 py-1 rounded-lg flex items-center gap-1 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all select-none">
                    <Tag className="w-2.5 h-2.5" />
                    Discount
                  </button>
                )}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl space-y-2">
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">Apply Line Discount</div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ discountId: undefined, discountValue: undefined, discountType: undefined });
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between",
                      !discountId ? "text-accent bg-accent/5 font-black" : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    No Discount
                  </button>
                  {activeLineDiscounts.map(d => {
                    const isSelected = discountId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const lineTotalVal = quantity * price;
                          if (d.minOrderAmount && lineTotalVal < d.minOrderAmount) {
                            toast.error(`Cannot apply "${d.name}"`, {
                              description: `Line total ($${lineTotalVal.toFixed(2)}) must be at least $${d.minOrderAmount.toFixed(2)}.`
                            });
                            return;
                          }
                          onUpdate({ discountId: d.id, discountValue: d.value, discountType: d.type });
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between",
                          isSelected ? "text-accent bg-accent/5 font-black" : "text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <span>{d.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {d.type === 'percentage' ? `${d.value}%` : `$${d.value}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Line Total */}
        <div className="text-right flex flex-col items-end gap-0.5">
          {discountId && discountValue !== undefined && (
            <span className="text-[9px] text-slate-400 line-through">
              {displayCurrency(baseTotal)}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total:</span>
            <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
              {displayCurrency(lineTotal)}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
