/**
 * POST /api/billing/create-invoice
 * Server-side invoice insert using service role key — bypasses table RLS.
 * The client-side Supabase insert would fail with "violates row-level security"
 * if the invoices table policies haven't been applied. This route is the robust fix.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Auth check with anon key (to verify the caller is logged in)
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "convoyeur"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Parse body
  const body = await request.json();
  const { client_id, amount, date, file_url, file_name, mission_id } = body;

  if (!client_id || !amount || !date || !file_url) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  // Insert with service role key (bypasses RLS)
  const supabaseAdmin = createServerClient(
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

  const { error } = await supabaseAdmin.from("invoices").insert({
    client_id,
    amount: parseFloat(String(amount)),
    date,
    file_url,
    file_name: file_name ?? null,
    mission_id: mission_id ?? null,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
