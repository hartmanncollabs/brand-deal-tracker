-- Update storage policies to require authentication

-- Drop old permissive policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads" ON storage.objects;

-- Authenticated users can read attachments
CREATE POLICY "Authenticated read access" ON storage.objects
FOR SELECT USING (bucket_id = 'deal-attachments' AND auth.role() = 'authenticated');

-- Authenticated users can upload attachments
CREATE POLICY "Authenticated upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'deal-attachments' AND auth.role() = 'authenticated');

-- Authenticated users can update/overwrite attachments (for upsert)
CREATE POLICY "Authenticated update access" ON storage.objects
FOR UPDATE USING (bucket_id = 'deal-attachments' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'deal-attachments' AND auth.role() = 'authenticated');

-- Authenticated users can delete attachments
CREATE POLICY "Authenticated delete access" ON storage.objects
FOR DELETE USING (bucket_id = 'deal-attachments' AND auth.role() = 'authenticated');
