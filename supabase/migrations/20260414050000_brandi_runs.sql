-- Brandi run summaries — stores what she found/did on each scan
CREATE TABLE IF NOT EXISTS brandi_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT NOT NULL,
  deals_created INTEGER DEFAULT 0,
  deals_updated INTEGER DEFAULT 0,
  emails_scanned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — accessed via service key from API route
ALTER TABLE brandi_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view runs"
  ON brandi_runs FOR SELECT
  USING (auth.role() = 'authenticated');
