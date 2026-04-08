-- Migration: add service_level column to missions
-- Applied: 2026-04-08

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS service_level TEXT DEFAULT 'essentiel';
