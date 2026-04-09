import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/reusables/DataTable"
import { useLocation } from "wouter"
import {
  BarChart3,
  Search,
  PlusCircle,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DealForm } from "@/components/crmComponent/DealForm"
import { LostReasonModal } from "@/components/crmComponent/LostReasonModal"
import { formatCurrency, getDealHealth } from "@/lib/helpers"
import { useCRMResource } from "@/lib/hooks"
import { ListSkeleton } from "@/components/ui/skeletons"
import type { Deal, DealStage, Contact } from "@/lib/types"
import { STAGE_LABELS, DEAL_STAGES } from "@/lib/types"
import { cn } from "@/lib/utils"
import { exportToCSV, debounce } from "@/lib/helpers"
import type { Activity } from "@/lib/types"

const STAGE_STYLE: Record<DealStage, { bg: string; text: string; icon: any }> = {
  discovery: { bg: "bg-slate-50 dark:bg-slate-900/20", text: "text-slate-700 dark:text-slate-300", icon: DollarSign },
  proposal: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: DollarSign },
  negotiation: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", icon: DollarSign },
  won: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  lost: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", icon: AlertCircle },
}

/* ── Sortable Card Component ─────────────────────────────────────── */

function DealHealthBadge({ lastActivityDate }: { lastActivityDate: string | null }) {
  const health = getDealHealth(lastActivityDate)
  const config = {
    green: {
      label: 'Healthy',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    amber: {
      label: 'Needs attention',
      dot: 'bg-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
    },
    red: {
      label: 'At risk',
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
    },
  }[health]

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                      text-[10px] font-black uppercase tracking-widest
                      ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function getLastActivityDate(dealId: string, activities: Activity[]): string | null {
  const sorted = activities
    .filter(a => a.dealId === dealId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return sorted[0]?.createdAt ?? null
}

interface SortableDealCardProps {
  deal: Deal
  contactName: string
  activities: Activity[]
  onClick: () => void
}

function SortableDealCard({ deal, contactName, activities, onClick }: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Generate a mock tag based on ID
  const tags = ["SOFTWARE", "ENTERPRISE", "URGENT", "CONSULTING", "RECURRING"]
  const tag = tags[deal.id.charCodeAt(0) % tags.length]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging && "z-50 shadow-xl ring-2 ring-teal-500 border-transparent rotate-1",
        deal.stage === 'won' && "border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500",
        deal.stage === 'lost' && "border-rose-100 dark:border-rose-900/50 hover:border-rose-500"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
          deal.stage === 'won' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
            deal.stage === 'lost' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20" :
              "bg-slate-100 text-slate-500 dark:bg-slate-800"
        )}>
          {tag}
        </span>
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">{deal.title}</h4>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mb-2">{contactName}</p>
      <div className="mb-4">
        <DealHealthBadge lastActivityDate={getLastActivityDate(deal.id, activities)} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
            {contactName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{contactName.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(deal.value)}</span>
          {deal.stage === 'won' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────── */

export function Deals() {
  const [, navigate] = useLocation()

  const {
    data: deals,
    search,
    setSearch,
    isLoaded,
    addItems,
    updateItem,
    deleteItem
  } = useCRMResource<Deal>('deals')

  const { data: contacts } = useCRMResource<Contact>('contacts')

  const { data: activities } = useCRMResource<Activity>('activities')

  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null)
  const [pendingLostDeal, setPendingLostDeal] = useState<Deal | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const itemsPerPage = 10

  // Debounced search
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setSearch(value), 300),
    [setSearch]
  )

  useEffect(() => {
    debouncedSetSearch(searchInput)
  }, [searchInput, debouncedSetSearch])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const contactMap = useMemo(() => {
    const m = new Map<string, string>()
    contacts.forEach((c) => m.set(c.id, c.name))
    return m
  }, [contacts])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return deals
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (contactMap.get(d.contactId)?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [deals, search, contactMap])

  const totalDeals = filtered.length
  const totalPages = Math.ceil(totalDeals / itemsPerPage)
  const paginatedDeals = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      discovery: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    }
    filtered.forEach((d) => map[d.stage].push(d))
    return map
  }, [filtered])

  const totalsByStage = useMemo(() => {
    const map: Record<string, number> = {}
    DEAL_STAGES.forEach(s => {
      map[s] = (dealsByStage[s as DealStage] || []).reduce((acc, d) => acc + d.value, 0)
    })
    return map
  }, [dealsByStage])

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const dealId = String(active.id)
    const overId = String(over.id)

    let newStage: DealStage | undefined
    if (DEAL_STAGES.includes(overId as DealStage)) {
      newStage = overId as DealStage
    } else {
      const overDeal = deals.find(d => d.id === overId)
      if (overDeal) newStage = overDeal.stage
    }

    if (newStage) {
      const deal = deals.find(d => d.id === dealId)
      if (deal && deal.stage !== newStage) {
        // If moving to lost stage, show lost reason modal
        if (newStage === 'lost') {
          setPendingLostDeal(deal)
        } else {
          updateItem(dealId, { stage: newStage, updatedAt: new Date().toISOString() })
        }
      }
    }
  }, [deals, updateItem])

  if (!isLoaded) {
    return <ListSkeleton />
  }

  function handleAddDeal(deal: Deal) {
    addItems([deal])
    setShowModal(false)
  }

  function handleExportCSV() {
    exportToCSV(
      filtered,
      [
        { key: 'title', header: 'Deal Title' },
        { key: 'contactId', header: 'Contact ID' },
        { key: 'value', header: 'Value' },
        { key: 'stage', header: 'Stage' },
        { key: 'expectedCloseDate', header: 'Expected Close Date' },
        { key: 'createdAt', header: 'Created Date' },
      ],
      'deals'
    )
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 pt-2 mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">SALES OPERATIONS</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pipeline</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Track and manage active sales opportunities.</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800 flex items-center mr-2 shadow-sm">
              <Button
                variant={viewMode === "board" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("board")}
                className={cn("h-8 px-4 font-bold rounded-sm", viewMode === "board" && "bg-teal-600 text-white shadow-md hover:bg-teal-700")}
              >
                Board
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn("h-8 px-4 font-bold rounded-sm", viewMode === "list" && "bg-teal-600 text-white shadow-md hover:bg-teal-700")}
              >
                List
              </Button>
            </div>

            <Button variant="outline" onClick={handleExportCSV} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <DollarSign className="w-4 h-4" />
              Export CSV
            </Button>

            <Button
              variant="brand"
              onClick={() => setShowModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> Create Deal
            </Button>
          </div>
        </div>

        {/* Unified Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-2">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <button className="pb-4 font-bold text-sm tracking-wide text-teal-600 relative flex items-center gap-2 cursor-pointer">
              Active Deals
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
            </button>
            <button className="pb-4 font-bold text-sm tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer opacity-50">
              Won / Lost
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
              <input
                placeholder="Search deals, contacts or companies..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <DataTable
            data={paginatedDeals}
            onRowClick={(d: Deal) => navigate(`/deals/${d.id}`)}
            className="animate-in fade-in duration-300"
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
              totalItems: totalDeals,
              itemsPerPage,
              itemLabel: "deals"
            }}
            emptyState={{
              icon: <BarChart3 className="w-10 h-10" />,
              title: "No deals found."
            }}
            columns={[
              {
                header: "Deal Title",
                render: (d: Deal) => (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                  </div>
                )
              },
              {
                header: "Contact",
                render: (d: Deal) => (
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                    {(contactMap as any).get(d.contactId) || "Unknown"}
                  </p>
                )
              },
              {
                header: "Health",
                render: (d: Deal) => (
                  <DealHealthBadge lastActivityDate={getLastActivityDate(d.id, activities)} />
                )
              },
              {
                header: "Value",
                render: (d: Deal) => (
                  <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(d.value)}</p>
                )
              },
              {
                header: "Stage",
                render: (d: Deal) => {
                  const style = STAGE_STYLE[d.stage] || STAGE_STYLE.discovery
                  return (
                    <div className={cn(
                      "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border border-transparent shadow-sm",
                      style.bg,
                      style.text
                    )}>
                      {STAGE_LABELS[d.stage]}
                    </div>
                  )
                }
              },
              {
                header: "Expected Close",
                render: (d: Deal) => (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <p className="text-[11px] font-bold tracking-tight">
                      {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                )
              },
              {
                header: "Actions",
                headerClassName: "text-right",
                align: "right",
                render: (d: Deal) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingDelete(d)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )
              }
            ]}
          />
        ) : (
          /* ── Board View ──────────────────────────────────────────── */
          <div className="animate-in fade-in duration-300">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {DEAL_STAGES.map((stage) => (
                  <div className="flex flex-col gap-4">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                          {STAGE_LABELS[stage]}
                        </h3>
                        <span className="flex-shrink-0 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-md">
                          {(dealsByStage[stage] || []).length}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {formatCurrency(totalsByStage[stage])}
                      </span>
                    </div>

                    {/* Droppable Area */}
                    <SortableContext
                      id={stage}
                      items={(dealsByStage[stage] || []).map(d => d.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className={cn(
                        "flex-1 flex flex-col gap-3 min-h-[500px] p-2 rounded-md border-2 border-dashed transition-colors",
                        "border-slate-200 dark:border-slate-800/50 hover:border-teal-200 dark:hover:border-teal-900/50"
                      )}>
                        {(dealsByStage[stage] || []).map((deal) => (
                          <SortableDealCard
                            key={deal.id}
                            deal={deal}
                            contactName={contactMap.get(deal.contactId) || "Unknown"}
                            activities={activities}
                            onClick={() => navigate(`/deals/${deal.id}`)}
                          />
                        ))}

                        <Button
                          variant="ghost"
                          onClick={() => setShowModal(true)}
                          className="w-full h-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 group"
                        >
                          <PlusCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Add Card
                        </Button>
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>

              <DragOverlay>
                {activeDeal ? (
                  <div className="w-[300px] pointer-events-none">
                    <SortableDealCard
                      deal={activeDeal}
                      contactName={contactMap.get(activeDeal.contactId) || "Unknown"}
                      activities={activities}
                      onClick={() => { }}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
          <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
            <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Add New Deal</SheetTitle>
            <SheetDescription className="text-sm font-medium text-slate-500">
              Enter the details to track a new sales opportunity in your pipeline.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <DealForm onSave={handleAddDeal} onCancel={() => setShowModal(false)} contacts={contacts} />
          </div>
        </SheetContent>
      </Sheet>

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Deal"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{pendingDelete?.title}</strong>?
            {" "}This action cannot be undone.
          </>
        }
        onDelete={() => {
          if (pendingDelete) deleteItem(pendingDelete.id)
          setPendingDelete(null)
        }}
        cancelText="Cancel"
        deleteText="Delete Deal"
      />

      <LostReasonModal
        open={!!pendingLostDeal}
        onOpenChange={(open) => { if (!open) setPendingLostDeal(null) }}
        onConfirm={(reason) => {
          if (pendingLostDeal) {
            updateItem(pendingLostDeal.id, {
              stage: 'lost',
              lostReason: reason,
              updatedAt: new Date().toISOString()
            })
          }
          setPendingLostDeal(null)
        }}
        dealTitle={pendingLostDeal?.title ?? ''}
      />
    </div>
  )
}
