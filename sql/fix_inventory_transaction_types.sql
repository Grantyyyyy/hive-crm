-- Fix existing inventory transactions with wrong type values
-- This maps old application codes to correct database constraint values

-- Fix receipt transactions (old 'in' type from PO receipts)
UPDATE inventory_transactions 
SET type = 'receipt' 
WHERE type = 'in' AND reference_type = 'purchase_order' AND reason LIKE '%PO Receipt%';

-- Fix return transactions (old 'in' type from returns)
UPDATE inventory_transactions 
SET type = 'return' 
WHERE type = 'in' AND reference_type = 'sales_order' AND reason LIKE '%return%';

-- Fix shipment transactions (old 'out' type)
UPDATE inventory_transactions 
SET type = 'shipment' 
WHERE type = 'out';

-- Fix adjustment transactions (old 'adjust' type from manual adjustments)
UPDATE inventory_transactions 
SET type = 'adjustment' 
WHERE type = 'adjust' AND reference_type = 'manual';

-- Fix reservation transactions (old 'adjust' type with reserved_change)
UPDATE inventory_transactions 
SET type = 'reservation' 
WHERE type = 'adjust' AND reference_type = 'quote' AND reserved_change > 0;

-- Fix release transactions (old 'adjust' type with negative reserved_change)
UPDATE inventory_transactions 
SET type = 'release' 
WHERE type = 'adjust' AND reference_type = 'quote' AND reserved_change < 0;

-- Verify the fix
SELECT type, COUNT(*) as count 
FROM inventory_transactions 
GROUP BY type 
ORDER BY type;
