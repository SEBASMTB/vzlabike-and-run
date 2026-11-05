import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// GET - List all categories for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;

    // Verify event exists
    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const categories = await db.$queryRawUnsafe<
      Array<{
        id: string;
        eventId: string;
        name: string;
        code: string;
        discipline: string;
        gender: string;
        minAge: number;
        maxAge: number;
        profileType: string;
        sortOrder: number;
        active: number;
        extraFields: string;
        createdAt: string;
      }>
    >(
      `SELECT * FROM "EventCategory" WHERE "eventId" = ? ORDER BY "sortOrder" ASC, "name" ASC`,
      id
    );

    return NextResponse.json(
      categories.map((c) => ({
        ...c,
        extraFields: JSON.parse(c.extraFields || "[]"),
        active: c.active === 1,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// POST - Create a category for an event
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
      code,
      discipline = "",
      gender = "",
      minAge = 0,
      maxAge = 999,
      profileType = "",
      sortOrder = 0,
      extraFields = [],
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Nombre y código son requeridos" },
        { status: 400 }
      );
    }

    const catId = `ecat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    await db.$executeRawUnsafe(
      `INSERT INTO "EventCategory" ("id", "eventId", "name", "code", "discipline", "gender", "minAge", "maxAge", "profileType", "sortOrder", "active", "extraFields")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      catId,
      id,
      name,
      code,
      discipline,
      gender,
      minAge,
      maxAge,
      profileType,
      sortOrder,
      JSON.stringify(extraFields)
    );

    return NextResponse.json(
      {
        id: catId,
        eventId: id,
        name,
        code,
        discipline,
        gender,
        minAge,
        maxAge,
        profileType,
        sortOrder,
        active: true,
        extraFields,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}

// PUT - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id: eventId } = await params;
    const body = await request.json();

    const {
      categoryId,
      name,
      code,
      discipline,
      gender,
      minAge,
      maxAge,
      profileType,
      sortOrder,
      extraFields,
    } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId es requerido" },
        { status: 400 }
      );
    }

    const values: any[] = [];
    const sqlParts: string[] = [];

    if (name !== undefined) { sqlParts.push(`"name" = ?`); values.push(name); }
    if (code !== undefined) { sqlParts.push(`"code" = ?`); values.push(code); }
    if (discipline !== undefined) { sqlParts.push(`"discipline" = ?`); values.push(discipline); }
    if (gender !== undefined) { sqlParts.push(`"gender" = ?`); values.push(gender); }
    if (minAge !== undefined) { sqlParts.push(`"minAge" = ?`); values.push(minAge); }
    if (maxAge !== undefined) { sqlParts.push(`"maxAge" = ?`); values.push(maxAge); }
    if (profileType !== undefined) { sqlParts.push(`"profileType" = ?`); values.push(profileType); }
    if (sortOrder !== undefined) { sqlParts.push(`"sortOrder" = ?`); values.push(sortOrder); }
    if (extraFields !== undefined) { sqlParts.push(`"extraFields" = ?`); values.push(JSON.stringify(extraFields)); }

    values.push(categoryId, eventId);

    await db.$executeRawUnsafe(
      `UPDATE "EventCategory" SET ${sqlParts.join(", ")} WHERE "id" = ? AND "eventId" = ?`,
      ...values
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
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

    await db.$executeRawUnsafe(
      `DELETE FROM "EventCategory" WHERE "id" = ? AND "eventId" = ?`,
      categoryId,
      eventId
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id: eventId } = await params;
    const body = await request.json();

    const { categoryId, active } = body;

    if (!categoryId || active === undefined) {
      return NextResponse.json(
        { error: "categoryId y active son requeridos" },
        { status: 400 }
      );
    }

    await db.$executeRawUnsafe(
      `UPDATE "EventCategory" SET "active" = ? WHERE "id" = ? AND "eventId" = ?`,
      active ? 1 : 0,
      categoryId,
      eventId
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar estado de categoría" },
      { status: 500 }
    );
  }
}
