/**
 * GET /api/auth/mis-inscripciones
 *
 * Historial de inscripciones del usuario autenticado, agrupado por estado:
 * { pendientes: [], aprobadas: [], rechazadas: [] }
 *
 * PRIVACIDAD: solo inscripciones del Runner vinculado a la cuenta
 * (por runnerId) o aquellas registradas con la misma cédula
 * (recipientCedula / idNumber en el flujo legacy). Nunca expone
 * datos de otros corredores.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/user-auth";

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json(
      { error: "Debes iniciar sesión" },
      { status: 401 }
    );
  }

  if (!session.runnerId) {
    return NextResponse.json({
      pendientes: [],
      aprobadas: [],
      rechazadas: [],
      linked: false,
    });
  }

  const runner = await db.runner.findUnique({
    where: { id: session.runnerId },
    select: { cedula: true },
  });
  if (!runner) {
    return NextResponse.json({
      pendientes: [],
      aprobadas: [],
      rechazadas: [],
      linked: false,
    });
  }

  // Inscripciones del Runner: vinculadas directamente (runnerId) o
  // históricas registradas con su cédula (recipientCedula / idNumber).
  const registrations = await db.registration.findMany({
    where: {
      OR: [
        { runnerId: session.runnerId },
        { recipientCedula: runner.cedula },
        { idNumber: runner.cedula },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      eventId: true,
      category: true,
      bibNumber: true,
      bibBoxLabel: true,
      chipCode: true,
      shirtSize: true,
      registrationType: true,
      recipientName: true,
      totalAmount: true,
      totalAmountBs: true,
      paymentMethod: true,
      paymentRef: true,
      rejectReason: true,
      event: {
        select: {
          title: true,
          slug: true,
          date: true,
          location: true,
          distance: true,
          sportType: true,
          imageUrl: true,
        },
      },
    },
  });

  const normalize = (s: string) =>
    (s || "").toUpperCase() === "APPROVED"
      ? "APPROVED"
      : (s || "").toUpperCase() === "REJECTED"
        ? "REJECTED"
        : (s || "").toUpperCase() === "PENDING"
          ? "PENDING"
          : (s || "").toUpperCase() === "CONFIRMED"
            ? "APPROVED"
            : "PENDING";

  const map = (r: (typeof registrations)[number]) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: normalize(r.status),
    category: r.category,
    bibNumber: r.bibNumber,
    bibBoxLabel: r.bibBoxLabel,
    chipCode: r.chipCode,
    shirtSize: r.shirtSize,
    registrationType: r.registrationType,
    recipientName: r.registrationType === "other" ? r.recipientName : "",
    totalAmount: r.totalAmount,
    totalAmountBs: r.totalAmountBs,
    paymentMethod: r.paymentMethod,
    paymentRef: r.paymentRef,
    rejectReason: r.status === "REJECTED" ? r.rejectReason : "",
    event: r.event,
  });

  const all = registrations.map(map);

  return NextResponse.json({
    pendientes: all.filter((r) => r.status === "PENDING"),
    aprobadas: all.filter((r) => r.status === "APPROVED"),
    rechazadas: all.filter((r) => r.status === "REJECTED"),
    linked: true,
    cedula: runner.cedula,
  });
}
