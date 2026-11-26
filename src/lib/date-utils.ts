/**
 * Utilidades de fecha para eventos VzlaBike and Run®
 *
 * Las fechas de evento son "date-only" (día de carrera, sin hora relevante).
 * Históricamente `new Date("2027-02-14")` se interpreta como UTC medianoche y
 * al formatear con `toLocaleDateString("es-VE")` (UTC-4) la fecha retrocedía
 * un día (13 de febrero). Regla del proyecto:
 *
 *   1. ESCRITURA  → normalizeEventDate() guarda fechas date-only al MEDIODÍA
 *                    UTC (tolera desfases de ±12 h en cualquier zona horaria).
 *   2. LECTURA    → formatEventDate() formatea SIEMPRE con timeZone: "UTC",
 *                    así la fecha mostrada coincide en cualquier dispositivo.
 */

const TZ_UTC = { timeZone: "UTC" } as const;

/** Normaliza cualquier entrada de fecha a un objeto Date válido. */
function toDate(dateLike: string | Date | null | undefined): Date | null {
  if (!dateLike) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normaliza una fecha para GUARDAR en la base de datos.
 * - "YYYY-MM-DD" (input type=date) → mediodía UTC del día indicado.
 * - ISO completo / Date → se respeta tal cual.
 */
export function normalizeEventDate(
  input: string | Date | null | undefined
): Date {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00.000Z`);
  }
  const d = toDate(input);
  if (d) return d;
  // Último recurso: ahora (evita Invalid Date en INSERT)
  return new Date();
}

/** Formatea con opciones personalizadas, siempre en UTC. */
export function formatEventDate(
  dateLike: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(dateLike);
  if (!d) return "—";
  return d.toLocaleDateString("es-VE", { ...TZ_UTC, ...options });
}

/** "sáb, 14 de febrero de 2027" */
export function formatEventDateLong(dateLike: string | Date | null | undefined): string {
  return formatEventDate(dateLike, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "14 Feb 2027" */
export function formatEventDateShort(dateLike: string | Date | null | undefined): string {
  return formatEventDate(dateLike, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "YYYY-MM-DD" para <input type="date">, calculado en UTC. */
export function toISODateInput(dateLike: string | Date | null | undefined): string {
  const d = toDate(dateLike);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}
