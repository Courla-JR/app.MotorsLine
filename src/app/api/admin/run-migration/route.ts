/**
 * ONE-TIME migration route: adds user_id to clients table and backfills from profiles.
 * Call this endpoint ONCE after the ALTER TABLE has been applied to the database.
 * Delete this file after running.
 *
 * POST /api/admin/run-migration
 * Authorization: requires admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
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

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Step 1: Detect if user_id column exists
  const { error: detectError } = await supabase
    .from("clients")
    .select("user_id")
    .limit(1);

  if (detectError && detectError.message.includes("user_id")) {
    return NextResponse.json({
      error: "La colonne user_id n'existe pas encore dans la table clients.",
      action: "Exécutez d'abord dans le SQL Editor de Supabase :\nALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id uuid;\nCREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);",
    }, { status: 400 });
  }

  // Step 2: Get all client profiles
  const { data: clientProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client");

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  if (!clientProfiles || clientProfiles.length === 0) {
    return NextResponse.json({ message: "Aucun profil client trouvé.", updated: 0 });
  }

  // Step 3: For each client profile, find matching client via auth email
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  let updated = 0;
  const errors: string[] = [];

  for (const authUser of authUsers?.users ?? []) {
    // Only process users with client role
    const matchingProfile = clientProfiles.find((p) => p.id === authUser.id);
    if (!matchingProfile) continue;

    const email = authUser.email;
    if (!email) continue;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ user_id: authUser.id })
      .ilike("email", email)
      .is("user_id", null);

    if (updateError) {
      errors.push(`${email}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    message: `Migration terminée. ${updated} client(s) liés.`,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
