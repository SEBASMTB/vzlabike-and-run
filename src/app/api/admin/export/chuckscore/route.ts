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
    const registrations = await db.registration.findMany({
      where: {
        eventId,
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: {
        runner: true,
        category: true,
      },
      orderBy: [
        { bibNumber: "asc" },
        { createdAt: "asc" },
      ],
    });

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
      const runner = reg.runner;

      // CRITICAL: fechaNacimiento as DD/MM/YYYY (ChuckScore standard)
      const dobDDMMYYYY = runner.fechaNacimiento
        ? formatDateDDMMYYYY(new Date(runner.fechaNacimiento))
        : reg.dateOfBirth || "";

      const row = sheet.addRow([
        reg.bibNumber || "",
        reg.chipCode || "",
        runner.nombres || reg.firstName || "",
        runner.apellidos || reg.lastName || "",
        dobDDMMYYYY,
        normalizeGender(runner.genero || reg.gender),
        reg.category?.name || "",
        runner.team || reg.team || "",
        runner.ciudad || "",
        runner.telefono || reg.phone || "",
        runner.contactoEmergenciaNombre || reg.emergencyContact || "",
        runner.contactoEmergenciaTelefono || reg.emergencyPhone || "",
        runner.grupoSanguineo || "",
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
