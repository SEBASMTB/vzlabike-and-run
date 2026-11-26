/**
 * Normalización de cédula venezolana — única convención para TODO el
 * sistema (importación, registro de inscripción y cuentas de atleta):
 * "v- 12.345.678" → "V12345678". El mismo número nunca genera
 * corredores duplicados ni rompe el vínculo User ↔ Runner.
 */
export function normalizeCedula(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/[\s.\-]/g, "").toUpperCase();
}
