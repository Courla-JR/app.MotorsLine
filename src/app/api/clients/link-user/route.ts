import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/clients/link-user
 * Body: { user_id: string, email: string }
 *
 * Links a clients row to its auth user by email match.
 * Uses service role to bypass RLS (needed at signup when user_id is still NULL).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, email } = body;
  if (!user_id || !email) {
    return NextResponse.json({ error: "missing user_id or email" }, { status: 400 });
  }

  const { error } = await serviceSupabase
    .from("clients")
    .update({ user_id })
    .ilike("email", email)
    .is("user_id", null);

  if (error) {
    console.error("[link-user] update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
