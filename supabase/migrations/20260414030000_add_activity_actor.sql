-- Add actor field to deal_activities to track who made the change
-- 'user' = human via webapp, 'brandi' = Claude Code agent
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'user';
