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
  ChevronDown,
  Search
} from "lucide-react"
import { PageHeader } from "@/components/reusables/PageHeader"
import { Button } from "@/components/ui/button"
import { InitialsAvatar } from "@/components/reusables/InitialsAvatar"
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">

        <PageHeader 
          category="Audit Trail"
          title="Activity Feed"
          description="Track all interactions with your leads and customers in real-time."
          className="px-0 bg-transparent border-none pb-2"
          actions={
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="outlineNeutral" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Download className="w-4 h-4" /> Export Feed
              </Button>
              <Button variant="brand" onClick={() => setShowLogModal(true)}>
                <PlusCircle className="w-4 h-4" /> Log Activity
              </Button>
            </div>
          }
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search activity content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/10 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1 lg:flex-none">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === "all" 
                    ? "bg-accent text-white shadow-lg shadow-accent/20 active:scale-95" 
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                All Feed
              </button>
              {(['call', 'email', 'meeting', 'note'] as ActivityType[]).map(t => {
                const Icon = TYPE_META[t].icon
                const isActive = filter === t
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      isActive 
                        ? "bg-accent text-white shadow-lg shadow-accent/20 active:scale-95" 
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {TYPE_META[t].label}
                  </button>
                )
              })}
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button variant="outlineNeutral" className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex-1 lg:flex-none justify-between gap-3 min-w-[140px]">
                Team Member <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
              <Button variant="outlineNeutral" className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex-1 lg:flex-none justify-between gap-3 min-w-[140px]">
                Date Range <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="py-6 relative">
          {groupedActivities.length === 0 ? (
            <div className="py-20 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ActivityIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No activities found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Either you have no interactions logged yet, or no activities match your current filters.</p>
            </div>
          ) : (
            <div className="relative max-w-5xl mx-auto pl-4 md:pl-0">
              <div className="hidden md:block absolute left-1/2 top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800 transform -translate-x-1/2" />
              <div className="md:hidden absolute left-[15px] top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-12">
                {groupedActivities.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    <div className="flex justify-start md:justify-center mb-8 relative">
                      <span className="inline-block bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm z-10 border border-slate-200 dark:border-slate-800">
                        {group.dateLabel}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {group.items.map((activity, index) => {
                        const Icon = TYPE_META[activity.type].icon
                        const isEven = index % 2 === 0
                        const timeString = new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                        return (
                          <div key={activity.id} className="relative flex md:justify-between items-center w-full group">

                            <div className="absolute left-[-15px] md:left-1/2 md:transform md:-translate-x-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 z-10 flex items-center justify-center">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", TYPE_META[activity.type].bg, "dark:bg-opacity-20", TYPE_META[activity.type].iconBorder, "dark:border-opacity-30")}>
                                <Icon className={cn("w-3.5 h-3.5", TYPE_META[activity.type].color)} />
                              </div>
                            </div>

                            <div className={cn(
                              "w-full ml-10 md:ml-0 md:w-[calc(50%-2.5rem)]",
                              !isEven && "md:ml-auto"
                            )}>
                              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all group-hover:border-accent/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                  <span className="text-[11px] font-black text-accent bg-accent-dim px-2 py-0.5 rounded-lg tracking-tight">{timeString}</span>
                                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{TYPE_META[activity.type].label.slice(0, -1)}</span>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate relative z-10">
                                  {activity.content.split('\n')[0].length < 40 ? activity.content.split('\n')[0] : `${TYPE_META[activity.type].label.slice(0, -1)} with Contact`}
                                </h4>

                                <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3 relative z-10">
                                  {activity.content}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 overflow-hidden shrink-0 shadow-sm">
                                      {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata?.avatar_url} className="w-full h-full object-cover" alt="User" />
                                      ) : (
                                        <InitialsAvatar
                                          name={user?.user_metadata?.first_name || "Me"}
                                          className="w-full h-full rounded-full"
                                          textClassName="text-[10px] font-black"
                                        />
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{user?.user_metadata?.first_name || "Me"}</span>
                                      {activity.contactId && (
                                        <Link href={`/contacts/${activity.contactId}`}>
                                          <span className="text-[10px] font-medium text-slate-400 hover:text-accent truncate cursor-pointer transition-colors">
                                            with {contactMap.get(activity.contactId) || "Contact"}
                                          </span>
                                        </Link>
                                      )}
                                    </div>
                                  </div>

                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[9px] uppercase font-black tracking-widest hidden sm:inline-block">
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
