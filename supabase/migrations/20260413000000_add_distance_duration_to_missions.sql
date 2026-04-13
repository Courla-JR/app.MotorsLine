-- Migration: add distance_km and duration columns to missions
-- Applied: 2026-04-13

ALTER TABLE missions ADD COLUMN IF NOT EXISTS distance_km TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS duration     TEXT;
