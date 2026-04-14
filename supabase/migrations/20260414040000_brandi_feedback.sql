-- Brandi feedback table — stores instructions from the team
CREATE TABLE IF NOT EXISTS brandi_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: authenticated users only
ALTER TABLE brandi_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feedback"
  ON brandi_feedback FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert feedback"
  ON brandi_feedback FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
