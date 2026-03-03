-- Migration: Add sort_order column for drag-and-drop reordering
-- Run this in your Supabase SQL editor

-- Add sort_order column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_deals_sort_order ON deals(stage, sort_order);

-- Initialize sort_order for existing deals based on updated_at (newest first within each stage)
-- This assigns sort_order values spaced by 100 to allow insertions
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY stage ORDER BY updated_at DESC) * 100 as new_sort_order
  FROM deals
  WHERE sort_order IS NULL
)
UPDATE deals
SET sort_order = ranked.new_sort_order
FROM ranked
WHERE deals.id = ranked.id;

-- Optional: Set default for new deals (will be overridden by app logic)
ALTER TABLE deals ALTER COLUMN sort_order SET DEFAULT 0;
