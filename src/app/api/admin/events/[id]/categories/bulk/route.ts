import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/admin/events/[id]/categories/bulk
 *
 * Bulk create categories for an event using the Category Prisma model.
 * Deletes existing categories and creates all new ones in a transaction.
 *
 * Body: {
 *   categories: Array<{
 *     name: string;
 *     minAge: number;
 *     maxAge: number;
 *     gender: string;  // M, F, MIXTO
 *     distanceKm?: number;
 *     price?: number;
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

    // Delete existing categories and create new ones in a transaction
    const result = await db.$transaction(async (tx) => {
      // Delete existing categories for this event
      await tx.category.deleteMany({
        where: { eventId },
      });

      // Create all new categories
      const created = await tx.category.createMany({
        data: categories.map((cat: {
          name: string;
          minAge: number;
          maxAge: number;
          gender: string;
          distanceKm?: number | null;
          price?: number | null;
        }) => ({
          eventId,
          name: cat.name,
          minAge: cat.minAge,
          maxAge: cat.maxAge,
          gender: cat.gender || "M",
          distanceKm: cat.distanceKm ?? null,
          price: cat.price ?? event.price ?? 0,
        })),
      });

      // Fetch back the created categories
      const newCategories = await tx.category.findMany({
        where: { eventId },
        orderBy: [{ gender: "asc" }, { minAge: "asc" }],
      });

      return { count: created.count, categories: newCategories };
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
