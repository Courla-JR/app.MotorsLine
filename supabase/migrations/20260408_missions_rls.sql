-- DELETE missions : admin uniquement
CREATE POLICY "missions_delete_admin"
  ON public.missions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT missions : tous les utilisateurs authentifiés
-- (convoyeur crée pour lui-même, client crée pour son compte, admin crée pour n'importe qui)
CREATE POLICY "missions_insert_authenticated"
  ON public.missions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
