import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Caller auth check (anon client)
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Admin client with service role (bypasses RLS, can delete auth users)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { client_id } = body as { client_id: string };

  if (!client_id) {
    return NextResponse.json({ error: "client_id requis" }, { status: 400 });
  }

  // 1. Fetch client to get email
  const { data: clientRow } = await adminClient
    .from("clients")
    .select("id, email")
    .eq("id", client_id)
    .single();

  const email = clientRow?.email ?? null;

  // 2. Find auth user by email to get their UUID
  let authUserId: string | null = null;
  if (email) {
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const match = authUsers?.users?.find((u: { email?: string; id: string }) => u.email === email);
    authUserId = match?.id ?? null;
  }

  // 3. Delete profile
  if (authUserId) {
    await adminClient.from("profiles").delete().eq("id", authUserId);
  }

  // 4. Delete invitations
  if (email) {
    await adminClient.from("invitations").delete().eq("email", email);
  }

  // 5. Delete client record
  await adminClient.from("clients").delete().eq("id", client_id);

  // 6. Delete auth user (removes from auth.users completely)
  if (authUserId) {
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(authUserId);
    if (deleteUserError) {
      console.error("[delete-user] auth.admin.deleteUser error:", deleteUserError.message);
    }
  }

  return NextResponse.json({ success: true });
}
