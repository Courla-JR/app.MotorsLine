/**
 * DELETE /api/billing/delete-invoice
 * Server-side invoice deletion using service role key — bypasses table & storage RLS.
 * Body: { id: string, file_url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();

  // Auth check with anon key
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

  const body = await request.json();
  const { id, file_url } = body;

  if (!id) {
    return NextResponse.json({ error: "ID de facture manquant" }, { status: 400 });
  }

  // Use service role key to bypass RLS
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

  // Delete file from Storage if a URL is provided
  if (file_url) {
    try {
      const url = new URL(file_url);
      // Path after /storage/v1/object/public/invoices/
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/invoices\/(.+)/);
      if (pathMatch) {
        await supabaseAdmin.storage.from("invoices").remove([pathMatch[1]]);
      }
    } catch {
      // Non-blocking: if file deletion fails, still delete the DB row
    }
  }

  // Delete the invoice row
  const { error } = await supabaseAdmin.from("invoices").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
