/**
 * Lotes de dorsales por categoría — helpers PUROS compartidos
 * entre el panel admin (EventFormPage, cliente) y el motor de
 * asignación (bib-assignment.ts, servidor).
 *
 * REGLA DEL ORGANIZADOR (2026-11-25):
 * 1. Los números más bajos (1, 2, 3…) son SIEMPRE para ÉLITE
 *    (masculino y femenino), luego Juvenil, y de ahí en orden
 *    correlativo de MENOR edad a MAYOR edad (Sub-23/Libre →
 *    Máster A → Máster B → Máster C…).
 * 2. Un corredor SOLO recibe números dentro del lote de su
 *    categoría — jamás el #1 ni números de otras categorías.
 * 3. Cada categoría reserva un MARGEN de 10 números adicionales
 *    para las inscripciones presenciales del sábado, sin cruzar
 *    rangos entre categorías.
 */

/** Margen reservado por categoría para inscripciones del sábado en sitio */
export const RESERVA_PRESENCIAL = 10;

export interface LotCategoryLike {
  id?: string;
  name?: string | null;
  minAge?: number | null;
  gender?: string | null;
}

/**
 * Prioridad de orden para lotes correlativos:
 *   0 → Élite (masculino y femenino)
 *   1 → Juvenil / Junior
 *   2+ → resto por edad mínima ascendente (menor → mayor)
 * Empates (misma edad mínima): orden estable de la configuración.
 */
export function bibLotPriority(cat: LotCategoryLike): number {
  const name = (cat.name || "").toUpperCase();
  if (name.includes("ÉLITE") || name.includes("ELITE")) return 0;
  if (name.includes("JUVENIL") || name.includes("JUNIOR")) return 1;
  return 2 + Math.min(cat.minAge ?? 99, 80) / 100;
}

/** Ordena categorías: Élite → Juvenil → menor a mayor edad (estable) */
export function sortCategoriesByLotPriority<T extends LotCategoryLike>(
  cats: T[]
): T[] {
  return [...cats].sort((a, b) => bibLotPriority(a) - bibLotPriority(b));
}

export interface OrderedLot<T extends LotCategoryLike> {
  cat: T; // referencia al objeto original (mismo orden de memoria)
  start: number;
  end: number;
}

/**
 * Calcula los lotes correlativos del evento en el orden canónico
 * (Élite → Juvenil → menor a mayor edad), con bloque base
 * `total / nCategorías` + MARGEN de reserva por categoría.
 *
 * Devuelve la lista ORDENADA con la referencia original de cada
 * categoría, para que tanto el panel (índices locales) como el
 * servidor (cat.id) puedan mapear el lote a su categoría.
 */
export function computeOrderedLotRanges<T extends LotCategoryLike>(
  cats: T[],
  totalParticipants: number,
  reserva: number = RESERVA_PRESENCIAL
): OrderedLot<T>[] {
  if (cats.length === 0) return [];

  const base = Math.max(
    1,
    Math.floor((totalParticipants || 500) / cats.length)
  );
  const block = base + Math.max(0, reserva);

  const sorted = sortCategoriesByLotPriority(cats);
  let cursor = 1;
  return sorted.map((cat) => {
    const lot = { cat, start: cursor, end: cursor + block - 1 };
    cursor += block;
    return lot;
  });
}
