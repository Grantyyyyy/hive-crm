import { useState } from "react"
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

  // Reset form when modal opens with a new item
  useState(() => {
    if (open && item) {
      setNewQuantity(item.stockQuantity.toString())
      setReason("")
      setIsAdjusting(false)
    }
  })

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-indigo-500" />
            </span>
            Adjust Stock - {item.name}
          </DialogTitle>
          <DialogDescription className="pt-1">
            Manually adjust the physical stock quantity for this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stock Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{item.stockQuantity}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reserved</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{reserved}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available</p>
              <p className="text-lg font-bold {available >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
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
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
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
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] text-sm p-3"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:justify-end">
          <Button
            variant="outlineNeutral"
            onClick={() => onOpenChange(false)}
            disabled={isAdjusting}
          >
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleConfirm}
            disabled={isAdjusting || !reason.trim() || parseInt(newQuantity, 10) < reserved}
          >
            {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
