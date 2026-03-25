-- Create storage bucket for deal attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-attachments', 'deal-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'deal-attachments');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'deal-attachments');
