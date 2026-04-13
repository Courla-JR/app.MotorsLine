-- Migration: create mission_expenses table
-- Applied: 2026-04-13
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS mission_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('carburant', 'peage', 'parking', 'repas', 'hotel', 'autre')),
  amount      DECIMAL(10, 2) NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mission_expenses_mission_id_idx ON mission_expenses(mission_id);

-- RLS
ALTER TABLE mission_expenses ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admin full access on mission_expenses"
  ON mission_expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Convoyeur: full access on missions assigned to them
CREATE POLICY "Convoyeur access own mission expenses"
  ON mission_expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM missions
      WHERE missions.id = mission_expenses.mission_id
        AND missions.convoyeur_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM missions
      WHERE missions.id = mission_expenses.mission_id
        AND missions.convoyeur_id = auth.uid()
    )
  );

-- No client access
