-- Allow service role to insert into brandi_runs (for sync route)
-- Also add policy for brandi_feedback inserts from service role
CREATE POLICY "Service role can insert runs" ON brandi_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert feedback" ON brandi_feedback
  FOR INSERT WITH CHECK (true);
