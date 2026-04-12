-- Migration: mission_photos table + Storage bucket policies
-- Applied: 2026-04-12
-- Run this in Supabase SQL Editor.

-- ── 1. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mission_photos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  uuid        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  photo_url   text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('before', 'after')),
  caption     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mission_photos_mission_id_idx ON mission_photos(mission_id);

-- ── 2. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE mission_photos ENABLE ROW LEVEL SECURITY;

-- Admin: everything
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mission_photos' AND policyname = 'photos_admin_all') THEN
    CREATE POLICY "photos_admin_all" ON mission_photos FOR ALL TO authenticated
      USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Convoyeur: SELECT on their missions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mission_photos' AND policyname = 'photos_convoyeur_select') THEN
    CREATE POLICY "photos_convoyeur_select" ON mission_photos FOR SELECT TO authenticated
      USING (mission_id IN (SELECT id FROM missions WHERE convoyeur_id = auth.uid()));
  END IF;
END $$;

-- Convoyeur: INSERT on their missions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mission_photos' AND policyname = 'photos_convoyeur_insert') THEN
    CREATE POLICY "photos_convoyeur_insert" ON mission_photos FOR INSERT TO authenticated
      WITH CHECK (mission_id IN (SELECT id FROM missions WHERE convoyeur_id = auth.uid()));
  END IF;
END $$;

-- Convoyeur: DELETE on their missions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mission_photos' AND policyname = 'photos_convoyeur_delete') THEN
    CREATE POLICY "photos_convoyeur_delete" ON mission_photos FOR DELETE TO authenticated
      USING (mission_id IN (SELECT id FROM missions WHERE convoyeur_id = auth.uid()));
  END IF;
END $$;

-- Client: SELECT for their own missions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mission_photos' AND policyname = 'photos_client_select') THEN
    CREATE POLICY "photos_client_select" ON mission_photos FOR SELECT TO authenticated
      USING (
        mission_id IN (
          SELECT m.id FROM missions m
          JOIN clients c ON c.id = m.client_id
          WHERE c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 3. Storage bucket ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-photos',
  'mission-photos',
  true,
  10485760,   -- 10 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'mission_photos_storage_insert'
  ) THEN
    CREATE POLICY "mission_photos_storage_insert"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'mission-photos');
  END IF;
END $$;

-- Public read (bucket is public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'mission_photos_storage_select'
  ) THEN
    CREATE POLICY "mission_photos_storage_select"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'mission-photos');
  END IF;
END $$;

-- Authenticated users can delete their own uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'mission_photos_storage_delete'
  ) THEN
    CREATE POLICY "mission_photos_storage_delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'mission-photos');
  END IF;
END $$;
