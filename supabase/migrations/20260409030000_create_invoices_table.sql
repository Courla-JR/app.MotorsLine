-- Migration: create invoices table + bucket hint + profiles columns safety
-- Applied: 2026-04-09

-- 1. Ensure profiles columns exist (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT TRUE;

-- 2. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  date          DATE NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "invoices_select_admin_convoyeur"
  ON invoices FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'convoyeur'))
  );

CREATE POLICY IF NOT EXISTS "invoices_select_client_own"
  ON invoices FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "invoices_insert_admin_convoyeur"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'convoyeur'))
  );

CREATE POLICY IF NOT EXISTS "invoices_all_admin"
  ON invoices FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTE: Create the "invoices" Storage bucket in Supabase Dashboard → Storage → New bucket
-- Set to private, then configure policies to allow authenticated read/write.
