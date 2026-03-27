import type { InventoryTransaction } from "../lib/types";
import type { JobAdapter } from "./types";
import { generateId } from "../lib/helpers";

/**
 * Creates an audit trail entry for inventory stock changes.
 * Every stock mutation should call this to maintain a complete transaction history.
 */
export async function createInventoryTransaction(
  transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>,
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  const newTransaction: InventoryTransaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString()
  };

  try {
    // Persist to database via adapter
    await adapter.insertInventoryTransaction({
      inventoryItemId: newTransaction.inventoryItemId,
      inventoryItemName: newTransaction.inventoryItemName,
      type: newTransaction.type,
      quantityChange: newTransaction.quantityChange,
      quantityBefore: newTransaction.quantityBefore,
      quantityAfter: newTransaction.quantityAfter,
      reservedChange: newTransaction.reservedChange,
      reservedBefore: newTransaction.reservedBefore,
      reservedAfter: newTransaction.reservedAfter,
      reason: newTransaction.reason,
      referenceType: newTransaction.referenceType,
      referenceId: newTransaction.referenceId,
      referenceNumber: newTransaction.referenceNumber,
      userId: newTransaction.userId,
      userName: newTransaction.userName,
    });
  } catch (e) {
    console.error('[inventoryTransactionService] Failed to persist transaction:', e);
    // Don't fail the operation if audit trail fails - just log it
  }

  console.log(`[inventoryTransaction] ${newTransaction.type.toUpperCase()}: ${newTransaction.inventoryItemName} ${newTransaction.quantityChange > 0 ? '+' : ''}${newTransaction.quantityChange} units (${newTransaction.quantityBefore} → ${newTransaction.quantityAfter})`);

  return newTransaction;
}

/**
 * Helper to create a receipt transaction (stock IN).
 * Used when receiving goods from a Purchase Order.
 */
export async function createReceiptTransaction(
  params: {
    inventoryItemId: string;
    inventoryItemName: string;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    referenceId?: string;
    referenceNumber?: string;
    reason?: string;
    userId: string;
    userName: string;
  },
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  return createInventoryTransaction({
    inventoryItemId: params.inventoryItemId,
    inventoryItemName: params.inventoryItemName,
    type: 'receipt',
    quantityChange: params.quantityChange,
    quantityBefore: params.quantityBefore,
    quantityAfter: params.quantityAfter,
    referenceType: 'purchase_order',
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    reason: params.reason || 'Received from purchase order',
    userId: params.userId,
    userName: params.userName,
  }, adapter);
}

/**
 * Helper to create a shipment transaction (stock OUT).
 * Used when shipping goods from a Sales Order.
 */
export async function createShipmentTransaction(
  params: {
    inventoryItemId: string;
    inventoryItemName: string;
    quantityChange: number;  // Should be negative
    quantityBefore: number;
    quantityAfter: number;
    referenceId?: string;
    referenceNumber?: string;
    reason?: string;
    userId: string;
    userName: string;
  },
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  return createInventoryTransaction({
    inventoryItemId: params.inventoryItemId,
    inventoryItemName: params.inventoryItemName,
    type: 'shipment',
    quantityChange: params.quantityChange,
    quantityBefore: params.quantityBefore,
    quantityAfter: params.quantityAfter,
    referenceType: 'sales_order',
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    reason: params.reason || 'Shipped to customer',
    userId: params.userId,
    userName: params.userName,
  }, adapter);
}

/**
 * Helper to create a manual adjustment transaction.
 * Used for stock corrections, cycle counts, or write-offs.
 */
export async function createAdjustmentTransaction(
  params: {
    inventoryItemId: string;
    inventoryItemName: string;
    quantityChange: number;  // Can be positive or negative
    quantityBefore: number;
    quantityAfter: number;
    reason: string;
    userId: string;
    userName: string;
  },
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  return createInventoryTransaction({
    inventoryItemId: params.inventoryItemId,
    inventoryItemName: params.inventoryItemName,
    type: 'adjustment',
    quantityChange: params.quantityChange,
    quantityBefore: params.quantityBefore,
    quantityAfter: params.quantityAfter,
    referenceType: 'manual',
    reason: params.reason,
    userId: params.userId,
    userName: params.userName,
  }, adapter);
}

/**
 * Helper to create a reservation transaction.
 * Used when stock is reserved for a quote or order.
 */
export async function createReservationTransaction(
  params: {
    inventoryItemId: string;
    inventoryItemName: string;
    reservedChange: number;  // Positive for reservation
    reservedBefore: number;
    reservedAfter: number;
    referenceId?: string;
    referenceNumber?: string;
    reason?: string;
    userId: string;
    userName: string;
  },
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  return createInventoryTransaction({
    inventoryItemId: params.inventoryItemId,
    inventoryItemName: params.inventoryItemName,
    type: 'reservation',
    quantityChange: 0,  // No physical stock change
    quantityBefore: 0,  // Not tracking physical for reservations
    quantityAfter: 0,
    reservedChange: params.reservedChange,
    reservedBefore: params.reservedBefore,
    reservedAfter: params.reservedAfter,
    referenceType: 'quote',
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    reason: params.reason || 'Reserved for quote/order',
    userId: params.userId,
    userName: params.userName,
  }, adapter);
}

/**
 * Helper to create a release transaction.
 * Used when reserved stock is released back to available.
 */
export async function createReleaseTransaction(
  params: {
    inventoryItemId: string;
    inventoryItemName: string;
    reservedChange: number;  // Negative for release
    reservedBefore: number;
    reservedAfter: number;
    referenceId?: string;
    referenceNumber?: string;
    reason?: string;
    userId: string;
    userName: string;
  },
  adapter: JobAdapter
): Promise<InventoryTransaction> {
  return createInventoryTransaction({
    inventoryItemId: params.inventoryItemId,
    inventoryItemName: params.inventoryItemName,
    type: 'release',
    quantityChange: 0,
    quantityBefore: 0,
    quantityAfter: 0,
    reservedChange: params.reservedChange,
    reservedBefore: params.reservedBefore,
    reservedAfter: params.reservedAfter,
    referenceType: 'quote',
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    reason: params.reason || 'Released from reservation',
    userId: params.userId,
    userName: params.userName,
  }, adapter);
}
