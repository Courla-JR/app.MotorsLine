-- Migration: add vehicle_image_url to missions + vehicle-images storage bucket
-- Applied: 2026-04-09

-- 1. Add vehicle_image_url column to missions (nullable, optional)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT;

-- 2. Storage bucket: vehicle-images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies on storage objects for vehicle-images bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY IF NOT EXISTS "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');
