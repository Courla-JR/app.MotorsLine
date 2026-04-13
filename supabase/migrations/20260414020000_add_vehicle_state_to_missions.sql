-- Migration: add mileage and fuel level columns to missions
-- Applied: 2026-04-14
-- Run in Supabase SQL Editor.

ALTER TABLE missions ADD COLUMN IF NOT EXISTS mileage_start INTEGER;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mileage_end INTEGER;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS fuel_level_start TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS fuel_level_end TEXT;
