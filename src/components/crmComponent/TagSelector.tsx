import { useState, useRef, useEffect } from "react"
import { X, Plus, Check, Tag, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@/lib/AuthContext"
import { generateId } from "@/lib/helpers"
import { toast } from "sonner"
import type { TaskTag, TaskTagLink } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TagSelectorProps {
  taskId: string
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

// Check if string is a valid UUID format
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

const PRESET_COLORS = [
  "#6366f1", // teal
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#db2777", // pink
  "#475569", // slate
]

function getBgColor(color: string): string {
  return `${color}26` // ~15% opacity
}

export function TagSelector({ taskId, selectedTagIds, onChange }: TagSelectorProps) {
  const { user } = useUser()
  const { data: allTags, addItems: addTag } = useCRMResource<TaskTag>('task_tags')
  const { addItems: addLink, deleteItem: deleteLinkItem } = useCRMResource<TaskTagLink>('task_tag_links')

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#6366f1")
  const [isCreating, setIsCreating] = useState(false)
  const [linkMap, setLinkMap] = useState<Record<string, string>>({})

  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Populate linkMap from existing task_tag_links
  const { data: allLinks } = useCRMResource<TaskTagLink>('task_tag_links')
  useEffect(() => {
    if (taskId && allLinks) {
      const initialLinks: Record<string, string> = {}
      allLinks.filter(l => l.taskId === taskId).forEach(l => {
        initialLinks[`${taskId}-${l.tagId}`] = l.id
      })
      setLinkMap(initialLinks)

      // Also sync selectedTagIds if they aren't already (initial bootstrap)
      const tagIdsFromLinks = allLinks.filter(l => l.taskId === taskId).map(l => l.tagId)
      if (tagIdsFromLinks.length > 0 && selectedTagIds.length === 0) {
        onChange(tagIdsFromLinks)
      }
    }
  }, [taskId, allLinks])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const selectedTagIdSet = new Set(selectedTagIds)

  // Get full tag objects from IDs
  const selectedTags = allTags?.filter(t => selectedTagIds.includes(t.id)) || []

  const handleToggleTag = async (tag: TaskTag) => {
    // If taskId is empty or not a valid UUID (new task), only update local state
    if (!taskId || !isValidUUID(taskId)) {
      if (selectedTagIdSet.has(tag.id)) {
        onChange(selectedTagIds.filter(id => id !== tag.id))
      } else {
        onChange([...selectedTagIds, tag.id])
      }
      return
    }

    if (selectedTagIdSet.has(tag.id)) {
      // Remove tag
      const linkId = linkMap[`${taskId}-${tag.id}`]
      if (linkId) {
        try {
          await deleteLinkItem(linkId, true)
          const newLinkMap = { ...linkMap }
          delete newLinkMap[`${taskId}-${tag.id}`]
          setLinkMap(newLinkMap)
          onChange(selectedTagIds.filter(id => id !== tag.id))
        } catch (e: unknown) {
          toast.error("Failed to remove tag", { description: (e as Error).message })
        }
      } else {
        // Fallback: just update local state
        onChange(selectedTagIds.filter(id => id !== tag.id))
      }
    } else {
      // Add tag
      try {
        const newLink: TaskTagLink = {
          id: generateId(),
          taskId,
          tagId: tag.id,
          createdAt: new Date().toISOString()
        }
        const created = await addLink([newLink], true)
        if (created && created[0]) {
          setLinkMap(prev => ({ ...prev, [`${taskId}-${tag.id}`]: created[0].id }))
        }
        onChange([...selectedTagIds, tag.id])
      } catch (e: unknown) {
        toast.error("Failed to add tag", { description: (e as Error).message })
      }
    }
  }

  const handleRemoveTag = async (tag: TaskTag) => {
    if (!taskId || !isValidUUID(taskId)) {
      onChange(selectedTagIds.filter(id => id !== tag.id))
      return
    }

    const linkId = linkMap[`${taskId}-${tag.id}`]
    if (linkId) {
      try {
        await deleteLinkItem(linkId, true)
        const newLinkMap = { ...linkMap }
        delete newLinkMap[`${taskId}-${tag.id}`]
        setLinkMap(newLinkMap)
        onChange(selectedTagIds.filter(id => id !== tag.id))
      } catch (e: unknown) {
        toast.error("Failed to remove tag", { description: (e as Error).message })
      }
    } else {
      // Fallback: just update local state
      onChange(selectedTagIds.filter(id => id !== tag.id))
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user) return

    setIsCreating(true)

    try {
      const newTag: TaskTag = {
        id: generateId(),
        name: newTagName.trim(),
        color: selectedColor,
        ownerId: user.id
      }

      // Create the tag
      const created = await addTag([newTag])
      const createdTag = created[0]

      // If we have a valid taskId, immediately link it
      if (taskId && isValidUUID(taskId)) {
        const newLink: TaskTagLink = {
          id: generateId(),
          taskId,
          tagId: createdTag.id,
          createdAt: new Date().toISOString()
        }
        const linkCreated = await addLink([newLink], true)
        if (linkCreated && linkCreated[0]) {
          setLinkMap(prev => ({ ...prev, [`${taskId}-${createdTag.id}`]: linkCreated[0].id }))
        }
        onChange([...selectedTagIds, createdTag.id])
      } else {
        // For new tasks, just update local state
        onChange([...selectedTagIds, createdTag.id])
      }

      // Reset form
      setNewTagName("")
      setSelectedColor("#6366f1")
      toast.success("Tag created", { description: `"${createdTag.name}" has been added` })
    } catch (e: unknown) {
      toast.error("Failed to create tag", { description: (e as Error).message })
    } finally {
      setIsCreating(false)
    }
  }

  const existingTags = allTags || []

  return (
    <div className="relative">
      {/* Selected Tags Row */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {selectedTags.length === 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 italic py-1">
            No tags selected
          </div>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: getBgColor(tag.color),
                color: tag.color
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70 transition-opacity"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Tag Button */}
      <div className="mt-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add tag
        </button>
      </div>

      {/* Dropdown Panel */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-[280px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-50 overflow-hidden"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Tag className="w-3.5 h-3.5" />
              Select Tags
            </div>

            {/* Tag List */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {existingTags.length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center">
                  No tags yet — create one below
                </div>
              ) : (
                existingTags.map((tag) => {
                  const isSelected = selectedTagIdSet.has(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className={cn("flex-1 truncate", isSelected && "line-through")}>
                        {tag.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Create New Tag Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Palette className="w-3.5 h-3.5" />
              Create New Tag
            </div>

            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              className="w-full h-8 px-2.5 text-xs mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTagName.trim()) {
                  handleCreateTag()
                }
              }}
            />

            {/* Color Swatches */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all shrink-0",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
              className="w-full h-8 text-xs font-bold uppercase tracking-wider"
            >
              {isCreating ? 'Creating...' : 'Create Tag'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
