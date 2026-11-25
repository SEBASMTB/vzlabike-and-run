import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Solo el evento (sin incluir la relación registrations completa para
    // evitar errores de tipos con imágenes base64); el conteo de inscritos
    // se obtiene en una consulta aparte y se expone como registrationCount
    // para que la página pública calcule los cupos disponibles reales.
    const event = await db.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    let registrationCount = 0;
    try {
      registrationCount = await db.registration.count({
        where: { eventId: event.id },
      });
    } catch {
      registrationCount = 0;
    }

    return NextResponse.json({ ...event, registrationCount });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener evento" },
      { status: 500 }
    );
  }
}
