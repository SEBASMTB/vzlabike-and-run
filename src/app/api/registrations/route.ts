import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const registrations = await db.registration.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(registrations);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener inscripciones" },
      { status: 500 }
    );
  }
}
