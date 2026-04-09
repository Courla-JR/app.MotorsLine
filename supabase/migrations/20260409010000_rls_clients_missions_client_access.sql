-- ── SELECT policy : clients (own record) ──────────────────────────────────
-- Un client peut lire sa propre entrée via user_id = auth.uid()
CREATE POLICY "clients_select_own"
  ON public.clients
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin peut lire tous les clients
CREATE POLICY "clients_select_admin"
  ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE : un client peut mettre à jour sa propre entrée (pour user_id backfill)
CREATE POLICY "clients_update_own"
  ON public.clients
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin peut mettre à jour tous les clients
CREATE POLICY "clients_update_admin"
  ON public.clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT : seul un admin peut créer des clients (invitation)
CREATE POLICY "clients_insert_admin"
  ON public.clients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── SELECT policy : missions (client voit ses propres missions) ────────────
CREATE POLICY "missions_select_client_own"
  ON public.missions
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Admin et convoyeur peuvent voir toutes les missions
CREATE POLICY "missions_select_admin_convoyeur"
  ON public.missions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'convoyeur')
    )
  );

-- UPDATE : admin peut modifier toutes les missions
CREATE POLICY "missions_update_admin"
  ON public.missions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
