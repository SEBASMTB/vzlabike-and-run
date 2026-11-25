import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build SQL query string directly (no parameterized queries to avoid adapter issues)
    let whereParts: string[] = ["1=1"];

    if (eventId) {
      whereParts.push(`r.eventId = '${eventId.replace(/'/g, "''")}'`);
    }

    if (categoryId && categoryId !== "all") {
      whereParts.push(`r.categoryId = '${categoryId.replace(/'/g, "''")}'`);
    }

    if (status && status !== "todos" && status !== "all") {
      whereParts.push(`LOWER(r.status) = LOWER('${status.replace(/'/g, "''")}')`);
    }

    if (search) {
      const term = search.trim().replace(/'/g, "''");
      whereParts.push(`(r.firstName LIKE '%${term}%' OR r.lastName LIKE '%${term}%' OR r.idNumber LIKE '%${term}%' OR r.email LIKE '%${term}%' OR CAST(r.bibNumber AS TEXT) LIKE '%${term}%')`);
    }

    const whereClause = whereParts.join(" AND ");

    // Get registrations
    const rows = await db.$queryRawUnsafe(
      `SELECT r.id, r.firstName, r.lastName, r.email, r.phone, r.idNumber,
              r.gender, r.dateOfBirth, r.shirtSize, r.status, r.createdAt,
              r.paymentMethod, r.paymentRef, r.totalAmount, r.bibNumber,
              r.bibBoxLabel, r.rejectReason, r.paymentProofUrl, r.waiverAccepted,
              r.eventId, r.categoryId, r.runnerId,
              r.team, r.club, r.ciudad, r.estado, r.hasShirt,
              r.emergencyContact, r.emergencyPhone,
              r.emergName, r.emergPhone, r.emergRelation,
              e.title as eventTitle, e.date as eventDate,
              e.slug as eventSlug, e.location as eventLocation,
              c.name as categoryName
       FROM Registration r
       LEFT JOIN Event e ON r.eventId = e.id
       LEFT JOIN Category c ON r.categoryId = c.id
       WHERE ${whereClause}
       ORDER BY r.createdAt DESC
       LIMIT ${limit} OFFSET ${offset}`
    ) as any[];

    // Normalizar a la forma que consume el panel (objetos runner/category/event)
    // a partir de los campos planos/legacy de la tabla Registration.
    const registrations = rows.map((r) => ({
      ...r,
      event: r.eventTitle
        ? {
            id: r.eventId,
            title: r.eventTitle,
            date: r.eventDate,
            slug: r.eventSlug || null,
            location: r.eventLocation || null,
          }
        : null,
      category: r.categoryName
        ? { id: r.categoryId, name: r.categoryName }
        : null,
      runner: r.idNumber
        ? {
            id: r.runnerId || "",
            cedula: r.idNumber,
            nombres: r.firstName,
            apellidos: r.lastName,
            fechaNacimiento: r.dateOfBirth,
            genero: r.gender,
            email: r.email,
            telefono: r.phone,
            estado: r.estado,
            ciudad: r.ciudad,
            team: r.team || r.club || null,
            contactoEmergenciaNombre:
              r.emergencyContact || r.emergName || null,
            contactoEmergenciaTelefono:
              r.emergencyPhone || r.emergPhone || null,
            contactoEmergenciaParentesco: r.emergRelation || null,
          }
        : null,
    }));

    // Get total count
    const countResult = await db.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM Registration r WHERE ${whereClause}`
    ) as any[];

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener inscripciones", detail: String(error).substring(0, 300) },
      { status: 500 }
    );
  }
}
