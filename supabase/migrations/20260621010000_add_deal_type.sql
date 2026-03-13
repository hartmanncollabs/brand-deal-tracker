-- Add deal type to distinguish UGC vs posted content deals
-- UGC: Brand posts the content (skip scheduled/delivered)
-- Posted: Liz posts to her account (full pipeline)
-- Hybrid: Mix of both

ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'posted';

-- Add check constraint for valid values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_deal_type_check;
ALTER TABLE deals ADD CONSTRAINT deals_deal_type_check 
  CHECK (deal_type IN ('ugc', 'posted', 'hybrid'));

COMMENT ON COLUMN deals.deal_type IS 'ugc = brand posts (skip scheduled/delivered), posted = Liz posts (full pipeline), hybrid = mix';
