-- ── DELETE policy : clients ───────────────────────────────────
CREATE POLICY "clients_delete_admin"
  ON public.clients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── DELETE policy : invitations ───────────────────────────────
CREATE POLICY "invitations_delete_admin"
  ON public.invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── RPC : supprime le profil auth via l'email ─────────────────
-- Nécessaire car profiles.id = auth.users.id, inaccessible côté client.
-- SECURITY DEFINER → exécutée en tant que postgres, bypass RLS.
CREATE OR REPLACE FUNCTION public.delete_profile_by_email(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = target_email
  );
END;
$$;

-- Seuls les utilisateurs authentifiés peuvent appeler cette fonction
REVOKE ALL ON FUNCTION public.delete_profile_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_profile_by_email(TEXT) TO authenticated;
