import { CheckCircle2, Circle, Clock, AlertCircle, Zap, ShieldCheck, PlayCircle } from 'lucide-react'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'open' | 'in-progress' | 'completed'

export const getPriorityStyles = (priority: TaskPriority | string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        color: 'text-red-700 dark:text-red-400',
        border: 'border-red-100 dark:border-red-800/50',
        icon: Zap,
        label: 'Urgent'
      }
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        color: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-100 dark:border-orange-800/50',
        icon: AlertCircle,
        label: 'High'
      }
    case 'medium':
      return {
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        color: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-100 dark:border-teal-800/50',
        icon: Clock,
        label: 'Medium'
      }
    case 'low':
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-900/50',
        color: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800',
        icon: ShieldCheck,
        label: priority || 'Low'
      }
  }
}

export const getStatusStyles = (status: TaskStatus | string) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return {
        bg: 'bg-slate-100 dark:bg-slate-900',
        color: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800',
        icon: Circle,
        label: 'To Do'
      }
    case 'in-progress':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        color: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-100 dark:border-amber-800/50',
        icon: PlayCircle,
        label: 'In Progress'
      }
    case 'completed':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        color: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-100 dark:border-emerald-800/50',
        icon: CheckCircle2,
        label: 'Completed'
      }
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-950',
        color: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800',
        icon: Clock,
        label: status || 'Pending'
      }
  }
}
