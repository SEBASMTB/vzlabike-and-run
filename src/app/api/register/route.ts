/**
 * POST /api/register
 * 
 * Inscripcion completa: Upsert Runner + Create Registration
 * 
 * Flujo:
 *   1. Recibe datos del corredor + datos de inscripcion
 *   2. Upsert Runner por cedula (actualiza si existe, crea si no)
 *   3. Crea Registration vinculada a Event, Runner y Category
 *   4. Retorna confirmacion con ID de transaccion
 * 
 * Body: {
 *   eventId: string,
 *   categoryId: string,
 *   // Datos del corredor
 *   cedula, nombres, apellidos, fechaNacimiento, genero,
 *   email, telefono, pais, estado, ciudad, direccion,
 *   team, tallaFranela, licenciaFederativa,
 *   grupoSanguineo, contactoEmergenciaNombre,
 *   contactoEmergenciaTelefono, contactoEmergenciaParentesco,
 *   alergiasCondiciones,
 *   // Datos de inscripcion
 *   shirtSize, hasShirt, federationLicenseNumber,
 *   paymentMethod, paymentRef, paymentProofUrl,
 *   totalAmount, waiverAccepted
 * }
 * 
 * Response:
 *   201 - { success, registrationId, runnerId, transactionId }
 *   400 - { error: "..." }
 *   404 - { error: "Evento/Categoria no encontrado" }
 *   409 - { error: "Ya esta inscrito" }
 *   500 - { error: "..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── Tipos ──────────────────────────────────────────────────

interface RegisterRequest {
  // Relaciones
  eventId: string;
  categoryId: string;

  // Datos del corredor (Runner)
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  email?: string;
  telefono?: string;
  pais?: string;
  estado?: string;
  ciudad?: string;
  direccion?: string;
  team?: string;
  tallaFranela?: string;
  licenciaFederativa?: string;
  grupoSanguineo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
  alergiasCondiciones?: string;

  // Datos de inscripcion (Registration)
  shirtSize?: string;
  hasShirt?: boolean;
  federationLicenseNumber?: string;
  paymentMethod?: string;
  paymentRef?: string;
  paymentProofUrl?: string;
  totalAmount?: number;
  waiverAccepted?: boolean;
}

// ─── Utilidades ─────────────────────────────────────────────

/** Limpia cedula */
function cleanCedula(raw: string): string {
  return raw.trim().replace(/[\s.\-]/g, "").toUpperCase();
}

/** Parsea fecha de nacimiento */
function parseBirthDate(raw: string): Date | null {
  if (!raw) return null;
  const str = raw.trim();

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY o MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    let day: number;
    let month: number;

    if (a > 12 && b <= 12) {
      day = a; month = b;
    } else if (b > 12 && a <= 12) {
      month = a; day = b;
    } else {
      day = a; month = b;
    }

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
  if (["F", "FEM", "FEMENINO", "FEMENINA"].includes(g)) return "F";
  if (["M", "MAS", "MASC", "MASCULINO", "MASCULINA"].includes(g)) return "M";
  return "M";
}

