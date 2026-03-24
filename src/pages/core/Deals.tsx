import { useState, useMemo, useCallback } from "react"
import { Pagination } from "@/components/ui/Pagination"
import { useLocation } from "wouter"
import { 
  BarChart3, 
  Search, 
  Plus, 
  Download, 
  Trash2,
  DollarSign,
  Calendar,
  LayoutGrid,
  List,
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
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DealForm } from "@/components/crm/DealForm"
import { formatCurrency } from "@/lib/helpers"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import type { Deal, DealStage, Contact } from "@/lib/types"
import { STAGE_LABELS, DEAL_STAGES } from "@/lib/types"
import { cn } from "@/lib/utils"

const STAGE_STYLE: Record<DealStage, { bg: string; text: string; icon: any }> = {
  discovery:   { bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400",   icon: DollarSign },
  proposal:    { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400",  icon: DollarSign },
  negotiation: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", icon: DollarSign },
  won:         { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  lost:        { bg: "bg-rose-50 dark:bg-rose-900/20",    text: "text-rose-700 dark:text-rose-400",    icon: AlertCircle },
}

/* ── Sortable Card Component ─────────────────────────────────────── */

interface SortableDealCardProps {
  deal: Deal
  contactName: string
  onClick: () => void
}

function SortableDealCard({ deal, contactName, onClick }: SortableDealCardProps) {
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
        isDragging && "z-50 shadow-xl ring-2 ring-indigo-500 border-transparent rotate-1",
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
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mb-4">{contactName}</p>

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

  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
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
        updateItem(dealId, { stage: newStage, updatedAt: new Date().toISOString() })
      }
    }
  }, [deals, updateItem])

  if (!isLoaded) {
    return <PageSkeleton />
  }

  function handleAddDeal(deal: Deal) {
    addItems([deal])
    setShowModal(false)
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Sales Operations</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Deals Pipeline</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Manage and track your active sales leads through the pipeline.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center mr-2">
              <Button 
                variant={viewMode === "board" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("board")}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                Board
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="w-3.5 h-3.5 mr-2" />
                List
              </Button>
            </div>

            <Button variant="outlineNeutral">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="default"
              onClick={() => setShowModal(true)}
              className="ml-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Deal
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search deals by title, people, or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {viewMode === "list" ? (
          /* ── List View ───────────────────────────────────────────── */
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Deal Title</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Contact</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Value</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Stage</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Expected Close</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <BarChart3 className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-500 font-medium">No deals found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedDeals.map((d) => {
                      const style = STAGE_STYLE[d.stage] || STAGE_STYLE.discovery
                      return (
                        <tr 
                          key={d.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/deals/${d.id}`)}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <DollarSign className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                              {contactMap.get(d.contactId) || "Unknown"}
                            </p>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(d.value)}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className={cn(
                              "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border border-transparent shadow-sm",
                              style.bg,
                              style.text
                            )}>
                              {STAGE_LABELS[d.stage]}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <p className="text-[11px] font-bold tracking-tight">
                                {new Date(d.expectedCloseDate).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPendingDelete(d)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalDeals}
              itemsPerPage={itemsPerPage}
              itemLabel="deals"
            />
          </div>
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
                  <div key={stage} className="flex flex-col gap-4">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                          {STAGE_LABELS[stage]}
                        </h3>
                        <span className="flex-shrink-0 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg">
                          {(dealsByStage[stage] || []).length}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
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
                        "flex-1 flex flex-col gap-3 min-h-[500px] p-2 rounded-[2rem] border-2 border-dashed transition-colors",
                        "border-slate-200 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-900/50"
                      )}>
                        {(dealsByStage[stage] || []).map((deal) => (
                          <SortableDealCard 
                            key={deal.id} 
                            deal={deal} 
                            contactName={contactMap.get(deal.contactId) || "Unknown"}
                            onClick={() => navigate(`/deals/${deal.id}`)}
                          />
                        ))}
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowModal(true)}
                          className="w-full h-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 group"
                        >
                          <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
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
                      onClick={() => {}} 
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetHeader>
          <SheetTitle>Add New Deal</SheetTitle>
          <SheetDescription>
            Enter the details to track a new sales opportunity in your pipeline.
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <DealForm onSave={handleAddDeal} onCancel={() => setShowModal(false)} contacts={contacts} />
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
    </div>
  )
}
