/**
 * GET /api/runners/search?cedula=...
 * 
 * Busca un corredor por numero de cedula.
 * Limpia espacios, guiones y puntos antes de buscar.
 * 
 * CRITICO CHUCKSCORE/IPICO: fechaNacimiento retorna como
 * cadena DD/MM/YYYY (barras diagonales, formato latino).
 * 
 * Response:
 *   200 - { found: true, runner: {...} } | { found: false }
 *   400 - { error: "Cedula requerida" }
 *   500 - { error: "Error interno" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Limpia cedula: remueve espacios, guiones, puntos */
function cleanCedula(raw: string): string {
  return raw.trim().replace(/[\s.\-]/g, "").toUpperCase();
}

/** Formatea Date como DD/MM/YYYY (ChuckScore/IPICO standard) */
function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCedula = searchParams.get("cedula");

    if (!rawCedula || rawCedula.trim().length === 0) {
      return NextResponse.json(
        { error: "Cedula requerida. Use: /api/runners/search?cedula=V12345678" },
        { status: 400 }
      );
    }

    const cedula = cleanCedula(rawCedula);

    const runner = await db.runner.findUnique({
      where: { cedula },
    });

    if (!runner) {
      return NextResponse.json({ found: false });
    }

    // Formatear respuesta con fechaNacimiento como DD/MM/YYYY
    const runnerResponse = {
      id: runner.id,
      cedula: runner.cedula,
      nombres: runner.nombres,
      apellidos: runner.apellidos,
      fechaNacimiento: formatDateDDMMYYYY(runner.fechaNacimiento),
      genero: runner.genero,
      email: runner.email,
      telefono: runner.telefono,
      pais: runner.pais,
      estado: runner.estado,
      ciudad: runner.ciudad,
      direccion: runner.direccion,
      team: runner.team,
      tallaFranela: runner.tallaFranela,
      licenciaFederativa: runner.licenciaFederativa,
      grupoSanguineo: runner.grupoSanguineo,
      contactoEmergenciaNombre: runner.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: runner.contactoEmergenciaTelefono,
      contactoEmergenciaParentesco: runner.contactoEmergenciaParentesco,
      alergiasCondiciones: runner.alergiasCondiciones,
    };

    return NextResponse.json({ found: true, runner: runnerResponse });
  } catch (error) {
    console.error("[API] Error searching runner:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
