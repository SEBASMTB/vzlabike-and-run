import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assignBibForRegistration } from "@/lib/bib-assignment";

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
    const approved: Array<{ id: string; bibNumber: number | null; bibBoxLabel: string | null }> = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const id of ids) {
      try {
        const existing = await db.registration.findUnique({ where: { id } });
        if (!existing) {
          failed.push({ id, error: "No encontrada" });
          continue;
        }
        await db.registration.update({
          where: { id },
          data: { status: "APPROVED" },
        });
        const assigned = await assignBibForRegistration(id);
        approved.push({
          id,
          bibNumber: assigned.bibNumber,
          bibBoxLabel: assigned.bibBoxLabel,
        });
        if (assigned.bibNumber == null) {
          failed.push({ id, error: assigned.reason || "Sin dorsal" });
        }
      } catch (err) {
        failed.push({ id, error: String(err).slice(0, 120) });
      }
    }

    return NextResponse.json({ action: "approve", approved, failed });
  } catch (err) {
    console.error("[API admin registrations bulk] Error:", err);
    return NextResponse.json(
      { error: "Error en la acción masiva" },
      { status: 500 }
    );
  }
}
