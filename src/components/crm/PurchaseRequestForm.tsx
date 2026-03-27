import { useState, useMemo } from "react"
import { Plus, Trash2, Package, AlertTriangle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { PurchaseRequest, PurchaseRequestStatus } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { useUser } from "@clerk/clerk-react"

interface PurchaseRequestFormProps {
  onSave: (request: PurchaseRequest) => void
  onCancel: () => void
  initialData?: Partial<PurchaseRequest>
}

export function PurchaseRequestForm({ onSave, onCancel, initialData }: PurchaseRequestFormProps) {
  const { user } = useUser()
  const [department, setDepartment] = useState(initialData?.department ?? "")
  const [requestNumber] = useState(initialData?.requestNumber ?? `PR-${Math.floor(10000 + Math.random() * 90000)}`)
  const [date] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [priority, setPriority] = useState<PurchaseRequest['priority']>(initialData?.priority ?? "medium")
  const [items, setItems] = useState(initialData?.items ?? [
    { id: generateId(), name: "", quantity: 1, estimatedPrice: 0 }
  ])
  const [purpose, setPurpose] = useState(initialData?.purpose ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalEstimate = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0)
  }, [items])

  const addItem = () => {
    setItems([...items, { id: generateId(), name: "", quantity: 1, estimatedPrice: 0 }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<{ name: string, quantity: number, estimatedPrice: number }>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
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
      requesterName: user?.fullName ?? "Unknown User",
      amount: totalEstimate,
      status,
      date: new Date(date).toISOString(),
      department,
      items,
      purpose,
      priority,
      requestedQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      estimatedPrice: totalEstimate,
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

          <div className="rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm font-sans">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Item Name / Description</th>
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
                  <td colSpan={3} className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total Estimated Budget</td>
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
          <div className="p-6 rounded-[1.5rem] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-5">
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
      <div className="fixed bottom-0 left-0 right-0 px-10 py-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requester</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.fullName}</span>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl px-6 font-bold"
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={() => handleSave('pending_review')}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-12 shadow-xl shadow-indigo-200 dark:shadow-none font-bold text-xs uppercase tracking-widest"
          >
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  )
}
