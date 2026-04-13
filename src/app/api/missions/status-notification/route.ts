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
  const body = await request.json();
  const { missionId, oldStatus, newStatus } = body as {
    missionId: string;
    oldStatus: string;
    newStatus: string;
  };

  console.log("[status-notification] received:", { missionId, oldStatus, newStatus });

  if (!missionId || !newStatus) {
    console.warn("[status-notification] missing missionId or newStatus");
    return NextResponse.json({ ok: true, skipped: "missing params" });
  }

  if (oldStatus && oldStatus === newStatus) {
    console.log("[status-notification] status unchanged, skipping");
    return NextResponse.json({ ok: true, skipped: "status unchanged" });
  }

  // Fetch mission with client email via foreign key join
  const { data: mission, error: missionError } = await serviceSupabase
    .from("missions")
    .select("*, clients(id, email, company_name)")
    .eq("id", missionId)
    .single();

  if (missionError) {
    console.error("[status-notification] mission fetch error:", missionError.message);
    return NextResponse.json({ error: missionError.message }, { status: 500 });
  }

  if (!mission) {
    console.error("[status-notification] mission not found:", missionId);
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  // Extract client email — handle both object and null
  const clientRecord = mission.clients as { email?: string; company_name?: string } | null;
  const clientEmail = clientRecord?.email ?? null;

  console.log("[status-notification] mission found:", {
    missionId,
    vehicle: `${mission.vehicle_brand} ${mission.vehicle_model}`,
    client_id: mission.client_id,
    clientEmail,
  });

  if (!clientEmail) {
    console.warn("[status-notification] no client email, skipping. client_id:", mission.client_id);
    return NextResponse.json({ ok: true, skipped: "no client email" });
  }

  if (newStatus === "terminee") {
    // Fetch photos for delivery recap
    const { data: photos } = await serviceSupabase
      .from("mission_photos")
      .select("photo_url, type")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });

    const beforeUrls = (photos ?? [])
      .filter((p: { type: string }) => p.type === "before")
      .map((p: { photo_url: string }) => p.photo_url);
    const afterUrls = (photos ?? [])
      .filter((p: { type: string }) => p.type === "after")
      .map((p: { photo_url: string }) => p.photo_url);

    console.log("[status-notification] sending delivery recap to:", clientEmail, "photos:", beforeUrls.length, "/", afterUrls.length);

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

  return NextResponse.json({ ok: true, sentTo: clientEmail });
}
