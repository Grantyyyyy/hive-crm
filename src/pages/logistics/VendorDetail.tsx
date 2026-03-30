import { useState, useMemo, useRef, useEffect } from "react"
import { useRoute, useLocation, Link } from "wouter"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Receipt,
  Calendar,
  Clock,
  Trash2,
  Pencil,
  ChevronDown,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"
import { useCRMResource } from "@/lib/hooks"
import type { Vendor } from "@/lib/types"

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function VendorStatusDropdown({
  vendor,
  onStatusChange,
}: {
  vendor: Vendor
  onStatusChange: (id: string, status: Vendor['status']) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (status: Vendor['status']) => {
    if (status === vendor.status || loading) return
    setLoading(true)
    await onStatusChange(vendor.id, status)
    setLoading(false)
    setOpen(false)
  }

  const statuses: Vendor['status'][] = ['active', 'inactive', 'on_hold']

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

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                    text-[10px] font-black uppercase tracking-widest
                    cursor-pointer hover:opacity-80 transition-opacity
                    disabled:opacity-50 ${badgeClass[vendor.status]}`}
      >
        {loading ? '...' : label[vendor.status]}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px]
                        bg-white dark:bg-slate-900 border border-slate-200
                        dark:border-slate-800 rounded-md shadow-lg
                        overflow-hidden">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2
                         text-sm text-left hover:bg-slate-50
                         dark:hover:bg-slate-800 transition-colors
                         text-slate-700 dark:text-slate-300"
            >
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px]
                                font-black uppercase tracking-widest
                                ${badgeClass[s]}`}>
                {label[s]}
              </span>
              {s === vendor.status && (
                <Check className="w-3.5 h-3.5 ml-auto text-slate-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function VendorDetail() {
  const [, params] = useRoute("/vendors/:id")
  const [, navigate] = useLocation()
  const vendorId = params?.id ?? ""

  const { data: vendors, updateItem, deleteItem, isLoaded } = useCRMResource<Vendor>('vendors')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const vendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId])

  const handleStatusChange = async (
    id: string,
    status: Vendor['status']
  ) => {
    try {
      await updateItem(id, {
        status,
        updatedAt: new Date().toISOString()
      })
      toast.success('Vendor updated', {
        description: `Status changed to ${status.replace('_', ' ')}.`
      })
    } catch (e: unknown) {
      toast.error('Failed to update vendor', {
        description: (e as Error).message
      })
    }
  }

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

  if (!isLoaded) return <PageSkeleton />

  if (!vendor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Building2 className="w-10 h-10 text-slate-300" />
        <h2 className="text-sm font-medium text-slate-500">Vendor not found</h2>
        <Link href="/vendors">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4" /> Back to Vendors
          </Button>
        </Link>
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

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-4 md:p-8 max-w-full space-y-6 animate-fade-in">

        {/* Back */}
        <Link
          href="/vendors"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Vendors
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {vendor.name}
                  </h1>
                  <VendorStatusDropdown vendor={vendor} onStatusChange={handleStatusChange} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Contact Information</h2>
              <div className="space-y-4">
                {vendor.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Email</p>
                      <a href={`mailto:${vendor.email}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Phone</p>
                      <a href={`tel:${vendor.phone}`} className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Website</p>
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {vendor.website}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{vendor.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {vendor.notes && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Notes</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{vendor.notes}</p>
              </div>
            )}
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-6">

            {/* Vendor Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Vendor Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Category</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.category || "Supplier"}</p>
                  </div>
                </div>
                {vendor.taxId && (
                  <div className="flex items-start gap-3">
                    <Receipt className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Tax ID / VAT</p>
                      <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{vendor.taxId}</p>
                    </div>
                  </div>
                )}
                {vendor.paymentTerms && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Payment Terms</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{vendor.paymentTerms}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{relativeTime(vendor.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Current</span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    badgeClass[vendor.status]
                  )}>
                    {label[vendor.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {vendor.status === 'active' && 'This vendor is approved and operational for procurement.'}
                  {vendor.status === 'inactive' && 'This vendor is no longer used for procurement activities.'}
                  {vendor.status === 'on_hold' && 'This vendor is temporarily paused due to payment or compliance issues.'}
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 pb-3 mb-4">Danger Zone</h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mb-4 leading-relaxed">
                Deleting this vendor cannot be undone and will remove all associated records.
              </p>
              <Button
                variant="destructive"
                className="w-full rounded-xl"
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? 'Deleting...' : 'Delete Vendor'}
              </Button>
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
