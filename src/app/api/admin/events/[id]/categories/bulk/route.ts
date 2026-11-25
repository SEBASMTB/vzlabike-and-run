import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/admin/events/[id]/categories/bulk
 *
 * Sync de categorías de un evento usando el modelo Prisma Category.
 *
 * UPSERT POR IDENTIDAD (name + gender + minAge + maxAge): las categorías que
 * ya existen se ACTUALIZAN conservando su ID — así las inscripciones que
 * apuntan a esas categorías (Registration.categoryId) NO se rompen al editar
 * el evento desde el panel. Solo se crean las nuevas y se eliminan las que
 * ya no vienen en el payload.
 *
 * Body: {
 *   categories: Array<{
 *     name: string;
 *     minAge: number;
 *     maxAge: number;
 *     gender: string;  // M, F, MIXTO
 *     distanceKm?: number;
 *     price?: number;
 *     bibStart?: number | null;  // Lote de dorsales: inicio (opcional)
 *     bibEnd?: number | null;    // Lote de dorsales: fin (opcional)
 *   }>
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id: eventId } = await params;
    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de categorías" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const cleanBib = (v: unknown): number | null =>
      v != null && Number.isFinite(Number(v)) && Number(v) > 0
        ? Number(v)
        : null;

    // Upsert por identidad dentro de una transacción
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.category.findMany({ where: { eventId } });
      const byIdentity = new Map(
        existing.map((c) => [
          `${(c.name || "").trim().toUpperCase()}|${c.gender}|${c.minAge}|${c.maxAge}`,
          c,
        ])
      );

      const keptIds = new Set<string>();
      let updatedCount = 0;
      let createdCount = 0;

      for (const cat of categories) {
        const key = `${String(cat.name || "").trim().toUpperCase()}|${cat.gender}|${cat.minAge}|${cat.maxAge}`;
        const match = byIdentity.get(key);

        const data = {
          name: cat.name,
          minAge: cat.minAge,
          maxAge: cat.maxAge,
          gender: cat.gender || "M",
          distanceKm: cat.distanceKm ?? null,
          price: cat.price ?? event.price ?? 0,
          bibStart: cleanBib(cat.bibStart),
          bibEnd: cleanBib(cat.bibEnd),
        };

        if (match) {
          // Conservar el ID: las inscripciones siguen apuntando aquí
          await tx.category.update({ where: { id: match.id }, data });
          keptIds.add(match.id);
          updatedCount++;
        } else {
          const created = await tx.category.create({
            data: { eventId, ...data },
          });
          keptIds.add(created.id);
          createdCount++;
        }
      }

      // Eliminar solo las categorías que ya NO vienen en el payload
      const removed = await tx.category.deleteMany({
        where: { eventId, id: { notIn: [...keptIds] } },
      });

      const newCategories = await tx.category.findMany({
        where: { eventId },
        orderBy: [{ gender: "asc" }, { minAge: "asc" }],
      });

      return {
        count: newCategories.length,
        updated: updatedCount,
        created: createdCount,
        removed: removed.count,
        categories: newCategories,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[API] Error in bulk category creation:", error);
    return NextResponse.json(
      { error: "Error al crear categorías" },
      { status: 500 }
    );
  }
}
