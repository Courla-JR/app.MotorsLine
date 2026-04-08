import { NextRequest, NextResponse } from "next/server";
import { sendMissionCreatedEmail, MissionEmailData } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body: MissionEmailData = await request.json();

  if (!body.to || !body.vehicleBrand) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await sendMissionCreatedEmail(body);
  return NextResponse.json({ ok: true });
}
