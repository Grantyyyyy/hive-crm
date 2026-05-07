import { useState, useEffect } from "react"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { InventoryItem } from "@/lib/types"

export interface StockAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  onConfirm: (newQuantity: number, reason: string) => Promise<void>
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  item,
  onConfirm,
}: StockAdjustmentModalProps) {
  const [newQuantity, setNewQuantity] = useState(item?.stockQuantity?.toString() ?? "0")
  const [reason, setReason] = useState("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  // Reset form every time the modal opens
  useEffect(() => {
    if (open && item) {
      setNewQuantity(item.stockQuantity.toString())
      setReason("")
      setIsAdjusting(false)
    }
  }, [open, item])

  const handleConfirm = async () => {
    if (!item) return
    const qty = parseInt(newQuantity, 10)
    if (isNaN(qty) || qty < 0) {
      alert("Please enter a valid quantity")
      return
    }
    if (!reason.trim()) {
      alert("Please provide a reason for the adjustment")
      return
    }
    if (qty < (item.reservedQuantity ?? 0)) {
      throw new Error(
        `Cannot reduce stock below reserved quantity (${item.reservedQuantity} units reserved)`
      )
    }

    setIsAdjusting(true)
    try {
      await onConfirm(qty, reason)
      onOpenChange(false)
    } catch (e: unknown) {
      throw e
    } finally {
      setIsAdjusting(false)
    }
  }

  if (!item) return null

  const reserved = item.reservedQuantity ?? 0
  const available = item.stockQuantity - reserved

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Icon Section */}
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          {/* Text Section */}
          <DialogHeader className="p-0 text-left space-y-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Adjust Stock - {item.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Manually adjust the physical stock quantity for this item.
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Current Stock Info */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{item.stockQuantity}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reserved</p>
                <p className="text-lg font-bold text-accent">{reserved}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available</p>
                <p className={`text-lg font-bold ${available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {available}
                </p>
              </div>
            </div>

            {/* New Quantity Input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New Physical Quantity
              </Label>
              <Input
                type="number"
                min={0}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                disabled={isAdjusting}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent"
              />
              {parseInt(newQuantity, 10) < reserved && (
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  ⚠️ Cannot be less than reserved ({reserved} units)
                </p>
              )}
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Adjustment
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Cycle count adjustment, damaged goods, found extra stock..."
                disabled={isAdjusting}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[80px] text-sm p-3 focus:ring-4 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          {/* Actions Section */}
          <DialogFooter className="flex gap-3 sm:justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isAdjusting}
              className="h-10 px-5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-5 rounded-full text-sm font-semibold bg-accent hover:opacity-90 text-white shadow-md transition-all"
              onClick={handleConfirm}
              disabled={isAdjusting || !reason.trim() || parseInt(newQuantity, 10) < reserved}
            >
              {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
