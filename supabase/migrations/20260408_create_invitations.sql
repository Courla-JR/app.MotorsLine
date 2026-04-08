-- Table invitations : tokens d'invitation client à usage unique
CREATE TABLE IF NOT EXISTS public.invitations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  token      UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS : seuls les admins (via service role / API route) peuvent insérer
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour valider un token (page /client/register)
CREATE POLICY "invitations_select_by_token"
  ON public.invitations
  FOR SELECT
  USING (true);

-- Mise à jour réservée aux appels authentifiés (marquer used=true)
CREATE POLICY "invitations_update_authenticated"
  ON public.invitations
  FOR UPDATE
  USING (auth.role() = 'authenticated');
