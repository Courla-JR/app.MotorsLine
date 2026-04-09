/**
 * Migration: adds user_id column + RLS policies for clients & missions.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=yourpassword node scripts/migrate-clients-user-id.mjs
 *
 * DB password: Supabase Dashboard → Project Settings → Database → Database password
 */

import pg from "pg";
const { Client } = pg;

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("❌  Set SUPABASE_DB_PASSWORD env var before running.");
  console.error("   Example: SUPABASE_DB_PASSWORD=yourpassword node scripts/migrate-clients-user-id.mjs");
  process.exit(1);
}

const client = new Client({
  host: "db.bqgnhczbeziixaaibldd.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("✅  Connected to Supabase PostgreSQL");

try {
  await client.query("BEGIN");

  // 1. Add user_id column (idempotent)
  await client.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;
  `);
  console.log("✅  Column user_id added (or already existed)");

  // 2. Backfill existing clients
  const { rowCount } = await client.query(`
    UPDATE clients
    SET user_id = p.id
    FROM profiles p
    WHERE lower(clients.email) = lower(p.email)
      AND p.role = 'client'
      AND clients.user_id IS NULL;
  `);
  console.log(`✅  ${rowCount} client(s) linked to their auth user`);

  // 3. Index
  await client.query(`CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);`);
  console.log("✅  Index created");

  // 4. RLS policies — clients table
  const clientPolicies = [
    ["clients_select_own", "clients_select_admin", "clients_update_own", "clients_update_admin", "clients_insert_admin"],
    `
    DROP POLICY IF EXISTS clients_select_own ON public.clients;
    DROP POLICY IF EXISTS clients_select_admin ON public.clients;
    DROP POLICY IF EXISTS clients_update_own ON public.clients;
    DROP POLICY IF EXISTS clients_update_admin ON public.clients;
    DROP POLICY IF EXISTS clients_insert_admin ON public.clients;

    CREATE POLICY clients_select_own ON public.clients
      FOR SELECT USING (user_id = auth.uid());

    CREATE POLICY clients_select_admin ON public.clients
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );

    CREATE POLICY clients_update_own ON public.clients
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    CREATE POLICY clients_update_admin ON public.clients
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );

    CREATE POLICY clients_insert_admin ON public.clients
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    `,
  ];
  await client.query(clientPolicies[1]);
  console.log("✅  RLS policies on clients applied");

  // 5. RLS policies — missions table
  await client.query(`
    DROP POLICY IF EXISTS missions_select_client_own ON public.missions;
    DROP POLICY IF EXISTS missions_select_admin_convoyeur ON public.missions;
    DROP POLICY IF EXISTS missions_update_admin ON public.missions;

    CREATE POLICY missions_select_client_own ON public.missions
      FOR SELECT USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
      );

    CREATE POLICY missions_select_admin_convoyeur ON public.missions
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'convoyeur'))
      );

    CREATE POLICY missions_update_admin ON public.missions
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  `);
  console.log("✅  RLS policies on missions applied");

  await client.query("COMMIT");
  console.log("🎉  All migrations complete!");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
