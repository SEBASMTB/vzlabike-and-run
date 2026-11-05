import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (eventId) where.eventId = eventId;
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;

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

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      name, description, price, priceBs, imageUrl, images,
      sizes, color, stock, active, eventId, sortOrder,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        description: description || "",
        price: price || 0,
        priceBs: priceBs || 0,
        imageUrl: imageUrl || "",
        images: images || "[]",
        sizes: sizes || "[]",
        color: color || "",
        stock: stock || 0,
        active: active !== false,
        eventId: eventId || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("Error creating product:", err);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
