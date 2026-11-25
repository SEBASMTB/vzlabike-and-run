import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/events/[slug]/mi-inscripcion?cedula=V-12345678
 *
 * Consulta pública y SEGURA del estado de una inscripción (para que el
 * corredor sepa si fue aprobado, con qué dorsal y qué caja le toca retirar).
 *
 * - Solo acepta la cédula del propio atleta (rate-limited por IP).
 * - Devuelve el MÍNIMO de datos: nombre, categoría, estado, dorsal y caja.
 *   Si fue RECHAZADA incluye el motivo para que el corredor pueda corregir
 *   o volver a reportar su pago (es su propio dato, nunca PII de terceros).
 * - NUNCA expone email, teléfono, fecha de nacimiento, contacto de
 *   emergencia ni referencia de pago.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const limit = rateLimit(request, {
      windowMs: 60,
      maxRequests: 20,
      keyPrefix: "mi-inscripcion",
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Espera unos segundos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const cedula = (searchParams.get("cedula") || "").toUpperCase().trim();

    if (!cedula || cedula.length < 5) {
      return NextResponse.json(
        { error: "Ingresa tu cédula de identidad" },
        { status: 400 }
      );
    }

    const event = await db.event.findUnique({
      where: { slug },
      select: { id: true, title: true },
    });
    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const reg = await db.registration.findFirst({
      where: { eventId: event.id, idNumber: cedula },
      orderBy: { createdAt: "desc" },
      select: {
        firstName: true,
        lastName: true,
        category: true,
        categoryId: true,
        status: true,
        bibNumber: true,
        bibBoxLabel: true,
        shirtSize: true,
        rejectReason: true,
      },
    });

    if (!reg) {
      return NextResponse.json({
        found: false,
        message:
          "No encontramos una inscripción con esa cédula en este evento.",
      });
    }

    // Nombre de categoría real desde BD si aplica
    let categoryName = reg.category || "";
    if (reg.categoryId) {
      try {
        const cat = await db.category.findUnique({
          where: { id: reg.categoryId },
          select: { name: true },
        });
        if (cat) categoryName = cat.name;
      } catch {
        // snapshot legacy
      }
    }

    const status = String(reg.status || "").toUpperCase();

    return NextResponse.json({
      found: true,
      firstName: reg.firstName,
      lastName: reg.lastName,
      category: categoryName,
      status: status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "PENDING",
      bibNumber: status === "APPROVED" ? reg.bibNumber : null,
      bibBoxLabel: status === "APPROVED" ? reg.bibBoxLabel || null : null,
      shirtSize: reg.shirtSize || null,
      rejectReason: status === "REJECTED" ? reg.rejectReason || null : null,
    });
  } catch (err) {
    console.error("[API mi-inscripcion] Error:", err);
    return NextResponse.json(
      { error: "Error al consultar la inscripción" },
      { status: 500 }
    );
  }
}
