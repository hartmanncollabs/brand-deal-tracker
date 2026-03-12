-- Add sort_order column for custom ordering
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sort_order INTEGER;
