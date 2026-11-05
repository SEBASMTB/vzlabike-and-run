import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/registrations/lookup?id=V-12345678
 * Look up an existing participant by cédula (idNumber).
 * Returns the most recent registration data for auto-filling.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idNumber = searchParams.get("id");

    if (!idNumber) {
      return NextResponse.json(
        { error: "Parámetro 'id' requerido" },
        { status: 400 }
      );
    }

    const normalized = idNumber.toUpperCase().trim();

    const registration = await db.registration.findFirst({
      where: { idNumber: normalized },
      orderBy: { createdAt: "desc" },
    });

    if (!registration) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      idNumber: registration.idNumber,
      gender: registration.gender,
      dateOfBirth: registration.dateOfBirth,
      shirtSize: registration.shirtSize,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar participante" },
      { status: 500 }
    );
  }
}
