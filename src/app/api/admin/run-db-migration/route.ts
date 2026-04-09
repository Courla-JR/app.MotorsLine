/**
 * GET /api/admin/run-db-migration
 * Returns the SQL that must be executed in Supabase SQL Editor to unblock the app.
 * Requires admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const MIGRATION_SQL = `
-- ─── 1. vehicle_image_url column ────────────────────────────────────────────
ALTER TABLE missions ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT;

-- ─── 2. vehicle-images Storage bucket (public read) ─────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- ─── 3. invoices Storage bucket RLS policies ─────────────────────────────────
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can read invoices"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'invoices');

-- ─── 4. invoices table RLS ───────────────────────────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_insert_authenticated'
  ) THEN
    CREATE POLICY "invoices_insert_authenticated"
    ON invoices FOR INSERT TO authenticated
    WITH CHECK (true);
  END IF;
END $$;
`.trim();

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Probe which steps are already applied
  const checks: Record<string, boolean> = {};

  // Check vehicle_image_url column
  const { error: colErr } = await supabase.from("missions").select("vehicle_image_url").limit(1);
  checks["missions.vehicle_image_url"] = !colErr;

  return NextResponse.json({
    message: "Exécutez le SQL ci-dessous dans Supabase Dashboard → SQL Editor",
    checks,
    sql: MIGRATION_SQL,
  });
}
