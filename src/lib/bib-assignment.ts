import { db } from "@/lib/db";
import { bibBoxLabel } from "@/lib/payment-accounts";
import {
  computeOrderedLotRanges,
  RESERVA_PRESENCIAL,
} from "@/lib/bib-lots";

/**
 * Asignación atómica de dorsales (Bloques "lotes por categoría"):
 *
 * - El dorsal se asigna SOLO cuando la inscripción se APRUEBA (o al registrar
 *   una inscripción presencial ya verificada). Las PENDING/REJECTED quedan con
 *   bibNumber NULL y NO queman números.
 * - REGLA DEL ORGANIZADOR: los números más bajos son para ÉLITE, luego
 *   Juvenil y de ahí de menor a mayor edad. Un corredor SOLO recibe números
 *   dentro del lote de su categoría — NUNCA un número de otra categoría.
 *   Si el lote está lleno, se devuelve un motivo claro (no se roba un número
 *   de otra categoría ni se usa un fallback global).
 * - Si la categoría no tiene lote explícito (bibStart/bibEnd), se calcula un
 *   LOTE IMPLÍCITO ordenado (Élite → Juvenil → menor a mayor edad) con el
 *   MARGEN de RESERVA_PRESENCIAL (10) números por categoría para el sábado.
 * - El fallback global (1..max) SOLO aplica si el evento no tiene ninguna
 *   categoría configurada (no hay orden posible).
 * - El índice único parcial (eventId, bibNumber) en BD es la última barrera
 *   contra duplicados por carreras simultáneas; ante conflicto se reintenta
 *   con el siguiente número libre DENTRO del mismo lote.
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

  // ── Resolver el lote de la categoría del corredor ──
  const eventCategories = await db.category
    .findMany({ where: { eventId: reg.eventId } })
    .catch(() => []);

  let myCategory: { id: string; name: string } | null = null;
  let lotStart: number | null = null;
  let lotEnd: number | null = null;

  if (reg.categoryId) {
    const cat = eventCategories.find((c) => c.id === reg.categoryId) || null;
    if (cat) {
      myCategory = { id: cat.id, name: cat.name };
      if (
        cat.bibStart != null &&
        cat.bibEnd != null &&
        cat.bibEnd >= cat.bibStart &&
        cat.bibStart > 0
      ) {
        // Lote EXPLÍCITO configurado por el organizador: se respeta tal cual
        lotStart = cat.bibStart;
        lotEnd = cat.bibEnd;
      }
    }
  }

  if (lotStart == null && eventCategories.length > 0) {
    // Lote IMPLÍCITO: orden canónico Élite → Juvenil → menor a mayor edad,
    // bloque base (cupo / nCategorías) + margen de reserva para el sábado.
    const lots = computeOrderedLotRanges(
      eventCategories,
      event.maxParticipants || 500,
      RESERVA_PRESENCIAL
    );
    const mine = lots.find((l) => l.cat.id === reg.categoryId);
    if (mine) {
      lotStart = mine.start;
      lotEnd = mine.end;
    }
  }

  const catLabel = myCategory?.name || "su categoría";

  // Dorsales ya tomados en TODO el evento (cualquier categoría): evita
  // duplicados incluso si los lotes configurados se solapan por error.
  const taken = await db.registration.findMany({
    where: { eventId: reg.eventId, bibNumber: { not: null } },
    select: { bibNumber: true },
  });
  const takenSet = new Set(taken.map((t) => t.bibNumber as number));

  // Fallback global SOLO si el evento no tiene categorías (no hay orden definido)
  const maxBib = Math.max(event.maxParticipants || 500, lotEnd ?? 0, 100);

  for (let attempt = 0; attempt < 3; attempt++) {
    let bib: number | null = null;
    if (lotStart != null && lotEnd != null) {
      // Dentro del lote de SU categoría, primer libre (la reserva del
      // sábado quedan como los números finales aún libres del bloque)
      bib = firstFree(lotStart, lotEnd, takenSet);
    } else if (eventCategories.length === 0) {
      // Evento sin categorías: no hay orden posible → primer libre global
      bib = firstFree(1, maxBib, takenSet);
    }
    if (bib == null) {
      if (lotStart != null && lotEnd != null) {
        return {
          bibNumber: null,
          bibBoxLabel: null,
          reason: `El lote de "${catLabel}" (${lotStart}–${lotEnd}) está lleno. No se asignó dorsal para no invadir el rango de otra categoría. Amplíe el lote o libere números.`,
        };
      }
      return {
        bibNumber: null,
        bibBoxLabel: null,
        reason: "No hay dorsales libres para este evento",
      };
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
      // siguiente número libre DENTRO del mismo lote (nunca fuera de él).
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
