import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 5 orders per 60s per IP
    const limit = rateLimit(request, RATE_LIMITS.productOrder);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();

    const {
      firstName, lastName, email, phone, idNumber,
      size, color, quantity, paymentMethod, paymentRef, notes,
    } = body;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (nombre, apellido, email, teléfono)" },
        { status: 400 }
      );
    }

    // Get product info
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const qty = quantity || 1;
    const totalPrice = product.price * qty;
    const totalPriceBs = product.priceBs * qty;

    const order = await db.productOrder.create({
      data: {
        productId,
        firstName,
        lastName,
        email,
        phone,
        idNumber: idNumber || "",
        size: size || "",
        color: color || "",
        quantity: qty,
        totalPrice,
        totalPriceBs,
        paymentMethod: paymentMethod || "",
        paymentRef: paymentRef || "",
        status: "pending",
        notes: notes || "",
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Error creating product order:", err);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}
