import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET  /api/admin/payments?status=&eventId=
 * POST /api/admin/payments
 *
 * Bandeja "Pagos sin Ficha" — conciliación bancaria del panel admin.
 * GET: lista pagos detectados en el banco sin inscripción asociada.
 * POST: anota en segundos una transferencia/pago móvil detectado.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const eventId = searchParams.get("eventId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (eventId) where.eventId = eventId;

    const records = await db.paymentRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Adjuntar título del evento y datos de la inscripción conciliada
    const eventIds = Array.from(
      new Set(records.map((r) => r.eventId).filter((v): v is string => !!v))
    );
    const events = eventIds.length
      ? await db.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, title: true },
        })
      : [];
    const eventMap = new Map(events.map((e) => [e.id, e.title]));

    const matchedIds = Array.from(
      new Set(
        records
          .map((r) => r.matchedRegistrationId)
          .filter((v): v is string => !!v)
      )
    );
    const matchedRegs = matchedIds.length
      ? await db.registration.findMany({
          where: { id: { in: matchedIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            idNumber: true,
            bibNumber: true,
            status: true,
          },
        })
      : [];
    const regMap = new Map(matchedRegs.map((r) => [r.id, r]));

    return NextResponse.json({
      payments: records.map((r) => ({
        ...r,
        eventTitle: r.eventId ? eventMap.get(r.eventId) || null : null,
        matchedRegistration: r.matchedRegistrationId
          ? regMap.get(r.matchedRegistrationId) || null
          : null,
      })),
      total: records.length,
    });
  } catch (err) {
    console.error("[API admin payments GET] Error:", err);
    return NextResponse.json(
      { error: "Error al obtener pagos sin ficha" },
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
      eventId,
      method,
      reference,
      amount,
      currency,
      payerName,
      payerPhone,
      bankName,
      notes,
    } = body;

    if (!reference && !payerName) {
      return NextResponse.json(
        { error: "La referencia o el titular son obligatorios" },
        { status: 400 }
      );
    }

    const record = await db.paymentRecord.create({
      data: {
        eventId: eventId ? String(eventId) : null,
        method: method ? String(method) : "",
        reference: reference ? String(reference).trim() : "",
        amount: typeof amount === "number" ? amount : Number(amount) || 0,
        currency: currency === "USD" ? "USD" : "Bs",
        payerName: payerName ? String(payerName).trim() : "",
        payerPhone: payerPhone ? String(payerPhone).trim() : "",
        bankName: bankName ? String(bankName).trim() : "",
        notes: notes ? String(notes).trim() : "",
        status: "UNMATCHED",
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[API admin payments POST] Error:", err);
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 }
    );
  }
}
