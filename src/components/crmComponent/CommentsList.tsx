import { useState } from "react"
import { Send, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { TaskComment } from "@/lib/types"

interface CommentsListProps {
  taskId: string
  comments: TaskComment[]
  userId: string
  onAdd: (content: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
}

export function CommentsList({ comments, userId, onAdd, onDelete, onUpdate }: Omit<CommentsListProps, 'taskId'>) {
  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const handleAdd = () => {
    if (!newComment.trim()) return
    onAdd(newComment.trim())
    setNewComment("")
  }

  const handleStartEdit = (comment: TaskComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingId) return
    onUpdate(editingId, editContent.trim())
    setEditingId(null)
    setEditContent("")
  }

  const sortedComments = [...comments].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-text-primary">Comments</h4>

      {/* Add Comment */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-accent">ME</span>
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!newComment.trim()}>
              <Send className="w-3.5 h-3.5 mr-2" />
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {sortedComments.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No comments yet</p>
        ) : (
          sortedComments.map(comment => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-3 group",
                editingId === comment.id ? "bg-bg-elevated/50 p-3 rounded-lg" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden",
                comment.authorAvatar
                  ? "bg-bg-surface"
                  : "bg-accent/10"
              )}>
                {comment.authorAvatar ? (
                  <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-accent">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-text-primary">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                )}
              </div>
              {comment.authorId === userId && editingId !== comment.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="p-1 text-text-muted hover:text-red"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
