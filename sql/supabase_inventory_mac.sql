-- Migration: Add moving average cost to Inventory for Partial Receiving Workflow
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS moving_average_cost NUMERIC NOT NULL DEFAULT 0;
