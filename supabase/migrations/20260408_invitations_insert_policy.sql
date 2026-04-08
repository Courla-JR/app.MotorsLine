-- Policy INSERT : seuls les utilisateurs admin (profiles.role = 'admin') peuvent créer des invitations
CREATE POLICY "invitations_insert_admin"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
