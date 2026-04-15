-- Add suggestions field to brandi_runs for focus areas and recommendations
ALTER TABLE brandi_runs ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]';
