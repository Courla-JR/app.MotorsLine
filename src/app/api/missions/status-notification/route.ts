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

  if (!missionId || !oldStatus || !newStatus || oldStatus === newStatus) {
    return NextResponse.json({ ok: true });
  }

  // Fetch mission + client email
  const { data: mission } = await serviceSupabase
    .from("missions")
    .select("*, clients(email, company_name)")
    .eq("id", missionId)
    .single();

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  const clientEmail: string | undefined = (mission.clients as { email?: string } | null)?.email;
  if (!clientEmail) {
    return NextResponse.json({ ok: true, skipped: "no client email" });
  }

  if (newStatus === "terminee") {
    // Fetch photos
    const { data: photos } = await serviceSupabase
      .from("mission_photos")
      .select("photo_url, type")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });

    const beforeUrls = (photos ?? []).filter((p: { type: string }) => p.type === "before").map((p: { photo_url: string }) => p.photo_url);
    const afterUrls  = (photos ?? []).filter((p: { type: string }) => p.type === "after").map((p: { photo_url: string }) => p.photo_url);

    await sendDeliveryRecapEmail({
      to:               clientEmail,
      vehicleBrand:     mission.vehicle_brand,
      vehicleModel:     mission.vehicle_model,
      vehiclePlate:     mission.vehicle_plate,
      pickupAddress:    mission.pickup_address,
      deliveryAddress:  mission.delivery_address,
      distance:         mission.distance_km ?? null,
      duration:         mission.duration ?? null,
      deliveryDate:     mission.delivery_date ?? null,
      price:            mission.price ?? null,
      serviceLevel:     mission.service_level ?? null,
      missionId,
      beforePhotoUrls:  beforeUrls,
      afterPhotoUrls:   afterUrls,
    });
  } else {
    await sendStatusChangeEmail({
      to:           clientEmail,
      vehicleBrand: mission.vehicle_brand,
      vehicleModel: mission.vehicle_model,
      vehiclePlate: mission.vehicle_plate,
      oldStatus,
      newStatus,
      missionId,
    });
  }

  return NextResponse.json({ ok: true });
}
