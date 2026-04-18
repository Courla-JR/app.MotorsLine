import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMissionCreatedEmail, sendAdminMissionNotificationEmail, MissionEmailData } from "@/lib/email";

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
    .select("user_id, company_name, contact_name")
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
  console.log("[send-mission-email] client email sent to", body.to);

  // ── Admin notification ──────────────────────────────────
  try {
    const { data: adminProfile } = await serviceSupabase
      .from("profiles")
      .select("id, notifications_email")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (!adminProfile) {
      console.log("[send-mission-email] no admin profile found — skipping admin notification");
    } else {
      console.log("[send-mission-email] admin found:", adminProfile.id);

      if (adminProfile.notifications_email === false) {
        console.log("[send-mission-email] admin notifications_email=false — skipping admin notification");
      } else {
        const { data: adminUser } = await serviceSupabase.auth.admin.getUserById(adminProfile.id);
        const adminEmail = adminUser?.user?.email;

        if (!adminEmail) {
          console.log("[send-mission-email] admin email not found — skipping admin notification");
        } else {
          console.log("[send-mission-email] sending admin notification to", adminEmail);
          const { error: adminError } = await sendAdminMissionNotificationEmail({
            adminEmail,
            missionId: body.missionId ?? "",
            clientName: (client as { contact_name?: string | null } | null)?.contact_name ?? null,
            clientCompany: (client as { company_name?: string | null } | null)?.company_name ?? null,
            vehicleBrand: body.vehicleBrand,
            vehicleModel: body.vehicleModel,
            vehiclePlate: body.vehiclePlate,
            pickupAddress: body.pickupAddress,
            deliveryAddress: body.deliveryAddress,
            distance: body.distance,
            duration: body.duration,
            serviceLevel: body.serviceLevel,
            price: body.price,
            pickupDate: body.pickupDate,
          });
          if (adminError) {
            console.error("[send-mission-email] admin email failed:", adminError);
          } else {
            console.log("[send-mission-email] admin notification sent successfully");
          }
        }
      }
    }
  } catch (err) {
    console.error("[send-mission-email] unexpected error during admin notification:", err);
  }

  return NextResponse.json({ ok: true });
}
