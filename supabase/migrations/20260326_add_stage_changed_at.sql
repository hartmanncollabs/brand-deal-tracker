-- Add stage_changed_at column to track when deals move between stages
-- This enables monthly pipeline tracking for goals

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ;

-- Backfill existing deals: use updated_at as initial value
UPDATE deals 
SET stage_changed_at = updated_at 
WHERE stage_changed_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN deals.stage_changed_at IS 'Timestamp of last stage change, used for monthly goal tracking';
