import { useState, useMemo } from "react"
import { useRoute, useLocation, Link } from "wouter"
import {
  ArrowLeft,
  Building2,
  Trash2,
  Pencil
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import { BackButton } from "@/components/reusables/BackButton"
import { formatCurrency, relativeTime } from "@/lib/helpers"
import type { Vendor, PurchaseOrder } from "@/lib/types"

export function VendorDetail() {
  const [, params] = useRoute("/vendors/:id")
  const [, navigate] = useLocation()
  const vendorId = params?.id ?? ""

  const { data: vendors, deleteItem, isLoaded } = useCRMResource<Vendor>('vendors')
  const { data: purchaseOrders } = useCRMResource<PurchaseOrder>('purchase_orders')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const vendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId])

  const vendorPOs = useMemo(() => {
    return (purchaseOrders ?? []).filter(po => po.vendorId === vendorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [purchaseOrders, vendorId])

  const handleDelete = async () => {
    if (!vendor || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteItem(vendor.id)
      toast.success('Vendor deleted', {
        description: `${vendor.name} has been removed.`
      })
      navigate('/vendors')
    } catch (e: unknown) {
      toast.error('Failed to delete vendor', {
        description: (e as Error).message
      })
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!isLoaded) return <DetailSkeleton />

  if (!vendor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Building2 className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">Vendor not found</h2>
        <BackButton href="/vendors" className="mb-2" />
      </div>
    )
  }

  const badgeClass = {
    active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    on_hold: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  }

  const label = {
    active: 'Active',
    inactive: 'Inactive',
    on_hold: 'On Hold',
  }

  const initials = vendor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  // PO stats
  const totalSpend = vendorPOs
    .filter(po => po.status !== 'cancelled')
    .reduce((sum, po) => sum + po.amount, 0)
  const activePOs = vendorPOs.filter(po => po.status === 'pending' || po.status === 'sent').length
  const receivedPOs = vendorPOs.filter(po => po.status === 'fully_received').length
  const avgOrder = vendorPOs.length > 0 ? totalSpend / vendorPOs.length : 0

  const poStatusColors: Record<string, string> = {
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    sent: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    fully_received: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        {/* Back */}
        <BackButton href="/vendors" label="Back to Vendors" className="mb-2" />

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="size-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xl font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {vendor.name}
                  </h1>
                  {vendor.category && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {vendor.category}
                    </span>
                  )}
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    badgeClass[vendor.status]
                  )}>
                    {label[vendor.status]}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Created {relativeTime(vendor.createdAt)} · {new Date(vendor.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="outlineNeutral" onClick={() => toast.info('Edit functionality coming soon')}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN — Vendor Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Email</p>
                  {vendor.email ? (
                    <a href={`mailto:${vendor.email}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {vendor.email}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Phone</p>
                  {vendor.phone ? (
                    <a href={`tel:${vendor.phone}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {vendor.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Website</p>
                  {vendor.website ? (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {vendor.website}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Address</p>
                  {vendor.address ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.address}</p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Business Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Category</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.category || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Tax ID</p>
                  {vendor.taxId ? (
                    <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{vendor.taxId}</p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Payment Terms</p>
                  {vendor.paymentTerms ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.paymentTerms}</p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Created</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{relativeTime(vendor.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Updated</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{relativeTime(vendor.updatedAt)}</p>
                </div>
              </div>

              {vendor.notes && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-6" />
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Notes</h2>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{vendor.notes}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Purchase Orders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Purchase Orders</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {vendorPOs.length}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total spend: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalSpend)}</span>
                </p>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{activePOs}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Active</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{receivedPOs}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Received</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpend)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Total Value</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(avgOrder)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Avg Order</p>
                </div>
              </div>

              {/* PO Table */}
              {vendorPOs.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-400 dark:text-slate-500 font-medium">No purchase orders yet</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Purchase orders linked to this vendor will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500 px-4 py-3 bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-4 py-3">PO Number</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Expected Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorPOs.map(po => (
                        <tr
                          key={po.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/purchase-orders/${po.id}`}
                              className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              {po.poNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {new Date(po.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(po.amount)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                              poStatusColors[po.status]
                            )}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {po.expectedDelivery
                                ? new Date(po.expectedDelivery).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '—'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Vendor"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-slate-100">{vendor.name}</strong>?
            This will permanently remove this vendor and all associated data.
          </>
        }
        onDelete={handleDelete}
        cancelText="Keep Vendor"
        deleteText="Delete Vendor"
        loading={isDeleting}
      />
    </div>
  )
}
