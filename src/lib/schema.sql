-- ============================================================
-- Motors Line — Database Schema
-- ============================================================

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('convoyeur', 'client', 'admin');

CREATE TYPE mission_type AS ENUM ('transfer', 'delivery', 'concierge');

CREATE TYPE mission_status AS ENUM ('a_faire', 'en_cours', 'terminee', 'annulee');


-- ─────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'convoyeur',
  full_name   TEXT,
  phone       TEXT,
  company     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles: admin select all"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'convoyeur')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────
-- 2. CLIENTS
-- ─────────────────────────────────────────

CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Convoyeurs and admins can read all clients
CREATE POLICY "clients: select for convoyeur and admin"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('convoyeur', 'admin')
    )
  );

-- Only admins can insert/update/delete clients
CREATE POLICY "clients: admin insert"
  ON clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "clients: admin update"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "clients: admin delete"
  ON clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ─────────────────────────────────────────
-- 3. MISSIONS
-- ─────────────────────────────────────────

CREATE TABLE missions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  client_id        UUID REFERENCES clients (id) ON DELETE SET NULL,
  convoyeur_id     UUID REFERENCES profiles (id) ON DELETE SET NULL,

  -- Mission metadata
  type             mission_type NOT NULL DEFAULT 'transfer',
  status           mission_status NOT NULL DEFAULT 'a_faire',

  -- Vehicle
  vehicle_brand    TEXT NOT NULL,
  vehicle_model    TEXT NOT NULL,
  vehicle_plate    TEXT NOT NULL,
  vehicle_color    TEXT,
  vehicle_vin      TEXT,

  -- Route
  pickup_address   TEXT NOT NULL,
  pickup_date      TIMESTAMPTZ,
  delivery_address TEXT NOT NULL,
  delivery_date    TIMESTAMPTZ,

  -- Extra
  notes            TEXT,
  price            NUMERIC(10, 2),

  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Convoyeurs can see their own missions
CREATE POLICY "missions: convoyeur select own"
  ON missions FOR SELECT
  USING (
    convoyeur_id = auth.uid()
  );

-- Convoyeurs can update their own missions (status, notes)
CREATE POLICY "missions: convoyeur update own"
  ON missions FOR UPDATE
  USING (convoyeur_id = auth.uid());

-- Clients can see their own missions via profile matching
CREATE POLICY "missions: client select own"
  ON missions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN clients c ON c.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND c.id = missions.client_id
    )
  );

-- Admins can do everything
CREATE POLICY "missions: admin all"
  ON missions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins and convoyeurs can insert missions
CREATE POLICY "missions: insert for staff"
  ON missions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('convoyeur', 'admin')
    )
  );


-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

CREATE INDEX missions_client_id_idx     ON missions (client_id);
CREATE INDEX missions_convoyeur_id_idx  ON missions (convoyeur_id);
CREATE INDEX missions_status_idx        ON missions (status);
CREATE INDEX missions_pickup_date_idx   ON missions (pickup_date);
