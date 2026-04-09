-- Migration: add phone, company, notifications_email to profiles
-- Applied: 2026-04-09

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT TRUE;
