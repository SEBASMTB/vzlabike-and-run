import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/registrations — SOLO ADMIN (exige cookie admin_token).
 * Devuelve datos completos incl. contacto y referencia de pago: nunca
 * público. El listado público por evento es /api/events/[slug]/participantes.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

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
