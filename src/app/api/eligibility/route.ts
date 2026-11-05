/**
 * POST /api/eligibility
 * 
 * Filtra categorias de un evento por edad y genero del atleta.
 * Calcula la edad oficial cumplida al 31 de diciembre del ano del evento
 * (Estandar UCI / World Athletics / FEVETRI).
 * 
 * Body: { eventId: string, fechaNacimiento: string, genero: "M" | "F" }
 * 
 * fechaNacimiento acepta: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
 * 
 * Response:
 *   200 - { eventId, eventTitle, edadCalculada, categories: [...] }
 *   400 - { error: "..." }
 *   404 - { error: "Evento no encontrado" }
 *   500 - { error: "..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface EligibilityRequest {
  eventId: string;
  fechaNacimiento: string;
  genero: string;
}

interface EligibleCategory {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  gender: string;
  distanceKm: number | null;
  price: number;
}

/** Edad oficial al 31/dic del ano del evento (UCI/World Athletics/FEVETRI) */
function calculateOfficialAge(birthDate: Date, eventYear: number): number {
  return eventYear - birthDate.getFullYear();
}

/** Parsea fecha en multiples formatos */
function parseBirthDate(raw: string): Date | null {
  if (!raw) return null;
  const str = raw.trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    let day: number;
    let month: number;
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { month = a; day = b; }
    else { day = a; month = b; }
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  const native = new Date(str);
  if (!isNaN(native.getTime())) return native;
  return null;
}

/** Normaliza genero */
function normalizeGender(raw: string): string {
  const g = raw.trim().toUpperCase();
  if (["F", "FEM", "FEMENINO"].includes(g)) return "F";
  if (["M", "MAS", "MASCULINO"].includes(g)) return "M";
  return g;
}

export async function POST(request: NextRequest) {
  try {
    let body: EligibilityRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
    }

    if (!body.eventId) {
      return NextResponse.json({ error: "eventId es requerido" }, { status: 400 });
    }
    if (!body.fechaNacimiento) {
      return NextResponse.json(
        { error: "fechaNacimiento es requerida (formato: DD/MM/YYYY o YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    if (!body.genero) {
      return NextResponse.json({ error: "genero es requerido ('M' o 'F')" }, { status: 400 });
    }

    const birthDate = parseBirthDate(body.fechaNacimiento);
    if (!birthDate) {
      return NextResponse.json(
        { error: "fechaNacimiento invalida. Formatos: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const genero = normalizeGender(body.genero);

    const event = await db.event.findUnique({
      where: { id: body.eventId },
      include: { categoryList: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const eventYear = new Date(event.date).getFullYear();
    const edadCalculada = calculateOfficialAge(birthDate, eventYear);

    const eligibleCategories: EligibleCategory[] = event.categoryList.filter((cat) => {
      const inAgeRange = edadCalculada >= cat.minAge && edadCalculada <= cat.maxAge;
      const genderMatch = cat.gender === "MIXTO" || cat.gender === genero;
      return inAgeRange && genderMatch;
    }).map((cat) => ({
      id: cat.id,
      name: cat.name,
      minAge: cat.minAge,
      maxAge: cat.maxAge,
      gender: cat.gender,
      distanceKm: cat.distanceKm,
      price: cat.price,
    }));

    return NextResponse.json({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventYear,
      edadCalculada,
      birthDate: body.fechaNacimiento,
      genero,
      categories: eligibleCategories,
    });
  } catch (error) {
    console.error("[API] Error filtering categories:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
