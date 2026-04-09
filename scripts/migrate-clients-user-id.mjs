/**
 * One-time migration: adds user_id column to clients table and backfills.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=yourpassword node scripts/migrate-clients-user-id.mjs
 *
 * Your DB password is in: Supabase Dashboard → Project Settings → Database → Database password
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

  // 1. Add column
  await client.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;
  `);
  console.log("✅  Column user_id added (or already existed)");

  // 2. Backfill existing clients via email match
  const { rowCount } = await client.query(`
    UPDATE clients
    SET user_id = p.id
    FROM profiles p
    WHERE lower(clients.email) = lower(p.email)
      AND p.role = 'client'
      AND clients.user_id IS NULL;
  `);
  console.log(`✅  ${rowCount} client(s) linked to their auth user`);

  // 3. Create index
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  `);
  console.log("✅  Index created");

  await client.query("COMMIT");
  console.log("🎉  Migration complete!");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
