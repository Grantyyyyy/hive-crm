import type { Quote, SalesOrder, QuoteItem, OrderItem } from "./types"

/**
 * Generates an auto-incremented quote number in format QT-XXXX
 * @param existingQuotes List of existing quotes to determine next sequence
 * @returns Generated quote number
 */
export function generateQuoteNumber(existingQuotes: Quote[]): string {
  if (!existingQuotes || existingQuotes.length === 0) {
    return "QT-0001"
  }
  
  let maxSeq = 0
  for (const quote of existingQuotes) {
    const parts = quote.quoteNumber?.split("-")
    if (parts && parts.length === 2 && parts[0] === "QT") {
      const seq = parseInt(parts[1], 10)
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `QT-${nextSeq.toString().padStart(4, "0")}`
}

/**
 * Generates an auto-incremented order number in format SO-XXXX
 * @param existingOrders List of existing orders to determine next sequence
 * @returns Generated order number
 */
export function generateOrderNumber(existingOrders: SalesOrder[]): string {
  if (!existingOrders || existingOrders.length === 0) {
    return "SO-0001"
  }
  
  let maxSeq = 0
  for (const order of existingOrders) {
    const parts = order.orderNumber?.split("-")
    if (parts && parts.length === 2 && parts[0] === "SO") {
      const seq = parseInt(parts[1], 10)
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `SO-${nextSeq.toString().padStart(4, "0")}`
}

/**
 * Stub for sending a quote email to the customer
 * @param quote The quote to send
 */
export function sendQuoteEmail(quote: Quote) {
  // TODO: Implement actual PDF generation and email sending
  console.log(`[quoteOrderAutomation] Sending Quote Email to ${quote.customerName} for ${quote.quoteNumber}`)
  console.log(`  - Generating PDF summary...`)
  console.log(`  - Valid Until: ${quote.validUntil}`)
  console.log(`  - Email Sent Timestamp: ${new Date().toISOString()}`)
}

/**
 * Stub for sending a shipping notification to the customer
 * @param order The shipped sales order
 */
export function sendShippingNotification(order: SalesOrder) {
  // TODO: Implement actual email sending
  console.log(`[quoteOrderAutomation] Sending Shipping Notification for Order ${order.orderNumber}`)
  console.log(`  - Customer: ${order.customerName}`)
  console.log(`  - Items included: ${order.items.map(i => i.name).join(", ")}`)
}

/**
 * Stub for generating an invoice and emailing the customer
 * @param order The delivered sales order
 */
export function generateInvoice(order: SalesOrder) {
  // TODO: Implement PDF generation and email dispatch
  console.log(`[quoteOrderAutomation] Generating Invoice for Delivered Order ${order.orderNumber}`)
  console.log(`  - Customer: ${order.customerName}`)
  console.log(`  - Total Billed: ${order.totalValue} ${order.currency}`)
}

/**
 * Stub for sending a follow-up reminder
 * @param quote The quote to follow up on
 */
export function sendFollowUpReminder(quote: Quote) {
  // TODO: Implement actual email sending
  console.log(`[quoteOrderAutomation] Sending Follow-Up Reminder for Quote ${quote.quoteNumber}`)
}

/**
 * Converts a Quote to a Sales Order
 * @param quote The accepted quote to convert
 * @param existingOrders The existing sales orders to generate the next number
 * @param generateIdFn A function to generate random IDs
 * @returns The new SalesOrder
 */
export function convertQuoteToSalesOrder(
  quote: Quote, 
  existingOrders: SalesOrder[],
  generateIdFn: () => string
): SalesOrder {
  const orderNumber = generateOrderNumber(existingOrders)
  
  const orderItems: OrderItem[] = quote.items.map(item => ({
    id: generateIdFn(),
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }))
  
  const newOrder: SalesOrder = {
    id: generateIdFn(),
    orderNumber,
    quoteId: quote.id,
    customerId: quote.customerId,
    customerName: quote.customerName,
    totalValue: quote.amount,
    currency: quote.currency,
    status: 'pending',
    orderDate: new Date().toISOString(),
    items: orderItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return newOrder
}

/**
 * Executes scheduled jobs for automations on Quote and Sales Orders
 * This checks for quote expiries and follow-up reminders.
 * @param quotes List of current quotes
 * @param updateQuoteFn Callback to update the quote in your data store
 */
export function runScheduledJobs(
  quotes: Quote[],
  updateQuoteFn: (quoteId: string, updates: Partial<Quote>) => void
) {
  const now = new Date()
  
  for (const quote of quotes) {
    if (quote.status === 'sent' && quote.validUntil) {
      const validUntil = new Date(quote.validUntil)
      
      // Auto-expire
      if (now > validUntil) {
        console.log(`[quoteOrderAutomation] Quote ${quote.quoteNumber} expired.`)
        updateQuoteFn(quote.id, { status: 'expired' })
        continue
      }
      
      // Follow-up reminder (at 50% of valid window)
      if (!quote.reminderSent) {
        const createDate = new Date(quote.createdAt)
        // Midpoint calculation
        const totalDuration = validUntil.getTime() - createDate.getTime()
        const midpoint = new Date(createDate.getTime() + totalDuration / 2)
        
        if (now >= midpoint && now < validUntil) {
          sendFollowUpReminder(quote)
          updateQuoteFn(quote.id, { reminderSent: true })
        }
      }
    }
  }
}
