import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assignBibForRegistration } from "@/lib/bib-assignment";
import { sendApprovalEmail } from "@/lib/email";

/** Correo de aprobación por inscripción; jamás lanza */
async function notifyApprovalSafe(regId: string): Promise<boolean> {
  try {
    const reg = await db.registration.findUnique({ where: { id: regId } });
    if (!reg?.email) return false;
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
      email: reg.email,
      eventTitle: event?.title || "",
      eventDate: event?.date ? String(event.date) : null,
      eventLocation: event?.location || null,
      eventDistance: event?.distance || null,
      categoryName,
      bibNumber: reg.bibNumber,
      bibBoxLabel: reg.bibBoxLabel || null,
      eventSlug: event?.slug || null,
    });
    return result.sent;
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/registrations/bulk
 *
 * Acciones masivas sobre inscripciones del panel admin:
 *   - approve: aprueba cada inscripción y asigna dorsal + caja de forma
 *     atómica (lote de la categoría de cada corredor).
 *   - reject: rechaza con motivo obligatorio y libera el dorsal.
 *   - delete: elimina permanentemente.
 *
 * Body: { action: "approve" | "reject" | "delete", ids: string[], reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const action = String(body.action || "");
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (!["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos una inscripción" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      const reason = String(body.reason ?? "").trim();
      if (!reason) {
        return NextResponse.json(
          { error: "El motivo del rechazo es obligatorio" },
          { status: 400 }
        );
      }

      const results = { ok: 0, fail: 0 };
      for (const id of ids) {
        try {
          const existing = await db.registration.findUnique({ where: { id } });
          if (!existing) {
            results.fail++;
            continue;
          }
          const data: Record<string, unknown> = {
            status: "REJECTED",
            rejectReason: reason,
          };
          if (existing.bibNumber != null) {
            data.bibNumber = null;
            data.bibBoxLabel = "";
          }
          await db.registration.update({ where: { id }, data });
          results.ok++;
        } catch {
          results.fail++;
        }
      }
      return NextResponse.json({ action, ...results });
    }

    if (action === "delete") {
      const results = await db.$transaction(async (tx) => {
        let ok = 0;
        let fail = 0;
        for (const id of ids) {
          try {
            await tx.registration.delete({ where: { id } });
            ok++;
          } catch {
            fail++;
          }
        }
        return { ok, fail };
      });
      return NextResponse.json({ action, ...results });
    }

    // ── approve: secuencial para que los lotes no choquen entre sí ──
    const approved: Array<{ id: string; bibNumber: number | null; bibBoxLabel: string | null; emailSent: boolean }> = [];
    const failed: Array<{ id: string; error: string }> = [];
    let emailsSent = 0;
    for (const id of ids) {
      try {
        const existing = await db.registration.findUnique({ where: { id } });
        if (!existing) {
          failed.push({ id, error: "No encontrada" });
          continue;
        }
        const wasApproved =
          String(existing.status || "").toUpperCase() === "APPROVED";
        await db.registration.update({
          where: { id },
          data: { status: "APPROVED" },
        });
        const assigned = await assignBibForRegistration(id);
        // Correo al corredor solo en transiciones NUEVAS a aprobado
        const emailSent =
          !wasApproved && action === "approve"
            ? await notifyApprovalSafe(id)
            : false;
        if (emailSent) emailsSent++;
        approved.push({
          id,
          bibNumber: assigned.bibNumber,
          bibBoxLabel: assigned.bibBoxLabel,
          emailSent,
        });
        if (assigned.bibNumber == null) {
          failed.push({ id, error: assigned.reason || "Sin dorsal" });
        }
      } catch (err) {
        failed.push({ id, error: String(err).slice(0, 120) });
      }
    }

    return NextResponse.json({ action: "approve", approved, failed, emailsSent });
  } catch (err) {
    console.error("[API admin registrations bulk] Error:", err);
    return NextResponse.json(
      { error: "Error en la acción masiva" },
      { status: 500 }
    );
  }
}
