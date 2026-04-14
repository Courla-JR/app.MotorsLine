import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMissionCreatedEmail, MissionEmailData } from "@/lib/email";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body: MissionEmailData = await request.json();

  if (!body.to || !body.vehicleBrand) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check recipient's notification preference
  const { data: client } = await serviceSupabase
    .from("clients")
    .select("user_id")
    .eq("email", body.to)
    .maybeSingle();

  if (client?.user_id) {
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("notifications_email")
      .eq("id", client.user_id)
      .single();

    if (profile?.notifications_email === false) {
      console.log("[send-mission-email] notifications disabled for", body.to, "— skipping");
      return NextResponse.json({ ok: true, skipped: "notifications disabled" });
    }
  }

  await sendMissionCreatedEmail(body);
  return NextResponse.json({ ok: true });
}
