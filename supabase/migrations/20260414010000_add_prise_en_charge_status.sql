-- Migration: add prise_en_charge status + convoyeur RLS policies
-- Applied: 2026-04-14
-- Run in Supabase SQL Editor.

-- 1. Replace CHECK constraint on missions.status to include prise_en_charge
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_status_check;
ALTER TABLE missions
  ADD CONSTRAINT missions_status_check
  CHECK (status IN ('a_faire', 'prise_en_charge', 'en_cours', 'terminee', 'annulee'));

-- 2. Allow convoyeur to UPDATE their own assigned missions (status changes)
DROP POLICY IF EXISTS "convoyeur_update_own_mission_status" ON missions;
CREATE POLICY "convoyeur_update_own_mission_status"
  ON missions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'convoyeur')
    AND convoyeur_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'convoyeur')
    AND convoyeur_id = auth.uid()
  );

-- 3. Allow convoyeur and admin to SELECT from clients (for client name display)
DROP POLICY IF EXISTS "clients_select_convoyeur" ON clients;
CREATE POLICY "clients_select_convoyeur"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('convoyeur', 'admin')
    )
  );
