-- Per-deal Brandi update requests — queued from the "Update with Brandi" button in DealModal
CREATE TABLE IF NOT EXISTS brandi_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brandi_requests_status ON brandi_requests(status);

-- RLS: authenticated users only (Brandi reads/updates via service key, which bypasses RLS)
ALTER TABLE brandi_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requests"
  ON brandi_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert requests"
  ON brandi_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
