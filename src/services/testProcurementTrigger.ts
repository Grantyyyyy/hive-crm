import { logger } from '../lib/logger'
import type { JobAdapter } from './types'
import { analyzeShortages, createProcurementForShortages } from './procurementTriggerService'
import { toast } from 'sonner'

/**
 * Test function to trigger procurement analysis
 * Call this from browser console or add a button to UI
 */
export async function testProcurementTrigger(adapter: JobAdapter): Promise<void> {
  const orders = adapter.getSalesOrders()
  const inventory = adapter.getInventoryItems()
  
  logger.log('[Test] Running shortage analysis...')
  logger.log('Orders:', orders.length)
  logger.log('Inventory items:', inventory.length)
  
  const shortages = analyzeShortages(orders, inventory)
  
  logger.log('[Test] Shortages found:', shortages)
  toast(`Found ${shortages.length} items with shortage`, {
    description: shortages.map(s => `Order item: ${s.orderItemId}, qty: ${s.shortageQty}`).join('\n')
  })
  
  if (shortages.length > 0) {
    const vendors = [] as any[]
    const result = await createProcurementForShortages({
      shortages,
      vendors,
      mode: 'direct_po',
      adapter
    })
    
    logger.log('[Test] Procurement result:', result)
    toast(`Created ${result.createdPOs} PO(s) covering ${result.shortageCovered} units`)
  } else {
    toast('No shortages found - nothing to procure')
  }
}