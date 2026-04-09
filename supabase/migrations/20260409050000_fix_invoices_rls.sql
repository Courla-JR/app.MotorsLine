-- Migration: fix invoices table RLS + Storage bucket policies
-- Applied: 2026-04-09
-- Run this in Supabase SQL Editor if the invoices insert still fails.

-- 1. Enable RLS on invoices table (idempotent)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy — admin & convoyeur can read all invoices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_select_staff') THEN
    CREATE POLICY "invoices_select_staff"
    ON invoices FOR SELECT TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'convoyeur'))
    );
  END IF;
END $$;

-- 3. SELECT policy — client can read own invoices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_select_client_own') THEN
    CREATE POLICY "invoices_select_client_own"
    ON invoices FOR SELECT TO authenticated
    USING (
      client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- 4. INSERT policy — admin & convoyeur can insert invoices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_insert_staff') THEN
    CREATE POLICY "invoices_insert_staff"
    ON invoices FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'convoyeur'))
    );
  END IF;
END $$;

-- 5. Storage: invoices bucket — authenticated upload + read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'invoices_storage_insert'
  ) THEN
    CREATE POLICY "invoices_storage_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'invoices');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'invoices_storage_select'
  ) THEN
    CREATE POLICY "invoices_storage_select"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'invoices');
  END IF;
END $$;
