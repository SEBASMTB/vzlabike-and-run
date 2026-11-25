import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assignBibForRegistration, releaseBib } from "@/lib/bib-assignment";
import { bibBoxLabel } from "@/lib/payment-accounts";
import { sendApprovalEmail } from "@/lib/email";

/** Envía el correo de aprobación; jamás bloquea ni lanza */
async function notifyApproval(regId: string): Promise<{
  emailSent?: boolean;
  emailSkipped?: boolean;
  emailError?: string;
  emailSentTo?: string;
}> {
  try {
    const reg = await db.registration.findUnique({ where: { id: regId } });
    if (!reg) return {};
    const event = await db.event.findUnique({ where: { id: reg.eventId } });
    let categoryName: string | null = reg.category || null;
    if (reg.categoryId) {
      try {
        const cat = await db.category.findUnique({
          where: { id: reg.categoryId },
          select: { name: true },
        });
        if (cat) categoryName = cat.name;
      } catch {}
    }
    const result = await sendApprovalEmail({
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email || "",
      eventTitle: event?.title || "",
      eventDate: event?.date ? String(event.date) : null,
      eventLocation: event?.location || null,
      eventDistance: event?.distance || null,
      categoryName,
      bibNumber: reg.bibNumber,
      bibBoxLabel: reg.bibBoxLabel || null,
      eventSlug: event?.slug || null,
    });
    return {
      emailSent: result.sent,
      emailSkipped: result.skipped,
      emailError: result.error,
      emailSentTo: result.sent ? reg.email : undefined,
    };
  } catch (err) {
    console.error("[API admin registrations PATCH] notifyApproval error:", err);
    return { emailError: "fallo al preparar el correo" };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            location: true,
            price: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener inscripción" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const registration = await db.registration.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        idNumber: body.idNumber,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        shirtSize: body.shirtSize,
        category: body.category,
        team: body.team,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        paymentMethod: body.paymentMethod,
        paymentRef: body.paymentRef,
        status: body.status,
        waiverAccepted: body.waiverAccepted,
        bibNumber: body.bibNumber,
      },
    });

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;

    // Verificar que existe antes de borrar (para dar 404 claro)
    const existing = await db.registration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    await db.registration.delete({ where: { id } });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar inscripción" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;

    const newStatus = typeof body.status === "string" ? body.status.toUpperCase() : null;

    // ── Rechazo: motivo obligatorio + liberar dorsal ──
    if (newStatus === "REJECTED") {
      const reason = String(body.rejectReason ?? "").trim();
      if (!reason) {
        return NextResponse.json(
          { error: "El motivo del rechazo es obligatorio" },
          { status: 400 }
        );
      }
      data.rejectReason = reason;
    }

    const existing = await db.registration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    // Cambios de estado que liberan el dorsal (nunca queman números)
    if (newStatus === "REJECTED" || newStatus === "PENDING") {
      if (existing.bibNumber != null) {
        data.bibNumber = null;
        data.bibBoxLabel = "";
      }
    }

    if (body.bibNumber !== undefined) {
      // Dorsal manual del organizador
      const manualBib = body.bibNumber === null ? null : Number(body.bibNumber);
      if (manualBib != null && !Number.isFinite(manualBib)) {
        return NextResponse.json(
          { error: "Dorsal inválido" },
          { status: 400 }
        );
      }
      if (manualBib != null) {
        let event: { bibBoxSize?: number | null } | null = null;
        try {
          event = await db.event.findUnique({
            where: { id: existing.eventId },
            select: { bibBoxSize: true },
          });
        } catch {}
        data.bibNumber = Math.round(manualBib);
        data.bibBoxLabel = bibBoxLabel(Math.round(manualBib), event?.bibBoxSize || 100);
      } else {
        data.bibNumber = null;
        data.bibBoxLabel = "";
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      );
    }

    const registration = await db.registration.update({
      where: { id },
      data,
    });

    // ── Aprobación: asignación atómica del dorsal (lote de la categoría) ──
    if (newStatus === "APPROVED" && registration.bibNumber == null) {
      const assigned = await assignBibForRegistration(registration.id);
      if (assigned.bibNumber != null) {
        // Correo automático al corredor (dorsal + caja + evento), nunca bloquea
        const email = await notifyApproval(registration.id);
        return NextResponse.json({
          ...registration,
          bibNumber: assigned.bibNumber,
          bibBoxLabel: assigned.bibBoxLabel,
          bibAssigned: true,
          ...email,
        });
      }
      // Aprobado sin dorsal (lote lleno): correo avisando que va "en asignación"
      const email = await notifyApproval(registration.id);
      return NextResponse.json({
        ...registration,
        bibNumber: null,
        bibBoxLabel: null,
        bibAssigned: false,
        bibWarning: assigned.reason || "No se pudo asignar dorsal",
        ...email,
      });
    }

    // Aprobación de una inscripción que ya tenía dorsal (p.ej. re-aprobada
    // manualmente): también notifica si antes NO estaba aprobada
    if (
      newStatus === "APPROVED" &&
      String(existing.status || "").toUpperCase() !== "APPROVED"
    ) {
      const email = await notifyApproval(registration.id);
      return NextResponse.json({ ...registration, ...email });
    }

    return NextResponse.json(registration);
  } catch (err) {
    console.error("[API admin registrations PATCH] Error:", err);
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 }
    );
  }
}
