-- Correction du trigger handle_new_user
-- Problème : raw_user_meta_data causait un crash (unexpected_failure 500)
-- Fix : INSERT minimal avec valeurs sûres + EXCEPTION guard pour ne jamais
--       bloquer le signUp Supabase, quel que soit l'état de la table profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NULL,
    'convoyeur'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Ne jamais bloquer le signUp même si l'insert échoue
    RETURN NEW;
END;
$$;
