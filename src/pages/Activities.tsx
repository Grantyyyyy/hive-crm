import { useState, useMemo } from "react"
import { Link } from "wouter"
import { 
  Activity as ActivityIcon,
  Download,
  Plus,
  Phone,
  Mail,
  Video,
  FileText,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Activity, ActivityType, Contact } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { ActivityForm } from "@/components/crm/ActivityForm"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const TYPE_META: Record<
  ActivityType,
  { label: string; icon: any; color: string; bg: string; iconBorder: string }
> = {
  call: { label: "Calls", icon: Phone, color: "text-blue-500", bg: "bg-blue-50", iconBorder: "border-blue-100" },
  email: { label: "Emails", icon: Mail, color: "text-indigo-500", bg: "bg-indigo-50", iconBorder: "border-indigo-100" },
  meeting: { label: "Meetings", icon: Video, color: "text-emerald-500", bg: "bg-emerald-50", iconBorder: "border-emerald-100" },
  note: { label: "Notes", icon: FileText, color: "text-amber-500", bg: "bg-amber-50", iconBorder: "border-amber-100" },
}

export function Activities() {
  const { user } = useUser()
  const { 
    data: activities, 
    addItems: addActivities,
    isLoaded: activitiesLoaded 
  } = useCRMResource<Activity>('activities')

  const { 
    data: contacts, 
    isLoaded: contactsLoaded 
  } = useCRMResource<Contact>('contacts')

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ActivityType | "all">("all")
  const [showLogModal, setShowLogModal] = useState(false)

  const contactMap = useMemo(() => {
    const m = new Map<string, string>()
    contacts.forEach((c) => m.set(c.id, c.name))
    return m
  }, [contacts])

  // Group by date
  const groupedActivities = useMemo(() => {
    const q = search.toLowerCase()
    const list = activities.filter(a => {
      const matchesFilter = filter === "all" || a.type === filter
      const matchesSearch = !q || a.content.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
    const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    
    const groups: { dateLabel: string, items: Activity[] }[] = []
    
    sorted.forEach(a => {
      const d = new Date(a.createdAt)
      const isToday = new Date().toDateString() === d.toDateString()
      // Format like "TODAY, OCT 24" or "OCT 23"
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
      const dateLabel = isToday ? `TODAY, ${datePart}` : datePart

      let lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.dateLabel === dateLabel) {
        lastGroup.items.push(a)
      } else {
        groups.push({ dateLabel, items: [a] })
      }
    })

    return groups
  }, [activities, filter, search])

  const handleLogActivity = (activity: Activity) => {
    addActivities([activity])
    setShowLogModal(false)
  }

  if (!activitiesLoaded || !contactsLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">
        
        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Audit Trail</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Activity Feed</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track all interactions with your leads and customers in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={() => setShowLogModal(true)} className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
              <Plus className="w-4 h-4 mr-2" /> Log Activity
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <ActivityIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search activity content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 px-3 w-full md:w-auto">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">Activity Type</span>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide py-1">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  filter === "all" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                All
              </button>
              {(['call', 'email', 'meeting', 'note'] as ActivityType[]).map(t => {
                const Icon = TYPE_META[t].icon
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap",
                      filter === t ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {TYPE_META[t].label}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 px-3 w-full md:w-auto mt-2 md:mt-0 pb-2 md:pb-0">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Team Member</span>
              <button className="flex items-center justify-between w-36 h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                All Team <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Date Range</span>
              <button className="flex items-center justify-between w-36 h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                Last 7 Days <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="py-8 relative">
          {groupedActivities.length === 0 ? (
            <div className="py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm">
              <ActivityIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No activities found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Either you have no interactions logged yet, or no activities match your current filters.</p>
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto pl-4 md:pl-0">
              {/* Central vertical dashed/solid line, hidden on mobile */}
              <div className="hidden md:block absolute left-1/2 top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800 transform -translate-x-1/2" />
              {/* Mobile vertical line */}
              <div className="md:hidden absolute left-[15px] top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-12">
                {groupedActivities.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    {/* Date Badge */}
                    <div className="flex justify-start md:justify-center mb-8 relative">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full z-10 border border-slate-200 dark:border-slate-700">
                        {group.dateLabel}
                      </span>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-8">
                      {group.items.map((activity, index) => {
                        const Icon = TYPE_META[activity.type].icon
                        const isEven = index % 2 === 0
                        const timeString = new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        
                        return (
                          <div key={activity.id} className="relative flex md:justify-between items-center w-full">
                            
                            {/* Icon Circle (Center on Desktop, Left on Mobile) */}
                            <div className="absolute left-[-15px] md:left-1/2 md:transform md:-translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 z-10 flex items-center justify-center">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border", TYPE_META[activity.type].bg, TYPE_META[activity.type].bg.replace('bg-', 'dark:bg-').concat('/20'), TYPE_META[activity.type].iconBorder, TYPE_META[activity.type].iconBorder.replace('border-', 'dark:border-'))}>
                                <Icon className={cn("w-3.5 h-3.5", TYPE_META[activity.type].color)} />
                              </div>
                            </div>

                            {/* Card Content container - changes side on desktop */}
                            <div className={cn(
                              "w-full ml-10 md:ml-0 md:w-[calc(50%-2rem)]", 
                              !isEven && "md:ml-auto" 
                            )}>
                              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                
                                {/* Card Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{timeString}</span>
                                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{TYPE_META[activity.type].label.slice(0,-1)}</span>
                                </div>

                                {/* Title - generated from content or a default title based on type */}
                                <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-2 truncate">
                                  {activity.content.split('\n')[0].length < 40 ? activity.content.split('\n')[0] : `${TYPE_META[activity.type].label.slice(0,-1)} with Contact`}
                                </h4>
                                
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                                  {activity.content}
                                </p>

                                {/* Card Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center border border-orange-200 dark:border-orange-800 overflow-hidden shrink-0">
                                      {user?.imageUrl ? (
                                        <img src={user.imageUrl} className="w-full h-full object-cover" alt="User" />
                                      ) : (
                                        <span className="text-[9px] font-bold text-orange-700">ME</span>
                                      )}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{user?.firstName || "Me"}</span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <Link href={`/contacts/${activity.contactId}`}>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[100px] cursor-pointer">
                                        {contactMap.get(activity.contactId) || "Contact"}
                                      </span>
                                    </Link>
                                  </div>
                                  
                                  <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase font-bold tracking-widest hidden sm:inline-block">
                                    COMPLETED
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Sheet open={showLogModal} onOpenChange={setShowLogModal}>
        <SheetContent className="sm:max-w-xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full">
          <SheetHeader className="px-8 py-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <SheetTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Log Activity
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ActivityForm
              contacts={contacts}
              onSave={handleLogActivity}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

