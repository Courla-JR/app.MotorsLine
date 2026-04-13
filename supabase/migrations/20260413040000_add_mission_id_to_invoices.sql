-- Migration: add mission_id column to invoices table
-- Applied: 2026-04-13
-- Run in Supabase SQL Editor.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_mission_id ON invoices(mission_id);
