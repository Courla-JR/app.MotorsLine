import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendStatusChangeEmail,
  sendDeliveryRecapEmail,
} from "@/lib/email";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept both camelCase and snake_case keys
  const missionId  = (body.missionId  ?? body.mission_id)  as string | undefined;
  const newStatus  = (body.newStatus  ?? body.new_status)  as string | undefined;
  const oldStatus  = (body.oldStatus  ?? body.old_status)  as string | undefined;

  console.log("[status-notification] received:", { missionId, oldStatus, newStatus });

  if (!missionId || !newStatus) {
    console.warn("[status-notification] missing missionId or newStatus — body:", body);
    return NextResponse.json({ error: "missing missionId or newStatus" }, { status: 400 });
  }

  if (oldStatus && oldStatus === newStatus) {
    console.log("[status-notification] status unchanged, skipping");
    return NextResponse.json({ ok: true, skipped: "status unchanged" });
  }

  // ── 1. Fetch mission ──────────────────────────────────────────────────────
  const { data: mission, error: missionError } = await serviceSupabase
    .from("missions")
    .select("id, vehicle_brand, vehicle_model, vehicle_plate, pickup_address, delivery_address, distance_km, duration, delivery_date, price, service_level, client_id")
    .eq("id", missionId)
    .single();

  if (missionError || !mission) {
    console.error("[status-notification] mission fetch error:", missionError?.message ?? "not found");
    return NextResponse.json({ error: missionError?.message ?? "Mission not found" }, { status: 404 });
  }

  console.log("[status-notification] mission found:", mission.id, "client_id:", mission.client_id);

  // ── 2. Fetch client email directly (more reliable than FK join) ───────────
  let clientEmail: string | null = null;

  if (mission.client_id) {
    const { data: client, error: clientError } = await serviceSupabase
      .from("clients")
      .select("email, user_id")
      .eq("id", mission.client_id)
      .single();

    if (clientError) {
      console.error("[status-notification] client fetch error:", clientError.message);
    } else {
      clientEmail = client?.email ?? null;

      // Check notifications preference
      if (client?.user_id) {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("notifications_email")
          .eq("id", client.user_id)
          .single();

        if (profile?.notifications_email === false) {
          console.log("[status-notification] notifications disabled for user_id:", client.user_id, "— skipping");
          return NextResponse.json({ ok: true, skipped: "notifications disabled" });
        }
      }
    }
  }

  console.log("[status-notification] client email resolved:", clientEmail);

  if (!clientEmail) {
    console.warn("[status-notification] no client email found for client_id:", mission.client_id, "— skipping");
    return NextResponse.json({ ok: true, skipped: "no client email" });
  }

  // ── 3. Send the appropriate email ─────────────────────────────────────────
  if (newStatus === "terminee") {
    const { data: photos } = await serviceSupabase
      .from("mission_photos")
      .select("photo_url, type")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });

    const beforeUrls = (photos ?? []).filter((p: { type: string }) => p.type === "before").map((p: { photo_url: string }) => p.photo_url);
    const afterUrls  = (photos ?? []).filter((p: { type: string }) => p.type === "after").map((p: { photo_url: string }) => p.photo_url);

    console.log("[status-notification] sending delivery recap to:", clientEmail);

    const { error: emailError } = await sendDeliveryRecapEmail({
      to:              clientEmail,
      vehicleBrand:    mission.vehicle_brand,
      vehicleModel:    mission.vehicle_model,
      vehiclePlate:    mission.vehicle_plate,
      pickupAddress:   mission.pickup_address,
      deliveryAddress: mission.delivery_address,
      distance:        mission.distance_km ?? null,
      duration:        mission.duration ?? null,
      deliveryDate:    mission.delivery_date ?? null,
      price:           mission.price ?? null,
      serviceLevel:    mission.service_level ?? null,
      missionId,
      beforePhotoUrls: beforeUrls,
      afterPhotoUrls:  afterUrls,
    });

    if (emailError) {
      console.error("[status-notification] delivery recap email error:", emailError);
      return NextResponse.json({ error: String(emailError) }, { status: 500 });
    }

    console.log("[status-notification] delivery recap email sent OK to:", clientEmail);
  } else {
    console.log("[status-notification] sending status change email to:", clientEmail, oldStatus, "→", newStatus);

    const { error: emailError } = await sendStatusChangeEmail({
      to:           clientEmail,
      vehicleBrand: mission.vehicle_brand,
      vehicleModel: mission.vehicle_model,
      vehiclePlate: mission.vehicle_plate,
      oldStatus:    oldStatus ?? "a_faire",
      newStatus,
      missionId,
    });

    if (emailError) {
      console.error("[status-notification] status change email error:", emailError);
      return NextResponse.json({ error: String(emailError) }, { status: 500 });
    }

    console.log("[status-notification] status change email sent OK to:", clientEmail);
  }

  return NextResponse.json({ ok: true, sentTo: clientEmail, newStatus });
}
