import { useState, useEffect, useRef } from "react"
import { Play, Square, Plus, Trash2, Clock, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { generateId } from "@/lib/helpers"
import { toast } from "sonner"
import type { TaskTimeEntry, Task } from "@/lib/types"

interface TimeTrackerProps {
  taskId: string
  taskTitle: string
  initialEntries?: TaskTimeEntry[]
  initialTrackedSeconds?: number
  onEntriesChange?: (entries: TaskTimeEntry[], totalSeconds: number) => void
}

interface ManualEntryForm {
  hours: string
  minutes: string
  description: string
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupEntriesByDate(entries: TaskTimeEntry[]): Record<string, TaskTimeEntry[]> {
  return entries.reduce((groups, entry) => {
    const dateKey = formatDate(entry.startTime)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(entry)
    return groups
  }, {} as Record<string, TaskTimeEntry[]>)
}

export function TimeTracker({
  taskId,
  taskTitle,
  initialEntries = [],
  initialTrackedSeconds = 0,
  onEntriesChange
}: TimeTrackerProps) {
  const { user } = useUser()
  const { addItems } = useCRMResource<TaskTimeEntry>('task_time_entries')
  const { updateItem: updateTask } = useCRMResource<Task>('tasks')

  const [entries, setEntries] = useState<TaskTimeEntry[]>(initialEntries)
  const [trackedSeconds, setTrackedSeconds] = useState(initialTrackedSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualEntry, setManualEntry] = useState<ManualEntryForm>({
    hours: "",
    minutes: "",
    description: ""
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Update local state when props change
  useEffect(() => {
    setEntries(initialEntries)
    setTrackedSeconds(initialTrackedSeconds)
  }, [initialEntries, initialTrackedSeconds])

  // Timer tick effect
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        if (startTimeRef.current) {
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
          setElapsedSeconds(elapsed)
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, startTime])

  const handleStart = () => {
    const now = new Date()
    setStartTime(now)
    startTimeRef.current = now.getTime()
    setIsRunning(true)
    setElapsedSeconds(0)
  }

  const handleStop = async () => {
    if (!startTime || !user) return

    const endTime = new Date()
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    if (durationSeconds < 1) {
      toast.error("Session too short", { description: "Please track at least 1 second" })
      setIsRunning(false)
      setStartTime(null)
      startTimeRef.current = null
      return
    }

    const newEntry: Omit<TaskTimeEntry, 'id' | 'createdAt'> = {
      taskId,
      userId: user.id,
      userName: user.fullName || user.username || "Unknown",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds
    }

    const promise = (async () => {
      const created = await addItems([{ ...newEntry, id: generateId(), createdAt: new Date().toISOString() } as TaskTimeEntry])
      const updatedEntries = [...entries, created[0]]
      const newTotal = trackedSeconds + durationSeconds

      setEntries(updatedEntries)
      setTrackedSeconds(newTotal)
      onEntriesChange?.(updatedEntries, newTotal)

      await updateTask(taskId, { trackedSeconds: newTotal })
    })()

    toast.promise(promise, {
      loading: "Saving time entry...",
      success: `Logged ${formatDuration(durationSeconds)}`,
      error: "Failed to save time entry"
    })

    setIsRunning(false)
    setStartTime(null)
    startTimeRef.current = null
    setElapsedSeconds(0)
  }

  const handleAddManual = async () => {
    if (!user) return

    const hours = parseInt(manualEntry.hours) || 0
    const minutes = parseInt(manualEntry.minutes) || 0
    const durationSeconds = (hours * 3600) + (minutes * 60)

    if (durationSeconds < 1) {
      toast.error("Invalid duration", { description: "Please enter at least 1 minute" })
      return
    }

    const now = new Date()
    const newEntry: TaskTimeEntry = {
      id: generateId(),
      taskId,
      userId: user.id,
      userName: user.fullName || user.username || "Unknown",
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      durationSeconds,
      description: manualEntry.description.trim() || undefined
    }

    const promise = (async () => {
      await addItems([newEntry])
      const updatedEntries = [...entries, newEntry]
      const newTotal = trackedSeconds + durationSeconds

      setEntries(updatedEntries)
      setTrackedSeconds(newTotal)
      onEntriesChange?.(updatedEntries, newTotal)

      await updateTask(taskId, { trackedSeconds: newTotal })
    })()

    toast.promise(promise, {
      loading: "Adding manual entry...",
      success: `Added ${formatDuration(durationSeconds)}`,
      error: "Failed to add manual entry"
    })

    setManualEntry({ hours: "", minutes: "", description: "" })
    setShowManualForm(false)
  }

  const handleDeleteEntry = async (entryId: string, entryDuration: number) => {
    const promise = (async () => {
      const updatedEntries = entries.filter(e => e.id !== entryId)
      const newTotal = Math.max(0, trackedSeconds - entryDuration)

      setEntries(updatedEntries)
      setTrackedSeconds(newTotal)
      onEntriesChange?.(updatedEntries, newTotal)

      await updateTask(taskId, { trackedSeconds: newTotal })
    })()

    toast.promise(promise, {
      loading: "Deleting entry...",
      success: "Entry deleted",
      error: "Failed to delete entry"
    })
  }

  const groupedEntries = groupEntriesByDate(entries)
  const currentTotal = trackedSeconds + (isRunning ? elapsedSeconds : 0)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Time Tracking</h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{taskTitle}</p>
            </div>
          </div>

          {/* Total Display */}
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatDuration(currentTotal)}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Tracked</div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <Button
              onClick={handleStop}
              className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Timer — {formatDuration(elapsedSeconds)}
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowManualForm(!showManualForm)}
            className="h-12 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Manual Entry Form */}
        {showManualForm && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <Label htmlFor="hours" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  value={manualEntry.hours}
                  onChange={(e) => setManualEntry({ ...manualEntry, hours: e.target.value })}
                  placeholder="0"
                  className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="minutes" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={manualEntry.minutes}
                  onChange={(e) => setManualEntry({ ...manualEntry, minutes: e.target.value })}
                  placeholder="0"
                  className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                />
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description (optional)</Label>
              <Textarea
                id="description"
                value={manualEntry.description}
                onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                placeholder="What did you work on?"
                rows={2}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddManual}
                className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider"
              >
                Add Entry
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowManualForm(false)
                  setManualEntry({ hours: "", minutes: "", description: "" })
                }}
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No time entries yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start the timer or add time manually</p>
          </div>
        ) : (
          Object.entries(groupedEntries).map(([dateLabel, dateEntries]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 sticky top-0 bg-white dark:bg-slate-900 py-2">
                <Calendar className="w-3 h-3" />
                {dateLabel}
              </div>

              {dateEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {entry.userName}
                        </span>
                        {entry.description ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {formatTime(entry.startTime)} — {entry.endTime ? formatTime(entry.endTime) : 'Now'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Manual Entry
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {formatDuration(entry.durationSeconds)}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id, entry.durationSeconds)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {entry.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
