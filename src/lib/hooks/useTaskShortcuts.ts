import { useEffect } from "react"

interface UseTaskShortcutsOptions {
  onNewTask?: () => void
  onSearch?: () => void
  onCompleteSelected?: () => void
  onDeleteSelected?: () => void
  onViewToggle?: () => void
}

export function useTaskShortcuts({
  onNewTask,
  onSearch,
  onCompleteSelected,
  onDeleteSelected,
  onViewToggle,
}: UseTaskShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // N - New task
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onNewTask?.()
      }

      // / - Focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onSearch?.()
      }

      // Space - Complete selected task(s)
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onCompleteSelected?.()
      }

      // Backspace/Delete - Delete selected task(s)
      if ((e.key === 'Backspace' || e.key === 'Delete') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onDeleteSelected?.()
      }

      // V - Toggle view (Table/Kanban)
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onViewToggle?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewTask, onSearch, onCompleteSelected, onDeleteSelected, onViewToggle])
}
