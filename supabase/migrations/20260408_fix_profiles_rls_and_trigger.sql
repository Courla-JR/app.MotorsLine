-- ─────────────────────────────────────────────────────────────
-- 1. Policy INSERT sur profiles
--    Permet à un utilisateur d'insérer sa propre ligne (auth.uid() = id)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger handle_new_user (SECURITY DEFINER → bypass RLS)
--    Crée automatiquement une ligne dans profiles à chaque signUp.
--    ON CONFLICT DO NOTHING : sécurisé si le profil existe déjà.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER          -- exécuté en tant que owner (postgres), bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'convoyeur')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recrée le trigger (DROP IF EXISTS pour idempotence)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
