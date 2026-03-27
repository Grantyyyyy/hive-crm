import type { JobAdapter } from "./types";
import { sendFollowUpReminder, releaseQuoteStock } from "./quoteService";
import { checkAndAlertLowStock } from "./inventoryService";
import type { CRMContextValue } from "../lib/CRMContext";
import type { Quote } from "../lib/types";

/**
 * Automatically expires quotes that have passed their validUntil date.
 */
export async function autoExpireQuotes(ctx: CRMContextValue): Promise<void> {
  const quotes = ctx.getResource<Quote>('quotes').data;
  const now = new Date();

  for (const quote of quotes) {
    if (quote.status === 'sent' && quote.validUntil) {
      const validUntil = new Date(quote.validUntil);
      if (now > validUntil) {
        await releaseQuoteStock(quote, ctx);
        console.log(`[scheduledJobs] Quote ${quote.quoteNumber} expired and stock released.`);
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
export async function runScheduledJobs(adapter: JobAdapter, ctx: CRMContextValue): Promise<void> {
  console.log("[scheduledJobs] Starting automation checks...");
  await autoExpireQuotes(ctx);
  await sendFollowUpReminders(adapter);
  await checkAndAlertLowStock(adapter, ctx);
  console.log("[scheduledJobs] Automation checks complete.");
}
