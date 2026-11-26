import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/runners/lookup?cedula=V-12345678
 *
 * Perfil único del atleta (tabla Runner) para auto-completar el formulario
 * de inscripción: si el corredor ya se inscribió antes, sus datos se cargan
 * solos y solo debe actualizar lo que haya cambiado (teléfono, ciudad, etc.).
 *
 * - Búsqueda exacta por cédula; si no hay coincidencia intenta por el
 *   sufijo numérico (ej. "12345678" encuentra "V-12345678").
 * - Rate-limited (API general) porque devuelve datos personales.
 * - Devuelve solo los campos que el formulario necesita; nunca ficha médica.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(request, RATE_LIMITS.general);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const cedulaParam = (searchParams.get("cedula") || "").trim();
    if (cedulaParam.length < 4) {
      return NextResponse.json({ found: false });
    }

    const normalized = cedulaParam.toUpperCase();
    const digits = normalized.replace(/\D/g, "");

    let runner = await db.runner.findUnique({
      where: { cedula: normalized },
    });

    if (!runner && digits.length >= 4) {
      runner = await db.runner.findFirst({
        where: { cedula: { endsWith: digits } },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!runner) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      runner: {
        cedula: runner.cedula,
        nombres: runner.nombres,
        apellidos: runner.apellidos,
        fechaNacimiento: runner.fechaNacimiento, // ISO
        genero: runner.genero,
        email: runner.email,
        telefono: runner.telefono,
        estado: runner.estado,
        ciudad: runner.ciudad,
        team: runner.team,
        tallaFranela: runner.tallaFranela,
        contactoEmergenciaNombre: runner.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: runner.contactoEmergenciaTelefono,
        contactoEmergenciaParentesco: runner.contactoEmergenciaParentesco,
      },
    });
  } catch (err) {
    console.error("[API runners/lookup] Error:", err);
    return NextResponse.json(
      { error: "Error al buscar el corredor" },
      { status: 500 }
    );
  }
}
