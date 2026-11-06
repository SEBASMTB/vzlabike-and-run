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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build raw SQL query to avoid Prisma type mismatch with Registration
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (eventId) {
      whereClause += ` AND r.eventId = ?`;
      params.push(eventId);
    }

    if (status && status !== "todos" && status !== "all") {
      whereClause += ` AND LOWER(r.status) = LOWER(?)`;
      params.push(status);
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      whereClause += ` AND (
        r.firstName LIKE ? OR
        r.lastName LIKE ? OR
        r.idNumber LIKE ? OR
        r.email LIKE ? OR
        r.bibNumber IS NOT NULL AND CAST(r.bibNumber AS TEXT) LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const offset = (page - 1) * limit;

    // Get registrations with event info via raw SQL
    const registrations = await db.$queryRawUnsafe(
      `SELECT r.*,
              e.title as eventTitle, e.date as eventDate, e.sportType as eventSportType,
              c.name as categoryName
       FROM Registration r
       LEFT JOIN Event e ON r.eventId = e.id
       LEFT JOIN Category c ON r.categoryId = c.id
       ${whereClause}
       ORDER BY r.createdAt DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    // Get total count
    const countResult = await db.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM Registration r ${whereClause}`,
      ...params
    ) as any[];

    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener inscripciones", detail: String(error).substring(0, 200) },
      { status: 500 }
    );
  }
}
