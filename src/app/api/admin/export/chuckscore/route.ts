/**
 * GET /api/admin/export/chuckscore?eventId=...
 *
 * Export<parameter name="Exportador">Exportador</parameter> Nativo para ChuckScore / IPICO.
 * Genera un archivo Excel (.xlsx) con los datos de inscripciones
 * de un evento específico.
 *
 * REQUISITO TÉCNICO CHUCKSCORE:
 *   - Las fechas de nacimiento DEBEN venir en formato DD/MM/YYYY (barras diagonales).
 *   - Las columnas deben seguir el orden exacto del estándar ChuckScore.
 *
 * Columnas: Bib | Chip | First Name | Last Name | DOB (DD/MM/YYYY) |
 *           Gender | Category | Team | City | Phone |
 *           Emergency Contact | Emergency Phone | Blood Type
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

/** Formatea Date como DD/MM/YYYY (ChuckScore/IPICO standard) */
function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Normaliza género para ChuckScore (M/F) */
function normalizeGender(raw: string): string {
  const g = raw.trim().toUpperCase();
  if (["F", "FEM", "FEMENINO", "FEMENINA"].includes(g)) return "F";
  if (["M", "MAS", "MASC", "MASCULINO", "MASCULINA"].includes(g)) return "M";
  return g || "M";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId es requerido. Use: /api/admin/export/chuckscore?eventId=..." },
        { status: 400 }
      );
    }

    // ── Obtener evento ─────────────────────────────────────
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, slug: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // ── Obtener inscripciones aprobadas/pendientes con datos del runner ──
    // Raw SQL con JOINs (patrón probado en producción); los includes de
    // Prisma fallan porque la relación de categoría se llama categoryRef.
    const eventIdSafe = eventId.replace(/'/g, "''");
    const registrations = await db.$queryRawUnsafe(
      `SELECT r.id, r.firstName, r.lastName, r.dateOfBirth, r.gender,
              r.category, r.team, r.ciudad, r.phone,
              r.emergencyContact, r.emergencyPhone, r.emergName, r.emergPhone,
              r.bibNumber, r.chipCode,
              run.nombres AS runnerNombres, run.apellidos AS runnerApellidos,
              run.fechaNacimiento AS runnerFechaNacimiento,
              run.genero AS runnerGenero, run.team AS runnerTeam,
              run.ciudad AS runnerCiudad, run.telefono AS runnerTelefono,
              run.contactoEmergenciaNombre AS runnerEmergNombre,
              run.contactoEmergenciaTelefono AS runnerEmergTelefono,
              run.grupoSanguineo AS runnerGrupoSanguineo,
              c.name AS categoryName
       FROM Registration r
       LEFT JOIN Runner run ON r.runnerId = run.id
       LEFT JOIN Category c ON r.categoryId = c.id
       WHERE r.eventId = '${eventIdSafe}'
         AND LOWER(r.status) IN ('pending', 'approved', 'confirmed')
       ORDER BY (r.bibNumber IS NULL), r.bibNumber ASC, r.createdAt ASC`
    ) as any[];

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "No hay inscripciones para exportar en este evento" },
        { status: 404 }
      );
    }

    // ── Generar Excel con ExcelJS ──────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "VzlaBike and Run® — VBRWorks";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("ChuckScore Import", {
      properties: {
        defaultColWidth: 15,
      },
    });

    // ── Headers (orden exacto ChuckScore) ───────────────────
    const headers = [
      "Bib",
      "Chip",
      "First Name",
      "Last Name",
      "DOB (DD/MM/YYYY)",
      "Gender",
      "Category",
      "Team",
      "City",
      "Phone",
      "Emergency Contact",
      "Emergency Phone",
      "Blood Type",
    ];

    // Header row with styling
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 11,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // ── Data rows ──────────────────────────────────────────
    for (const reg of registrations) {
      // CRITICAL: fechaNacimiento as DD/MM/YYYY (ChuckScore standard)
      const dobDDMMYYYY = reg.runnerFechaNacimiento
        ? formatDateDDMMYYYY(new Date(reg.runnerFechaNacimiento))
        : reg.dateOfBirth || "";

      const row = sheet.addRow([
        reg.bibNumber || "",
        reg.chipCode || "",
        reg.runnerNombres || reg.firstName || "",
        reg.runnerApellidos || reg.lastName || "",
        dobDDMMYYYY,
        normalizeGender(reg.runnerGenero || reg.gender),
        reg.categoryName || reg.category || "",
        reg.runnerTeam || reg.team || "",
        reg.runnerCiudad || reg.ciudad || "",
        reg.runnerTelefono || reg.phone || "",
        reg.runnerEmergNombre || reg.emergencyContact || reg.emergName || "",
        reg.runnerEmergTelefono || reg.emergencyPhone || reg.emergPhone || "",
        reg.runnerGrupoSanguineo || "",
      ]);

      // Alternating row colors
      const rowNumber = row.number;
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F9FF" },
          };
        });
      }

      // Format DOB column as text (prevent Excel auto-date parsing)
      const dobCell = row.getCell(5);
      dobCell.numFmt = "@";
    }

    // ── Auto-fit column widths ─────────────────────────────
    sheet.columns.forEach((column) => {
      if (!column.eachCell) return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = Math.min(maxLength, 40);
    });

    // ── Generate buffer ────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();

    // ── Return as downloadable file ────────────────────────
    const filename = `ChuckScore_${event.slug || event.id}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] Error generating ChuckScore export:", error);
    return NextResponse.json(
      { error: "Error interno al generar el archivo Excel" },
      { status: 500 }
    );
  }
}
