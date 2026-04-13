-- Migration: fix handle_new_user to link clients.user_id on signup
--            fix clients_update_own RLS to allow bootstrap update when user_id IS NULL
-- Applied: 2026-04-13
-- Run in Supabase SQL Editor.

-- 1. Update trigger: also sets clients.user_id when email matches
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile (default role convoyeur; client register page will upsert to 'client')
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NULL, 'convoyeur')
  ON CONFLICT (id) DO NOTHING;

  -- Link clients record if a matching email exists and user_id is not yet set
  UPDATE public.clients
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Never block signUp even if something above fails
    RETURN NEW;
END;
$$;

-- 2. Fix clients_update_own RLS to also allow the bootstrap case:
--    a newly authenticated user whose user_id is still NULL can link themselves via email match.
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;

CREATE POLICY "clients_update_own"
  ON public.clients
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND lower(email) = lower((auth.jwt() ->> 'email')))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND lower(email) = lower((auth.jwt() ->> 'email')))
  );
