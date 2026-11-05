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

    const where: Record<string, unknown> = {};

    if (eventId) where.eventId = eventId;
    if (categoryId) where.categoryId = categoryId;
    if (status && status !== "todos" && status !== "all") where.status = status;

    if (search) {
      const searchTerm = search.trim();
      // Try parsing as bibNumber if it's numeric
      const bibNum = parseInt(searchTerm);
      const isNumeric = !isNaN(bibNum);

      where.OR = [
        { bibNumber: isNumeric ? bibNum : -1 },
        { runner: { cedula: { contains: searchTerm } } },
        { runner: { nombres: { contains: searchTerm } } },
        { runner: { apellidos: { contains: searchTerm } } },
        // Legacy fallback fields
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } },
        { idNumber: { contains: searchTerm } },
      ];
    }

    const [registrations, total] = await Promise.all([
      db.registration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          event: {
            select: { id: true, title: true, date: true },
          },
          runner: {
            select: {
              id: true,
              cedula: true,
              nombres: true,
              apellidos: true,
              fechaNacimiento: true,
              genero: true,
              email: true,
              telefono: true,
              pais: true,
              estado: true,
              ciudad: true,
              team: true,
              tallaFranela: true,
              licenciaFederativa: true,
              grupoSanguineo: true,
              contactoEmergenciaNombre: true,
              contactoEmergenciaTelefono: true,
              contactoEmergenciaParentesco: true,
              alergiasCondiciones: true,
            },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      db.registration.count({ where }),
    ]);

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
    console.error("[API] Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Error al obtener inscripciones" },
      { status: 500 }
    );
  }
}
