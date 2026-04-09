/**
 * GET /api/billing/download-invoice?invoice_id=xxx
 * Generates a 60-second signed URL for a private invoice file.
 * Access rules:
 *   - admin / convoyeur → all invoices
 *   - client → only invoices where client_id matches their clients row
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const invoice_id = request.nextUrl.searchParams.get("invoice_id");
  if (!invoice_id) {
    return NextResponse.json({ error: "Paramètre invoice_id manquant" }, { status: 400 });
  }

  const cookieStore = await cookies();

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

  const isStaff = profile && ["admin", "convoyeur"].includes(profile.role);

  // Service role client — used for storage signed URL generation
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

  // Fetch the invoice row
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("id, client_id, file_url")
    .eq("id", invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // If caller is not staff, verify the invoice belongs to their client account
  if (!isStaff) {
    const { data: clientRow } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow || clientRow.id !== invoice.client_id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  // Extract the storage path from the stored URL
  // Stored URLs look like: https://<project>.supabase.co/storage/v1/object/public/invoices/<path>
  // or for private buckets:  .../object/invoices/<path>
  const fileUrl = invoice.file_url as string;
  const pathMatch =
    fileUrl.match(/\/storage\/v1\/object\/(?:public\/)?invoices\/(.+)/) ??
    fileUrl.match(/\/object\/(?:public\/)?invoices\/(.+)/);

  if (!pathMatch) {
    return NextResponse.json({ error: "Chemin fichier invalide" }, { status: 500 });
  }

  const filePath = decodeURIComponent(pathMatch[1]);

  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from("invoices")
    .createSignedUrl(filePath, 60);

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: signedError?.message ?? "Impossible de générer l'URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedData.signedUrl });
}
