import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * PATCH  /api/admin/payments/[id] — editar campos o marcar IGNORED/MATCHED
 * DELETE /api/admin/payments/[id] — eliminar el registro
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.paymentRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const data: Record<string, unknown> = { updatedAt: new Date() };
    const fields = [
      "method",
      "reference",
      "payerName",
      "payerPhone",
      "bankName",
      "notes",
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = String(body[f]).trim();
    }
    if (body.amount !== undefined) {
      data.amount = Number(body.amount) || 0;
    }
    if (body.currency !== undefined) {
      data.currency = body.currency === "USD" ? "USD" : "Bs";
    }
    if (body.eventId !== undefined) {
      data.eventId = body.eventId ? String(body.eventId) : null;
    }
    if (body.status !== undefined) {
      const status = String(body.status).toUpperCase();
      if (!["UNMATCHED", "MATCHED", "IGNORED"].includes(status)) {
        return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
      }
      data.status = status;
      if (status !== "MATCHED") {
        data.matchedRegistrationId = null;
        data.matchedAt = null;
      }
    }
    if (body.matchedRegistrationId !== undefined) {
      data.matchedRegistrationId = body.matchedRegistrationId || null;
      data.matchedAt = body.matchedRegistrationId ? new Date() : null;
    }

    const record = await db.paymentRecord.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch (err) {
    console.error("[API admin payments PATCH] Error:", err);
    return NextResponse.json(
      { error: "Error al actualizar el pago" },
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
    const existing = await db.paymentRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    await db.paymentRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("[API admin payments DELETE] Error:", err);
    return NextResponse.json(
      { error: "Error al eliminar el pago" },
      { status: 500 }
    );
  }
}
