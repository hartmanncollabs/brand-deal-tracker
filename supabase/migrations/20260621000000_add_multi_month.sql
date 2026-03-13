-- Add multi-month deal support columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_multi_month BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS total_months INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS parent_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS month_number INTEGER;

-- Add index for efficient parent/child lookups
CREATE INDEX IF NOT EXISTS idx_deals_parent_deal_id ON deals(parent_deal_id);

-- Comment for documentation
COMMENT ON COLUMN deals.is_multi_month IS 'Whether this is a multi-month parent deal';
COMMENT ON COLUMN deals.total_months IS 'Total number of months in the contract (for parent deals)';
COMMENT ON COLUMN deals.monthly_value IS 'Value per month (for parent deals)';
COMMENT ON COLUMN deals.parent_deal_id IS 'Reference to parent deal (for child monthly portions)';
COMMENT ON COLUMN deals.month_number IS 'Which month number this is (for child deals, 1-indexed)';
