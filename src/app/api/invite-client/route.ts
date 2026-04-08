import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendInvitationEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();
  const { company_name, contact_name, email, phone } = body;

  if (!company_name || !email) {
    return NextResponse.json(
      { error: "company_name et email sont requis" },
      { status: 400 }
    );
  }

  // Create client record
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ company_name, contact_name: contact_name ?? null, email, phone: phone ?? null })
    .select("id")
    .single();

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  // Create invitation token
  const token = randomUUID();
  const { error: inviteError } = await supabase
    .from("invitations")
    .insert({ email, token });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // Build invite URL from the incoming request origin
  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/client/register?token=${token}`;

  await sendInvitationEmail({ email, company_name, inviteUrl });

  return NextResponse.json({ success: true, client_id: client.id });
}
