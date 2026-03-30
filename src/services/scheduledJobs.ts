import type { JobAdapter } from "./types";
import { sendFollowUpReminder, releaseQuoteStock } from "./quoteService";
import { checkAndAlertLowStock } from "./inventoryService";
import type { CRMContextValue } from "../lib/CRMContext";
import type { Quote, Task } from "../lib/types";
import { toast } from "sonner";

/**
 * Creates next occurrence for completed recurring tasks.
 */
export async function processRecurringTasks(ctx: CRMContextValue): Promise<void> {
  const tasks = ctx.getResource<Task>('tasks').data;
  const now = new Date();

  for (const task of tasks) {
    // Check if task is recurring and was just completed
    if (task.recurrencePattern &&
      task.status === 'completed' &&
      task.completedAt &&
      !task.parentTaskId) {  // Only process parent tasks, not instances

      const completedDate = new Date(task.completedAt);
      const nextOccurrence = task.nextOccurrence ? new Date(task.nextOccurrence) : null;

      // Check if we should create the next occurrence
      if (nextOccurrence && completedDate >= nextOccurrence) {
        // Check end date
        if (task.recurrenceEndDate && nextOccurrence > new Date(task.recurrenceEndDate)) {
          // Past end date, clear recurrence
          await ctx.setResourceData('tasks', (prev: Task[]) =>
            prev.map((t: Task) => t.id === task.id ? { ...t, recurrencePattern: undefined, recurrenceInterval: undefined, recurrenceEndDate: undefined, nextOccurrence: undefined } : t)
          );
          console.log(`[scheduledJobs] Recurring task "${task.title}" reached end date, recurrence cleared.`);
          continue;
        }

        // Create next occurrence
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: task.title,
          description: task.description,
          dueDate: nextOccurrence.toISOString(),
          priority: task.priority,
          status: 'open',
          ownerId: task.ownerId,
          createdBy: task.createdBy,
          entityType: task.entityType,
          entityId: task.entityId,
          contactId: task.contactId,
          dealId: task.dealId,
          leadId: task.leadId,
          projectId: task.projectId,
          parentTaskId: task.id,
          recurrencePattern: task.recurrencePattern,
          recurrenceInterval: task.recurrenceInterval,
          recurrenceEndDate: task.recurrenceEndDate,
          nextOccurrence: calculateNextOccurrence(nextOccurrence.toISOString(), task.recurrencePattern, task.recurrenceInterval || 1),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        await ctx.setResourceData('tasks', (prev) => [newTask, ...prev]);
        console.log(`[scheduledJobs] Created next occurrence for recurring task "${task.title}" due ${nextOccurrence.toLocaleDateString()}`);
      }
    }
  }
}

function calculateNextOccurrence(dateStr: string, pattern: string, interval: number): string {
  const date = new Date(dateStr);
  switch (pattern) {
    case 'daily': date.setDate(date.getDate() + interval); break;
    case 'weekly': date.setDate(date.getDate() + (interval * 7)); break;
    case 'monthly': date.setMonth(date.getMonth() + interval); break;
    case 'yearly': date.setFullYear(date.getFullYear() + interval); break;
    case 'custom': date.setDate(date.getDate() + interval); break;
  }
  return date.toISOString();
}

/**
 * Automatically expires quotes that have passed their validUntil date.
 */
export async function autoExpireQuotes(ctx: CRMContextValue): Promise<void> {
  const quotes = ctx.getResource<Quote>('quotes').data;
  const now = new Date();

  for (const quote of quotes) {
    if (quote.status === 'sent' && quote.stockReserved === true && quote.validUntil) {
      const validUntil = new Date(quote.validUntil);
      if (now > validUntil) {
        try {
          await releaseQuoteStock(quote, ctx, 'system', 'Scheduled Job');
          console.log(`[scheduledJobs] Quote ${quote.quoteNumber} expired and stock released.`);
        } catch (e) {
          // Quote may have been modified concurrently (e.g., accepted or manually rejected)
          // Safe to skip - the reservation was handled another way
          console.warn(`[scheduledJobs] Failed to expire quote ${quote.quoteNumber}:`, e);
        }
      }
    }
  }
}

/**
 * Sends follow-up reminders at 50% of the validity window.
 */
export async function sendFollowUpReminders(adapter: JobAdapter): Promise<void> {
  const quotes = adapter.getQuotes();
  const now = new Date();

  for (const quote of quotes) {
    if (quote.status === 'sent' && quote.validUntil && !quote.reminderSent) {
      const createDate = new Date(quote.createdAt);
      const validUntil = new Date(quote.validUntil);

      const totalDuration = validUntil.getTime() - createDate.getTime();
      const midpoint = new Date(createDate.getTime() + totalDuration / 2);

      if (now >= midpoint && now < validUntil) {
        sendFollowUpReminder(quote);
        await adapter.updateQuote(quote.id, { reminderSent: true });
        console.log(`[scheduledJobs] Follow-up reminder sent for ${quote.quoteNumber}`);
      }
    }
  }
}

function formatReminderDescription(task: Task): string {
  const due = new Date(task.dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

/**
 * Fires toast notifications when task remindAt time is reached.
 */
export async function checkTaskReminders(adapter: JobAdapter): Promise<void> {
  const now = new Date();
  const tasks = adapter.getTasks();

  for (const task of tasks) {
    // skip if no reminder set
    if (!task.remindAt) continue;

    // skip if already sent
    if (task.reminderSent === true) continue;

    // skip if task is already completed
    if (task.status === 'completed') continue;

    // skip if reminder time is still in the future
    if (new Date(task.remindAt) > now) continue;

    // fire the toast
    toast(`Reminder: ${task.title}`, {
      description: formatReminderDescription(task),
      duration: 10000,
    });

    // mark as sent so it never fires again
    await adapter.updateTask(task.id, { reminderSent: true });
    console.log(`[scheduledJobs] Task reminder fired for "${task.title}"`);
  }
}

/**
 * Master orchestrator for all scheduled tasks.
 */
export async function runScheduledJobs(adapter: JobAdapter, ctx: CRMContextValue): Promise<void> {
  console.log("[scheduledJobs] Starting automation checks...");
  await processRecurringTasks(ctx);
  await autoExpireQuotes(ctx);
  await sendFollowUpReminders(adapter);
  await checkAndAlertLowStock(adapter, ctx);
  await checkTaskReminders(adapter);
  console.log("[scheduledJobs] Automation checks complete.");
}
