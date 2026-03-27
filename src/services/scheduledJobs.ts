import type { JobAdapter } from "./types";
import { sendFollowUpReminder } from "./quoteService";
import { checkAndAlertLowStock } from "./inventoryService";

/**
 * Automatically expires quotes that have passed their validUntil date.
 */
export async function autoExpireQuotes(adapter: JobAdapter): Promise<void> {
  const quotes = adapter.getQuotes();
  const now = new Date();

  for (const quote of quotes) {
    if (quote.status === 'sent' && quote.validUntil) {
      const validUntil = new Date(quote.validUntil);
      if (now > validUntil) {
        await adapter.updateQuote(quote.id, { status: 'expired' });
        console.log(`[scheduledJobs] Quote ${quote.quoteNumber} expired.`);
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

/**
 * Master orchestrator for all scheduled tasks.
 */
export async function runScheduledJobs(adapter: JobAdapter): Promise<void> {
  console.log("[scheduledJobs] Starting automation checks...");
  await autoExpireQuotes(adapter);
  await sendFollowUpReminders(adapter);
  await checkAndAlertLowStock(adapter);
  console.log("[scheduledJobs] Automation checks complete.");
}
