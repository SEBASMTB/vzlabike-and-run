import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * Gestión de categorías de un evento — FUENTE ÚNICA: modelo Prisma `Category`.
 *
 * Las categorías que se creen aquí son exactamente las que consume el
 * endpoint público /api/events/[slug]/categories y el wizard de inscripción.
 */

// GET - Listar categorías del evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;

    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const categories = await db.category.findMany({
      where: { eventId: id },
      orderBy: [{ gender: "asc" }, { minAge: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error("[API admin categories] GET error:", err);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// POST - Crear una categoría
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      gender = "",
      minAge = 0,
      maxAge = 999,
      distanceKm = null,
      price,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la categoría es requerido" },
        { status: 400 }
      );
    }

    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const created = await db.category.create({
      data: {
        eventId: id,
        name,
        minAge: Number(minAge) || 0,
        maxAge: Number(maxAge) || 999,
        gender: gender || "MIXTO",
        distanceKm: distanceKm != null ? Number(distanceKm) : null,
        price: price != null ? Number(price) : event.price || 0,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[API admin categories] POST error:", err);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una categoría (body.categoryId + campos a cambiar)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id: eventId } = await params;
    const body = await request.json();
    const { categoryId, name, gender, minAge, maxAge, distanceKm, price } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId es requerido" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (gender !== undefined) data.gender = gender || "MIXTO";
    if (minAge !== undefined) data.minAge = Number(minAge) || 0;
    if (maxAge !== undefined) data.maxAge = Number(maxAge) || 999;
    if (distanceKm !== undefined)
      data.distanceKm = distanceKm != null ? Number(distanceKm) : null;
    if (price !== undefined) data.price = Number(price) || 0;

    await db.category.updateMany({
      where: { id: categoryId, eventId },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API admin categories] PUT error:", err);
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una categoría (?categoryId=)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId es requerido" },
        { status: 400 }
      );
    }

    await db.category.deleteMany({
      where: { id: categoryId, eventId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API admin categories] DELETE error:", err);
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
