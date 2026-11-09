import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
        categoryList: {
          orderBy: [{ gender: 'asc' }, { minAge: 'asc' }],
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...event,
      registrationCount: event._count.registrations,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener evento" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const safeId = id.replace(/'/g, "''");
    const body = await request.json();

    // Use raw SQL to avoid Prisma type mismatch issues
    // Build SET clause dynamically
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      title: "title",
      slug: "slug",
      description: "description",
      location: "location",
      distance: "distance",
      sportType: "sportType",
      imageUrl: "imageUrl",
      bannerImage: "bannerImage",
      bannerHorizontalUrl: "bannerHorizontalUrl",
      bannerVerticalUrl: "bannerVerticalUrl",
      hasShirtOption: "hasShirtOption",
      shirtImage: "shirtImage",
      kitInfoDetails: "kitInfoDetails",
      price: "price",
      priceBs: "priceBs",
      status: "status",
      maxParticipants: "maxParticipants",
      featured: "featured",
      organizer: "organizer",
      prizes: "prizes",
      prizesImages: "prizesImages",
      rules: "rules",
      rulesFile: "rulesFile",
      kitInfo: "kitInfo",
      sponsors: "sponsors",
      sponsorsLogos: "sponsorsLogos",
      categories: "categories",
      ageCalcMode: "ageCalcMode",
      categoryInterval: "categoryInterval",
      hasShirt: "hasShirt",
      requiresFederationLicense: "requiresFederationLicense",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        fields.push(`"${col}" = ?`);
        let val = body[key];
        // Convert booleans to 0/1 for SQLite
        if (typeof val === "boolean") val = val ? 1 : 0;
        // Convert numbers to ensure they're not BigInt
        if (typeof val === "number") val = Number(val);
        values.push(val);
      }
    }

    // Handle date separately
    if (body.date) {
      fields.push(`"date" = ?`);
      values.push(new Date(body.date).toISOString());
    }

    // Handle shirtPrice (ensure not null)
    if (body.shirtPrice !== undefined) {
      fields.push(`"shirtPrice" = ?`);
      values.push(body.shirtPrice != null ? Number(body.shirtPrice) : 0);
    }

    // Add updatedAt
    fields.push(`"updatedAt" = ?`);
    values.push(new Date().toISOString());

    if (fields.length > 0) {
      // Use string interpolation (libSQL adapter doesn't support params)
      const setClause = fields
        .map((f, i) => `${f.replace("?", `'${String(values[i]).replace(/'/g, "''")}'`)}`)
        .join(", ");
      await db.$executeRawUnsafe(
        `UPDATE Event SET ${setClause} WHERE id = '${safeId}'`
      );
    }

    // Return the updated event
    const updated = await db.$queryRawUnsafe(
      `SELECT * FROM Event WHERE id = '${safeId}'`
    );

    const result = Array.isArray(updated) && updated.length > 0 ? updated[0] : { id, success: true };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar evento", detail: String(error).substring(0, 300) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const safeId = id.replace(/'/g, "''");

    // Use raw SQL with string interpolation (libSQL adapter doesn't support params)
    await db.$executeRawUnsafe(
      `DELETE FROM Registration WHERE eventId = '${safeId}'`
    );

    try {
      await db.$executeRawUnsafe(
        `DELETE FROM Category WHERE eventId = '${safeId}'`
      );
    } catch {}

    await db.$executeRawUnsafe(
      `DELETE FROM Event WHERE id = '${safeId}'`
    );

    // Verify deletion
    const remaining = await db.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM Event WHERE id = '${safeId}'`
    ) as any[];

    if (Number(remaining[0]?.count || 0) > 0) {
      return NextResponse.json(
        { error: "No se pudo eliminar el evento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar evento", detail: String(error).substring(0, 200) },
      { status: 500 }
    );
  }
}
