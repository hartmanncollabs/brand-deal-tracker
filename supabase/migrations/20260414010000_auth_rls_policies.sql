-- Update RLS policies to require authentication
-- All authenticated users share the same board (no per-user filtering)

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on deals" ON deals;
DROP POLICY IF EXISTS "Allow all operations on deal_activities" ON deal_activities;

-- Deals: authenticated users can do everything
CREATE POLICY "Authenticated users can view deals"
  ON deals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert deals"
  ON deals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update deals"
  ON deals FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete deals"
  ON deals FOR DELETE
  USING (auth.role() = 'authenticated');

-- Deal activities: authenticated users can do everything
CREATE POLICY "Authenticated users can view activities"
  ON deal_activities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activities"
  ON deal_activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update activities"
  ON deal_activities FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete activities"
  ON deal_activities FOR DELETE
  USING (auth.role() = 'authenticated');
