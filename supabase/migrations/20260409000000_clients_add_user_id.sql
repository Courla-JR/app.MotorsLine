-- Add user_id column to clients table to link auth users directly
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: link existing clients to their auth user via email match
UPDATE clients
SET user_id = p.id
FROM profiles p
WHERE lower(clients.email) = lower(p.email)
  AND p.role = 'client'
  AND clients.user_id IS NULL;

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
