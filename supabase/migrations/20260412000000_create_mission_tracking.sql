-- Migration: create mission_tracking table
-- Applied: 2026-04-12
-- Run this in Supabase SQL Editor.

-- 1. Table — one row per mission (upsert on mission_id)
CREATE TABLE IF NOT EXISTS mission_tracking (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  uuid        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  latitude    float8      NOT NULL,
  longitude   float8      NOT NULL,
  speed       float8,
  heading     float8,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mission_tracking_mission_id_unique UNIQUE (mission_id)
);

-- 2. Index
CREATE INDEX IF NOT EXISTS mission_tracking_mission_id_idx ON mission_tracking(mission_id);

-- 3. Enable RLS
ALTER TABLE mission_tracking ENABLE ROW LEVEL SECURITY;

-- 4. Admin: full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mission_tracking' AND policyname = 'tracking_admin_all'
  ) THEN
    CREATE POLICY "tracking_admin_all"
      ON mission_tracking FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- 5. Convoyeur: SELECT on their missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mission_tracking' AND policyname = 'tracking_convoyeur_select'
  ) THEN
    CREATE POLICY "tracking_convoyeur_select"
      ON mission_tracking FOR SELECT TO authenticated
      USING (
        mission_id IN (
          SELECT id FROM missions WHERE convoyeur_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 6. Convoyeur: INSERT on their missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mission_tracking' AND policyname = 'tracking_convoyeur_insert'
  ) THEN
    CREATE POLICY "tracking_convoyeur_insert"
      ON mission_tracking FOR INSERT TO authenticated
      WITH CHECK (
        mission_id IN (
          SELECT id FROM missions WHERE convoyeur_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 7. Convoyeur: UPDATE on their missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mission_tracking' AND policyname = 'tracking_convoyeur_update'
  ) THEN
    CREATE POLICY "tracking_convoyeur_update"
      ON mission_tracking FOR UPDATE TO authenticated
      USING (
        mission_id IN (
          SELECT id FROM missions WHERE convoyeur_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 8. Client: SELECT for their own missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mission_tracking' AND policyname = 'tracking_client_select'
  ) THEN
    CREATE POLICY "tracking_client_select"
      ON mission_tracking FOR SELECT TO authenticated
      USING (
        mission_id IN (
          SELECT m.id FROM missions m
          JOIN clients c ON c.id = m.client_id
          WHERE c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 9. Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE mission_tracking;
