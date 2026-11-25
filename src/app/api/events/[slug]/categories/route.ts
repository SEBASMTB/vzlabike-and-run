import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCategoriesForSport } from "@/lib/categories";

/**
 * GET /api/events/[slug]/categories
 *
 * Fuente única de verdad: tabla `Category` (modelo Prisma) — las categorías
 * que el organizador define en el formulario del evento (bulk).
 *
 * Si el evento NO tiene categorías definidas en BD, se sirven automáticamente
 * las categorías estándar del deporte (lib/categories) para que la
 * inscripción nunca se bloquee. Esto cubre eventos creados antes de
 * configurar sus categorías.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await getDb();

    const event = await db.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        sportType: true,
        ageCalcMode: true,
        date: true,
        price: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // 1) Categorías definidas por el organizador (base de datos)
    const dbCategories = await db.category.findMany({
      where: { eventId: event.id },
      orderBy: [{ gender: "asc" }, { minAge: "asc" }],
    });

    let categories: Array<{
      id: string;
      name: string;
      gender: string;
      minAge: number;
      maxAge: number;
      price: number;
    }>;
    let source: "db" | "defaults";

    if (dbCategories.length > 0) {
      source = "db";
      categories = dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        // "MIXTO" → "" (mixto/abierto, compatible con cualquier género)
        gender: c.gender === "M" || c.gender === "F" ? c.gender : "",
        minAge: c.minAge,
        maxAge: c.maxAge,
        price: c.price,
      }));
    } else {
      // 2) Fallback: categorías estándar del deporte
      source = "defaults";
      const sportCats = getCategoriesForSport(event.sportType || "running");

      categories = (sportCats.length > 0
        ? sportCats
        : [
            // Última red: una categoría abierta por género (nunca bloquea)
            { value: "GENERAL-M", label: "General Varones", minAge: 0, maxAge: 999, gender: "M" },
            { value: "GENERAL-F", label: "General Damas", minAge: 0, maxAge: 999, gender: "F" },
          ]
      ).map((c) => ({
        id: c.value,
        name: c.label,
        gender: c.gender || "",
        minAge: c.minAge,
        maxAge: c.maxAge,
        price: event.price || 0,
      }));
    }

    return NextResponse.json({
      categories,
      ageCalcMode: event.ageCalcMode || "calendar_year",
      sportType: event.sportType,
      eventDate: event.date,
      source,
    });
  } catch (err) {
    console.error("[API categories] Error:", err);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}
