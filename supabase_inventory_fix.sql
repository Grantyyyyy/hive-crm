-- Migration to fix inventory table schema
-- Adds missing columns: description, reorder_threshold, reorder_quantity
-- Run this in your Supabase SQL Editor

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reorder_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 50;

COMMENT ON COLUMN inventory.description IS 'Detailed product technical specifications and notes.';
COMMENT ON COLUMN inventory.reorder_threshold IS 'ATP units at which the item is flagged as low stock.';
COMMENT ON COLUMN inventory.reorder_quantity IS 'Suggested amount to order when restocking.';
