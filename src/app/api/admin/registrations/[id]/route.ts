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

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            location: true,
            price: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener inscripción" },
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

    const registration = await db.registration.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        idNumber: body.idNumber,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        shirtSize: body.shirtSize,
        category: body.category,
        team: body.team,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        paymentMethod: body.paymentMethod,
        paymentRef: body.paymentRef,
        status: body.status,
        waiverAccepted: body.waiverAccepted,
        bibNumber: body.bibNumber,
      },
    });

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Build update data from only provided fields
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.bibNumber !== undefined) data.bibNumber = body.bibNumber;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      );
    }

    const registration = await db.registration.update({
      where: { id },
      data,
    });

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 }
    );
  }
}
