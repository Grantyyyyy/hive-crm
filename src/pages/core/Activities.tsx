import { useState, useMemo } from "react"
import { ListSkeleton } from "@/components/ui/skeletons"
import { Link } from "wouter"
import {
  Activity as ActivityIcon,
  Download,
  PlusCircle,
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
import { useUser } from "@/lib/AuthContext"
import { ActivityForm } from "@/components/crmComponent/ActivityForm"
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
  email: { label: "Emails", icon: Mail, color: "text-teal-500", bg: "bg-teal-50", iconBorder: "border-teal-100" },
  meeting: { label: "Meetings", icon: Video, color: "text-emerald-500", bg: "bg-emerald-50", iconBorder: "border-emerald-100" },
  note: { label: "Notes", icon: FileText, color: "text-amber-500", bg: "bg-amber-50", iconBorder: "border-amber-100" },
}

export function Activities() {
  const { user, isLoaded: userLoaded } = useUser()
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

  if (!userLoaded || !activitiesLoaded || !contactsLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Audit Trail</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Activity Feed</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track all interactions with your leads and customers in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button variant="brand" onClick={() => setShowLogModal(true)}>
              <PlusCircle className="w-4 h-4" /> Log Activity
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
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 px-3 w-full md:w-auto">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">Activity Type</span>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide py-1">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  filter === "all" ? "bg-teal-600 text-white shadow-sm shadow-teal-200" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                All
              </button>
              {(['call', 'email', 'meeting', 'note'] as ActivityType[]).map(t => {
                const Icon = TYPE_META[t].icon
                return (
                  <Button
                    key={t}
                    variant={filter === t ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(t)}
                    className="h-8 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {TYPE_META[t].label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 px-3 w-full md:w-auto mt-2 md:mt-0 pb-2 md:pb-0">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Team Member</span>
              <Button variant="outlineNeutral" className="h-9 w-36 px-3 justify-between">
                All Team <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Date Range</span>
              <Button variant="outlineNeutral" className="h-9 w-36 px-3 justify-between">
                Last 7 Days <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="py-6 relative">
          {groupedActivities.length === 0 ? (
            <div className="py-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center shadow-sm">
              <ActivityIcon className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-1">No activities found</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Either you have no interactions logged yet, or no activities match your current filters.</p>
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto pl-4 md:pl-0">
              <div className="hidden md:block absolute left-1/2 top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800 transform -translate-x-1/2" />
              <div className="md:hidden absolute left-[15px] top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-8">
                {groupedActivities.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    <div className="flex justify-start md:justify-center mb-6 relative">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded shadow-sm z-10 border border-slate-200 dark:border-slate-700">
                        {group.dateLabel}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {group.items.map((activity, index) => {
                        const Icon = TYPE_META[activity.type].icon
                        const isEven = index % 2 === 0
                        const timeString = new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                        return (
                          <div key={activity.id} className="relative flex md:justify-between items-center w-full group">

                            <div className="absolute left-[-15px] md:left-1/2 md:transform md:-translate-x-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 z-10 flex items-center justify-center">
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", TYPE_META[activity.type].bg, TYPE_META[activity.type].bg.replace('bg-', 'dark:bg-').concat('/20'), TYPE_META[activity.type].iconBorder, TYPE_META[activity.type].iconBorder.replace('border-', 'dark:border-'))}>
                                <Icon className={cn("w-3 h-3", TYPE_META[activity.type].color)} />
                              </div>
                            </div>

                            <div className={cn(
                              "w-full ml-8 md:ml-0 md:w-[calc(50%-2rem)]",
                              !isEven && "md:ml-auto"
                            )}>
                              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group-hover:border-teal-200 dark:group-hover:border-teal-800/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{timeString}</span>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{TYPE_META[activity.type].label.slice(0, -1)}</span>
                                </div>

                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 truncate">
                                  {activity.content.split('\n')[0].length < 40 ? activity.content.split('\n')[0] : `${TYPE_META[activity.type].label.slice(0, -1)} with Contact`}
                                </h4>

                                <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                                  {activity.content}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center ring-1 ring-white dark:ring-slate-950 overflow-hidden shrink-0 shadow-sm">
                                      {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata?.avatar_url} className="w-full h-full object-cover" alt="User" />
                                      ) : (
                                        <span className="text-[8px] font-black text-teal-700">ME</span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{user?.user_metadata?.first_name || "Me"}</span>
                                    <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
                                    {activity.contactId ? (
                                      <Link href={`/contacts/${activity.contactId}`}>
                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 truncate max-w-[100px] cursor-pointer">
                                          {contactMap.get(activity.contactId) || "Contact"}
                                        </span>
                                      </Link>
                                    ) : (
                                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                        {"Contact"}
                                      </span>
                                    )}
                                  </div>

                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[9px] uppercase font-black tracking-widest hidden sm:inline-block">
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
        <SheetContent className="sm:max-w-3xl p-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col h-full">
          <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
            <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Log Activity
            </SheetTitle>
            <p className="text-sm font-medium text-slate-500">
              Record a new interaction with a contact or deal.
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ActivityForm
              contacts={contacts}
              onSave={handleLogActivity}
              onCancel={() => setShowLogModal(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}