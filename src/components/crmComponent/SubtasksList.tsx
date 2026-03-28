import { useState } from "react"
import { Plus, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { TaskSubtask } from "@/lib/types"

interface SubtasksListProps {
  taskId: string
  subtasks: TaskSubtask[]
  onAdd: (title: string) => void
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export function SubtasksList({ subtasks, onAdd, onToggle, onDelete }: Omit<SubtasksListProps, 'taskId'>) {
  const [newTitle, setNewTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = () => {
    if (!newTitle.trim()) return
    onAdd(newTitle.trim())
    setNewTitle("")
    setIsAdding(false)
  }

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-text-primary">Subtasks</h4>
        {totalCount > 0 && (
          <span className="text-xs font-medium text-text-muted">
            {completedCount}/{totalCount} ({progress}%)
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtask List */}
      <div className="space-y-2">
        {subtasks.map(subtask => (
          <div
            key={subtask.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              subtask.completed
                ? "bg-bg-elevated/50 border-border opacity-75"
                : "bg-bg-surface border-border hover:border-accent/30"
            )}
          >
            <button
              onClick={() => onToggle(subtask.id, !subtask.completed)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0",
                subtask.completed
                  ? "bg-green border-green text-white"
                  : "border-border bg-bg-surface hover:border-accent"
              )}
            >
              {subtask.completed && <Check className="w-3.5 h-3.5" />}
            </button>
            <span className={cn(
              "text-sm flex-1",
              subtask.completed ? "text-text-muted line-through" : "text-text-primary"
            )}>
              {subtask.title}
            </span>
            <button
              onClick={() => onDelete(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="Enter subtask title..."
            className="h-9 flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} className="h-9">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-9">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full justify-start text-text-muted hover:text-text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add subtask
        </Button>
      )}
    </div>
  )
}