/** Genera ID de transaccion */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VBR-${timestamp}-${random}`;
}

// ─── Handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Limitar tamano del body
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 50_000) {
      return NextResponse.json(
        { error: "La solicitud es demasiado grande" },
        { status: 413 }
      );
    }

    // Parsear body
    let body: RegisterRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalido" },
        { status: 400 }
      );
    }

    // ── Validaciones requeridas ───────────────────────────
    const requiredFields = ["eventId", "categoryId", "cedula", "nombres", "apellidos", "fechaNacimiento", "genero"];
    const missing = requiredFields.filter((field) => !body[field as keyof RegisterRequest]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes: " + missing.join(", ") },
        { status: 400 }
      );
    }

    const cedula = cleanCedula(body.cedula);
    if (cedula.length < 3) {
      return NextResponse.json(
        { error: "Cedula invalida" },
        { status: 400 }
      );
    }

    const fechaNacimiento = parseBirthDate(body.fechaNacimiento);
    if (!fechaNacimiento) {
      return NextResponse.json(
        { error: "fechaNacimiento invalida. Formatos: DD/MM/YYYY, YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const genero = normalizeGender(body.genero);

    // ── Verificar que existe el evento ────────────────────
    const event = await db.event.findUnique({
      where: { id: body.eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // ── Verificar que existe la categoria ─────────────────
    const category = await db.category.findUnique({
      where: { id: body.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la categoria pertenece al evento
    if (category.eventId !== body.eventId) {
      return NextResponse.json(
        { error: "La categoria no pertenece a este evento" },
        { status: 400 }
      );
    }

    // ── Verificar duplicado: Runner ya inscrito en este evento ──
    const existingRunner = await db.runner.findUnique({
      where: { cedula },
    });

    if (existingRunner) {
      const existingReg = await db.registration.findFirst({
        where: {
          eventId: body.eventId,
          runnerId: existingRunner.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });

      if (existingReg) {
        return NextResponse.json(
          {
            error: "Este corredor ya esta inscrito en este evento",
            existingRegistrationId: existingReg.id,
            status: existingReg.status,
          },
          { status: 409 }
        );
      }
    }

    // ── Transaccion: Upsert Runner + Create Registration ──
    const transactionId = generateTransactionId();

    const result = await db.$transaction(async (tx) => {
      // Upsert Runner por cedula
      const runner = await tx.runner.upsert({
        where: { cedula },
        update: {
          nombres: body.nombres.trim(),
          apellidos: body.apellidos.trim(),
          fechaNacimiento,
          genero,
          // Actualizar datos solo si vienen en el request
          ...(body.email ? { email: body.email.trim() } : {}),
          ...(body.telefono ? { telefono: body.telefono.trim() } : {}),
          ...(body.pais ? { pais: body.pais.trim() } : {}),
          ...(body.estado ? { estado: body.estado.trim() } : {}),
          ...(body.ciudad ? { ciudad: body.ciudad.trim() } : {}),
          ...(body.direccion ? { direccion: body.direccion.trim() } : {}),
          ...(body.team ? { team: body.team.trim() } : {}),
          ...(body.tallaFranela ? { tallaFranela: body.tallaFranela.trim() } : {}),
          ...(body.licenciaFederativa ? { licenciaFederativa: body.licenciaFederativa.trim() } : {}),
          ...(body.grupoSanguineo ? { grupoSanguineo: body.grupoSanguineo.trim() } : {}),
          ...(body.contactoEmergenciaNombre ? { contactoEmergenciaNombre: body.contactoEmergenciaNombre.trim() } : {}),
          ...(body.contactoEmergenciaTelefono ? { contactoEmergenciaTelefono: body.contactoEmergenciaTelefono.trim() } : {}),
          ...(body.contactoEmergenciaParentesco ? { contactoEmergenciaParentesco: body.contactoEmergenciaParentesco.trim() } : {}),
          ...(body.alergiasCondiciones ? { alergiasCondiciones: body.alergiasCondiciones.trim() } : {}),
        },
        create: {
          cedula,
          nombres: body.nombres.trim(),
          apellidos: body.apellidos.trim(),
          fechaNacimiento,
          genero,
          email: body.email?.trim() || null,
          telefono: body.telefono?.trim() || null,
          pais: body.pais?.trim() || "Venezuela",
          estado: body.estado?.trim() || null,
          ciudad: body.ciudad?.trim() || null,
          direccion: body.direccion?.trim() || null,
          team: body.team?.trim() || null,
          tallaFranela: body.tallaFranela?.trim() || null,
          licenciaFederativa: body.licenciaFederativa?.trim() || null,
          grupoSanguineo: body.grupoSanguineo?.trim() || null,
          contactoEmergenciaNombre: body.contactoEmergenciaNombre?.trim() || null,
          contactoEmergenciaTelefono: body.contactoEmergenciaTelefono?.trim() || null,
          contactoEmergenciaParentesco: body.contactoEmergenciaParentesco?.trim() || null,
          alergiasCondiciones: body.alergiasCondiciones?.trim() || null,
        },
      });

      // Crear Registration
      const registration = await tx.registration.create({
        data: {
          eventId: body.eventId,
          runnerId: runner.id,
          categoryId: body.categoryId,
          shirtSize: body.shirtSize?.trim() || null,
          hasShirt: body.hasShirt ?? true,
          federationLicenseNumber: body.federationLicenseNumber?.trim() || null,
          totalAmount: body.totalAmount ?? category.price,
          paymentMethod: body.paymentMethod?.trim() || "",
          paymentRef: body.paymentRef?.trim() || "",
          paymentProofUrl: body.paymentProofUrl?.trim() || null,
          status: "PENDING",
          waiverAccepted: body.waiverAccepted ?? false,
          // Legacy fields (compatibilidad)
          firstName: body.nombres.trim(),
          lastName: body.apellidos.trim(),
          email: body.email?.trim() || "",
          phone: body.telefono?.trim() || "",
          idNumber: cedula,
          gender: genero,
          dateOfBirth: body.fechaNacimiento,
          team: body.team?.trim() || "",
          emergencyContact: body.contactoEmergenciaNombre?.trim() || "",
          emergencyPhone: body.contactoEmergenciaTelefono?.trim() || "",
        },
      });

      return { runner, registration };
    });

    // ── Respuesta de exito ────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        registrationId: result.registration.id,
        runnerId: result.runner.id,
        transactionId,
        status: "PENDING",
        event: {
          id: event.id,
          title: event.title,
        },
        category: {
          id: category.id,
          name: category.name,
        },
        runner: {
          cedula: result.runner.cedula,
          nombres: result.runner.nombres,
          apellidos: result.runner.apellidos,
        },
        message: "Inscripcion registrada exitosamente. Estado: PENDIENTE de aprobacion.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error in registration:", error);

    // Prisma unique constraint error
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un registro con estos datos" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
