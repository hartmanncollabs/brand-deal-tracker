-- Add repeat brand tracking columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_repeat_brand BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS past_history TEXT;
