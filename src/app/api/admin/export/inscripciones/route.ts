/**
 * GET /api/admin/export/inscripciones?eventId=&status=&search=&categoryId=
 *
 * Exportación general de inscripciones a Excel (.xlsx) para el panel admin.
 * Respeta los mismos filtros del listado del panel (evento, estado, búsqueda
 * y categoría) e incluye TODAS las columnas relevantes de cada inscripción:
 *
 *   Dorsal | Cédula | Nombre | Apellido | Género | F. Nacimiento | Categoría |
 *   Equipo | Talla Franela | Camiseta | Email | Teléfono | Estado | Ciudad |
 *   Contacto Emergencia | Tel. Emergencia | Parentesco | Método de Pago |
 *   Referencia | Monto USD | Monto Bs | Tasa BCV | Evento |
 *   Fecha de Inscripción | Estado | Responsabilidad
 *
 * Protegido con requireAuth (cookie admin_token).
 */

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import ExcelJS from "exceljs";

/** Formatea fecha ISO o DD/MM/YYYY legacy → DD/MM/YYYY */
function formatDateDDMMYYYY(value: unknown): string {
  if (!value) return "";
  const s = String(value);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Formatea fecha ISO → DD/MM/YYYY HH:mm */
function formatDateTime(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateDDMMYYYY(value)} ${hh}:${mm}`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  CONFIRMED: "Aprobado",
  REJECTED: "Rechazado",
};

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");

    // ── Filtros idénticos al listado del panel ──────────────
    const whereParts: string[] = ["1=1"];

    if (eventId && eventId !== "all") {
      whereParts.push(`r.eventId = '${eventId.replace(/'/g, "''")}'`);
    }
    if (status && status !== "todos" && status !== "all") {
      whereParts.push(`LOWER(r.status) = LOWER('${status.replace(/'/g, "''")}')`);
    }
    if (categoryId && categoryId !== "all") {
      whereParts.push(`r.categoryId = '${categoryId.replace(/'/g, "''")}'`);
    }
    if (search) {
      const term = search.trim().replace(/'/g, "''");
      whereParts.push(
        `(r.firstName LIKE '%${term}%' OR r.lastName LIKE '%${term}%' OR r.idNumber LIKE '%${term}%' OR r.email LIKE '%${term}%' OR CAST(r.bibNumber AS TEXT) LIKE '%${term}%')`
      );
    }

    const whereClause = whereParts.join(" AND ");

    const rows = await db.$queryRawUnsafe(
      `SELECT r.id, r.firstName, r.lastName, r.email, r.phone, r.idNumber,
              r.gender, r.dateOfBirth, r.shirtSize, r.hasShirt, r.status,
              r.createdAt, r.paymentMethod, r.paymentRef,
              r.totalAmount, r.totalAmountBs, r.bcvRate,
              r.bibNumber, r.bibBoxLabel, r.rejectReason, r.category, r.team, r.club,
              r.estado, r.ciudad,
              r.emergName, r.emergPhone, r.emergRelation,
              r.emergencyContact, r.emergencyPhone,
              r.waiverAccepted,
              c.name AS categoryName,
              e.title AS eventTitle, e.slug AS eventSlug
       FROM Registration r
       LEFT JOIN Event e ON r.eventId = e.id
       LEFT JOIN Category c ON r.categoryId = c.id
       WHERE ${whereClause}
       ORDER BY (r.bibNumber IS NULL), r.bibNumber ASC, r.createdAt ASC`
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No hay inscripciones que coincidan con los filtros seleccionados" },
        { status: 404 }
      );
    }

    // ── Generar Excel ────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "VzlaBike and Run® — VBRWorks";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Inscripciones", {
      properties: { defaultColWidth: 15 },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const headers = [
      "Dorsal",
      "Caja de Retiro",
      "Cédula",
      "Nombre",
      "Apellido",
      "Género",
      "F. Nacimiento",
      "Categoría",
      "Equipo",
      "Talla Franela",
      "Camiseta",
      "Email",
      "Teléfono",
      "Estado",
      "Ciudad",
      "Contacto Emergencia",
      "Tel. Emergencia",
      "Parentesco",
      "Método de Pago",
      "Referencia",
      "Monto (USD)",
      "Monto (Bs)",
      "Tasa BCV",
      "Evento",
      "Fecha de Inscripción",
      "Estado Inscripción",
      "Motivo de Rechazo",
      "Responsabilidad",
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC2626" }, // rojo corporativo VzlaBike
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FF000000" } } };
    });

    for (const r of rows) {
      const nombreCat = r.categoryName || r.category || "";
      const row = sheet.addRow([
        r.bibNumber ?? "",
        r.bibBoxLabel || "",
        r.idNumber || "",
        r.firstName || "",
        r.lastName || "",
        r.gender || "",
        formatDateDDMMYYYY(r.dateOfBirth),
        nombreCat,
        r.team || r.club || "",
        r.shirtSize || "",
        r.hasShirt ? "Sí" : "No",
        r.email || "",
        r.phone || "",
        r.estado || "",
        r.ciudad || "",
        r.emergName || r.emergencyContact || "",
        r.emergPhone || r.emergencyPhone || "",
        r.emergRelation || "",
        r.paymentMethod || "",
        r.paymentRef || "",
        typeof r.totalAmount === "number" ? r.totalAmount : 0,
        typeof r.totalAmountBs === "number" ? r.totalAmountBs : 0,
        typeof r.bcvRate === "number" && r.bcvRate > 0 ? r.bcvRate : "",
        r.eventTitle || "",
        formatDateTime(r.createdAt),
        STATUS_LABELS[String(r.status || "").toUpperCase()] || r.status || "",
        r.rejectReason || "",
        r.waiverAccepted ? "Sí" : "No",
      ]);

      // Filas alternas suaves
      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF2F2" },
          };
        });
      }

      // Fecha de nacimiento y fecha de inscripción como texto (evita
      // que Excel las reinterprete como fechas seriales)
      row.getCell(7).numFmt = "@";
      row.getCell(25).numFmt = "@";
    }

    // Ancho automático (tope 34) y encabezado congelado
    sheet.columns.forEach((column) => {
      if (!column.eachCell) return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = Math.min(maxLength, 34);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // Nombre de archivo: Inscripciones_<evento|general>_<YYYY-MM-DD>.xlsx
    const today = new Date().toISOString().split("T")[0];
    const eventPart = eventId && eventId !== "all"
      ? (rows[0]?.eventSlug || eventId).toString().replace(/[^a-zA-Z0-9-_]/g, "")
      : "general";
    const filename = `Inscripciones_${eventPart}_${today}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] Error generating inscripciones export:", error);
    return NextResponse.json(
      { error: "Error interno al generar el archivo Excel" },
      { status: 500 }
    );
  }
}
