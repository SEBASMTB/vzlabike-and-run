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
    const body = await request.json();

    const event = await db.event.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        location: body.location,
        distance: body.distance,
        sportType: body.sportType,
        imageUrl: body.imageUrl,
        bannerImage: body.bannerImage,
        bannerHorizontalUrl: body.bannerHorizontalUrl,
        bannerVerticalUrl: body.bannerVerticalUrl,
        hasShirtOption: body.hasShirtOption,
        shirtPrice: body.shirtPrice,
        shirtImage: body.shirtImage,
        kitInfoDetails: body.kitInfoDetails,
        price: body.price,
        priceBs: body.priceBs,
        status: body.status,
        maxParticipants: body.maxParticipants,
        featured: body.featured,
        organizer: body.organizer,
        prizes: body.prizes,
        prizesImages: body.prizesImages,
        rules: body.rules,
        rulesFile: body.rulesFile,
        kitInfo: body.kitInfo,
        sponsors: body.sponsors,
        sponsorsLogos: body.sponsorsLogos,
        categories: body.categories,
        ageCalcMode: body.ageCalcMode,
        categoryInterval: body.categoryInterval,
        hasShirt: body.hasShirt,
        requiresFederationLicense: body.requiresFederationLicense,
      },
    });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar evento" },
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

    // Use raw SQL to avoid Prisma type mismatch issues
    // Delete registrations first (foreign key constraint)
    await db.$executeRawUnsafe(
      `DELETE FROM Registration WHERE eventId = ?`,
      id
    );

    // Delete categories for this event
    try {
      await db.$executeRawUnsafe(
        `DELETE FROM Category WHERE eventId = ?`,
        id
      );
    } catch {}

    // Then delete the event
    await db.$executeRawUnsafe(
      `DELETE FROM Event WHERE id = ?`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar evento", detail: String(error).substring(0, 200) },
      { status: 500 }
    );
  }
}
