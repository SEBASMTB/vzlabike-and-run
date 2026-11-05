import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Normaliza cualquier formato de fecha a DD/MM/YYYY
 * Soporta: "1990-05-15", "15/05/1990", "15-05-1990", "1990/05/15"
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const s = dateStr.trim();
  let day: number, month: number, year: number;

  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length !== 3) return s;
    // Detectar si es DD/MM/YYYY o YYYY/MM/DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length !== 3) return s;
    // ISO: YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else {
    return s;
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return s;
  // Pad con ceros
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yy = String(year).length === 2 ? (year > 50 ? `19${year}` : `20${year}`) : String(year);
  return `${dd}/${mm}/${yy}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await db.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        sportType: true,
        categories: true,
        maxParticipants: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Fetch ALL registrations (pending, confirmed, paid)
    const registrations = await db.registration.findMany({
      where: {
        eventId: event.id,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        idNumber: true,
        dateOfBirth: true,
        category: true,
      },
    });

    // Normalize dates to DD/MM/YYYY format
    const normalized = registrations.map((reg) => ({
      ...reg,
      dateOfBirth: normalizeDate(reg.dateOfBirth),
    }));

    // Group by category
    const grouped: Record<string, typeof normalized> = {};
    for (const reg of normalized) {
      const cat = reg.category || "Sin categoria";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(reg);
    }

    // Sort categories alphabetically, but put "Sin categoria" last
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "Sin categoria") return 1;
      if (b === "Sin categoria") return -1;
      return a.localeCompare(b, "es");
    });

    // Build response with categories order
    const categoriesWithRegistrations = sortedCategories.map((cat) => ({
      category: cat,
      count: grouped[cat].length,
      registrations: grouped[cat],
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        sportType: event.sportType,
        maxParticipants: event.maxParticipants,
      },
      totalRegistrations: registrations.length,
      categories: categoriesWithRegistrations,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener inscritos" },
      { status: 500 }
    );
  }
}
