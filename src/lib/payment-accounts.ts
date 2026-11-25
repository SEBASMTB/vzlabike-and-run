/**
 * Cuentas de destino de pago configurables por evento (Paso 3 del wizard).
 *
 * El organizador define en el formulario del evento las cuentas reales
 * (Pago Móvil, Transferencia, Zelle, Binance, Divisas, etc.) y se muestran
 * ÚNICAMENTE en el Paso 3 del formulario de inscripción.
 */

export interface PaymentAccount {
  method: string; // movil | transferencia | zelle | binance | divisas | otro
  label?: string; // Nombre visible, ej. "Pago Móvil Banesco"
  banco?: string;
  telefono?: string; // Teléfono afiliado al Pago Móvil
  cedula?: string; // Cédula/RIF del titular
  correo?: string; // Correo para Zelle
  wallet?: string; // Binance ID / wallet
  cuenta?: string; // Número de cuenta para transferencia
  notas?: string;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  movil: "Pago Móvil",
  transferencia: "Transferencia Nacional",
  zelle: "Zelle",
  binance: "Binance",
  divisas: "Divisas / Efectivo",
  otro: "Otro",
};

/** Etiqueta visible de una cuenta (label > nombre del método) */
export function accountLabel(acc: PaymentAccount): string {
  if (acc.label && acc.label.trim()) return acc.label.trim();
  return PAYMENT_METHOD_LABELS[acc.method] || acc.method || "Cuenta";
}

/** Líneas de detalle que se muestran de una cuenta (solo las que tienen datos) */
export function accountLines(acc: PaymentAccount): string[] {
  const lines: string[] = [];
  if (acc.banco?.trim()) lines.push(`Banco: ${acc.banco.trim()}`);
  if (acc.cuenta?.trim()) lines.push(`Cuenta: ${acc.cuenta.trim()}`);
  if (acc.telefono?.trim()) lines.push(`Teléfono: ${acc.telefono.trim()}`);
  if (acc.cedula?.trim()) lines.push(`Cédula/RIF: ${acc.cedula.trim()}`);
  if (acc.correo?.trim()) lines.push(`Correo: ${acc.correo.trim()}`);
  if (acc.wallet?.trim()) lines.push(`Wallet/ID: ${acc.wallet.trim()}`);
  if (acc.notas?.trim()) lines.push(acc.notas.trim());
  return lines;
}

/** Parsea el JSON de paymentAccounts del evento (tolerante a formatos legacy) */
export function parsePaymentAccounts(
  raw: string | string[] | PaymentAccount[] | null | undefined
): PaymentAccount[] {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      method: String(a.method ?? "otro"),
      label: a.label ? String(a.label) : undefined,
      banco: a.banco ? String(a.banco) : undefined,
      telefono: a.telefono ? String(a.telefono) : undefined,
      cedula: a.cedula ? String(a.cedula) : undefined,
      correo: a.correo ? String(a.correo) : undefined,
      wallet: a.wallet ? String(a.wallet) : undefined,
      cuenta: a.cuenta ? String(a.cuenta) : undefined,
      notas: a.notas ? String(a.notas) : undefined,
    }))
    .filter((a) => accountLines(a).length > 0 || a.method);
}

/**
 * Normaliza una referencia de pago para comparar (conciliación):
 * solo dígitos y letras en mayúsculas, sin espacios ni guiones.
 */
export function normalizePaymentRef(ref: string): string {
  return (ref || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Etiqueta de la caja física que corresponde a un dorsal según el tamaño
 * de bloque del evento: caja 100 → 1–99, 100–199…; caja 150 → 1–149, 150–299…
 */
export function bibBoxLabel(bib: number, boxSize: number): string {
  const size = boxSize > 0 ? boxSize : 100;
  const start = bib < size ? 1 : Math.floor(bib / size) * size;
  const end = start + size - 1;
  return `Caja ${start}–${end}`;
}
