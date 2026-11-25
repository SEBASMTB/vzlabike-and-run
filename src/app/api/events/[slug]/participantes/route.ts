/**
 * GET /api/events/[slug]/participantes
 *
 * Lista pública de participantes inscritos de un evento (para publicar).
 * Devuelve SOLO datos aptos para publicación: dorsal, nombre, categoría,
 * equipo, estado/provincia, ciudad y estado de la inscripción.
 * Nunca expone cédula, email, teléfono ni datos de contacto de emergencia.
 *
 * Oculta las inscripciones REJECTED (no publicables) y ordena por dorsal.
 */

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await db.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        location: true,
        distance: true,
        maxParticipants: true,
        status: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Solo inscripciones publicables (pendientes y aprobadas)
    const regs = await db.registration.findMany({
      where: {
        eventId: event.id,
        status: { in: ["PENDING", "APPROVED", "pending", "approved", "confirmed"] },
      },
      select: {
        id: true,
        bibNumber: true,
        firstName: true,
        lastName: true,
        category: true,
        categoryId: true,
        team: true,
        club: true,
        estado: true,
        ciudad: true,
        status: true,
        createdAt: true,
      },
    });

    // Resolver nombres de categoría en BD en una sola consulta
    let catNames = new Map<string, string>();
    try {
      const cats = await db.category.findMany({
        where: { eventId: event.id },
        select: { id: true, name: true },
      });
      catNames = new Map(cats.map((c) => [c.id, c.name]));
    } catch {
      // fallback: usar el nombre legacy en texto
    }

    const statusLabel = (s: string): string => {
      const n = String(s || "").toUpperCase();
      if (n === "APPROVED" || n === "CONFIRMED") return "CONFIRMADO";
      return "PENDIENTE";
    };

    const participants = regs
      .map((r) => ({
        bib: r.bibNumber,
        firstName: r.firstName || "",
        lastName: r.lastName || "",
        category: (r.categoryId && catNames.get(r.categoryId)) || r.category || "",
        team: r.team || r.club || "",
        estado: r.estado || "",
        ciudad: r.ciudad || "",
        status: statusLabel(r.status),
        createdAt: r.createdAt,
      }))
      .sort((a, b) => {
        // Con dorsal primero (asc); sin dorsal al final por fecha de inscripción
        if (a.bib != null && b.bib != null) return a.bib - b.bib;
        if (a.bib != null) return -1;
        if (b.bib != null) return 1;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      })
      .map(({ createdAt: _createdAt, ...rest }) => rest);

    const confirmed = participants.filter((p) => p.status === "CONFIRMADO").length;

    return NextResponse.json(
      {
        event: {
          title: event.title,
          slug: event.slug,
          date: event.date,
          location: event.location,
          distance: event.distance,
          maxParticipants: event.maxParticipants,
          status: event.status,
        },
        stats: {
          total: participants.length,
          confirmed,
          pending: participants.length - confirmed,
          cupos: Math.max(0, event.maxParticipants - participants.length),
        },
        participants,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[API participantes] Error:", err);
    return NextResponse.json(
      { error: "Error al obtener la lista de participantes" },
      { status: 500 }
    );
  }
}
