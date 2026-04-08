-- Ajout de la colonne contact_name dans invitations
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS contact_name TEXT;
