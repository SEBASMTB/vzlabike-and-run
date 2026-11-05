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

    const product = await db.product.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, slug: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener producto" },
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

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        priceBs: body.priceBs,
        imageUrl: body.imageUrl,
        images: body.images,
        sizes: body.sizes,
        color: body.color,
        stock: body.stock,
        active: body.active,
        eventId: body.eventId || null,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar producto" },
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

    await db.productOrder.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
