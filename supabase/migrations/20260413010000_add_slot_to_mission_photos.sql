-- Migration: add slot column to mission_photos
-- Applied: 2026-04-13
-- Run in Supabase SQL Editor.

ALTER TABLE mission_photos ADD COLUMN IF NOT EXISTS slot TEXT;

-- Allowed values: 'face_avant', 'cote_gauche', 'cote_droit', 'face_arriere', 'pare_brise', 'compteur', NULL (free photo)
