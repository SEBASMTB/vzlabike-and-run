import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const where: Record<string, unknown> = { active: true };
    if (eventId) where.eventId = eventId;

    const products = await db.product.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        event: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
