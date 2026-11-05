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

    const order = await db.productOrder.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, imageUrl: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener pedido" },
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

    const order = await db.productOrder.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}
