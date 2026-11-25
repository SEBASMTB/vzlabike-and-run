import { db } from "@/lib/db";
import { bibBoxLabel } from "@/lib/payment-accounts";

/**
 * Asignación atómica de dorsales (Bloques "lotes por categoría"):
 *
 * - El dorsal se asigna SOLO cuando la inscripción se APRUEBA (o al registrar
 *   una inscripción presencial ya verificada). Las PENDING/REJECTED quedan con
 *   bibNumber NULL y NO queman números.
 * - Se toma el primer número LIBRE dentro del lote bibStart–bibEnd de la
 *   categoría del corredor. Si la categoría no tiene lote definido (o el lote
 *   está lleno), se toma el primer número libre global del evento (1..max).
 * - El índice único parcial (eventId, bibNumber) en BD es la última barrera
 *   contra duplicados por carreras simultáneas; ante conflicto se reintenta
 *   con el siguiente número libre.
 */

export interface BibAssignmentResult {
  bibNumber: number | null;
  bibBoxLabel: string | null;
  reason?: string;
}

/** Busca el primer número libre en [from..to] que no esté en taken */
function firstFree(from: number, to: number, taken: Set<number>): number | null {
  for (let n = from; n <= to; n++) {
    if (!taken.has(n)) return n;
  }
  return null;
}

export async function assignBibForRegistration(
  registrationId: string
): Promise<BibAssignmentResult> {
  const reg = await db.registration.findUnique({
    where: { id: registrationId },
  });
  if (!reg) {
    return { bibNumber: null, bibBoxLabel: null, reason: "Inscripción no encontrada" };
  }

  const event = await db.event.findUnique({ where: { id: reg.eventId } });
  if (!event) {
    return { bibNumber: null, bibBoxLabel: null, reason: "Evento no encontrado" };
  }

  // Ya tiene dorsal: solo asegurar su etiqueta de caja
  if (reg.bibNumber != null) {
    const label =
      reg.bibBoxLabel || bibBoxLabel(reg.bibNumber, event.bibBoxSize || 100);
    if (!reg.bibBoxLabel) {
      await db.registration.update({
        where: { id: reg.id },
        data: { bibBoxLabel: label },
      });
    }
    return { bibNumber: reg.bibNumber, bibBoxLabel: label };
  }

  // Lote de la categoría (si existe y es válido)
  let lotStart: number | null = null;
  let lotEnd: number | null = null;
  if (reg.categoryId) {
    try {
      const cat = await db.category.findUnique({ where: { id: reg.categoryId } });
      if (
        cat?.bibStart != null &&
        cat?.bibEnd != null &&
        cat.bibEnd >= cat.bibStart &&
        cat.bibStart > 0
      ) {
        lotStart = cat.bibStart;
        lotEnd = cat.bibEnd;
      }
    } catch {
      // Sin categoría válida → lote global
    }
  }

  // Dorsales ya tomados en TODO el evento (cualquier categoría): evita
  // duplicados incluso si los lotes configurados se solapan por error.
  const taken = await db.registration.findMany({
    where: { eventId: reg.eventId, bibNumber: { not: null } },
    select: { bibNumber: true },
  });
  const takenSet = new Set(taken.map((t) => t.bibNumber as number));

  const maxBib = Math.max(event.maxParticipants || 500, lotEnd ?? 0, 100);

  for (let attempt = 0; attempt < 3; attempt++) {
    let bib: number | null = null;
    if (lotStart != null && lotEnd != null) {
      bib = firstFree(lotStart, lotEnd, takenSet);
    }
    if (bib == null) {
      // Fallback: primer número libre global (no debe duplicar nada)
      bib = firstFree(1, maxBib, takenSet);
    }
    if (bib == null) {
      return { bibNumber: null, bibBoxLabel: null, reason: "No hay dorsales libres para este evento" };
    }

    const label = bibBoxLabel(bib, event.bibBoxSize || 100);
    try {
      await db.registration.update({
        where: { id: reg.id },
        data: { bibNumber: bib, bibBoxLabel: label },
      });
      return { bibNumber: bib, bibBoxLabel: label };
    } catch (err) {
      // P2002: otro proceso tomó el dorsal en paralelo → reintenta con el
      // siguiente número libre (el índice único protege la integridad).
      const msg = String(err);
      if (msg.includes("Unique constraint") || msg.includes("P2002")) {
        takenSet.add(bib);
        continue;
      }
      throw err;
    }
  }

  return { bibNumber: null, bibBoxLabel: null, reason: "No se pudo asignar dorsal por concurrencia" };
}

/** Libera el dorsal de una inscripción (al rechazar o devolver a pendiente) */
export async function releaseBib(registrationId: string): Promise<void> {
  await db.registration.update({
    where: { id: registrationId },
    data: { bibNumber: null, bibBoxLabel: "" },
  });
}
