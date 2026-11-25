/**
 * Notificaciones al corredor — helpers PUROS (cliente + servidor).
 *
 * 1. Mensaje de WhatsApp con los datos de la inscripción aprobada
 *    (nombre, evento, categoría, DORSAL y CAJA DE RETIRO), listo para
 *    abrir en un clic desde el panel admin.
 * 2. Normalización de teléfonos venezolanos al formato internacional
 *    que espera wa.me (58 + número sin 0 inicial).
 *
 * Lo usa el panel admin (/admin/inscripciones) y puede reutilizarse en
 * cualquier endpoint. Sin dependencias de BD ni de servidor.
 */

export interface ApprovalNotifyData {
  firstName: string;
  lastName?: string;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  eventSlug?: string | null;
  categoryName?: string | null;
  bibNumber: number | null;
  bibBoxLabel?: string | null;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://vzlabike-and-run.vercel.app";

/** Fecha legible en es-VE; segura en cliente y servidor */
export function formatNotifyDate(date?: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Normaliza un teléfono al formato internacional de wa.me.
 * Reglas Venezuela:
 *   - "0412-1234567" → "584121234567"
 *   - "04121234567"  → "584121234567"
 *   - "4121234567"   → "584121234567"
 *   - "+58 412…"     → "584121234567"
 * Otros países: devuelve dígitos tal cual (7–15) o null si no sirve.
 */
export function normalizeWhatsappPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("58")) {
    return digits.length >= 12 && digits.length <= 13 ? digits : digits.length >= 11 ? digits : null;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    // 0412… → 58 + sin el 0
    return `58${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("4")) {
    // celular venezolano sin el 0 inicial
    return `58${digits}`;
  }
  if (digits.length >= 7 && digits.length <= 15) {
    return digits; // internacional de otro país → wa.me lo acepta
  }
  return null;
}

/** Texto del mensaje de WhatsApp para una inscripción aprobada */
export function buildApprovalMessage(data: ApprovalNotifyData): string {
  const nombre = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const fecha = formatNotifyDate(data.eventDate);
  const lines: string[] = [
    "VZLABIKE AND RUN — INSCRIPCION CONFIRMADA",
    "",
    `Hola ${nombre},`,
    "",
    "Tu pago fue APROBADO. Estos son tus datos:",
    "",
    `Evento: ${data.eventTitle}`,
  ];
  if (fecha) lines.push(`Fecha: ${fecha}`);
  if (data.eventLocation) lines.push(`Lugar: ${data.eventLocation}`);
  if (data.categoryName) lines.push(`Categoria: ${data.categoryName}`);
  if (data.bibNumber != null) {
    lines.push(`DORSAL: #${data.bibNumber}`);
    if (data.bibBoxLabel) lines.push(`Caja de retiro del kit: ${data.bibBoxLabel}`);
  }
  lines.push(
    "",
    "El dia del evento presenta este mensaje o tu cedula en la caja de retiro para recibir tu kit (franela, numero y chip).",
    "",
    `Consulta tu inscripcion: ${SITE_URL}${
      data.eventSlug ? `/eventos/${data.eventSlug}` : ""
    }`,
    "",
    "Te esperamos en la linea de partida."
  );
  return lines.join("\n");
}

/**
 * URL de WhatsApp lista para abrir (wa.me). Devuelve null si el teléfono
 * no es utilizable — el panel entonces deshabilita el botón.
 */
export function whatsappApprovalUrl(
  phone: string | null | undefined,
  data: ApprovalNotifyData
): string | null {
  const normalized = normalizeWhatsappPhone(phone);
  if (!normalized) return null;
  const text = encodeURIComponent(buildApprovalMessage(data));
  return `https://wa.me/${normalized}?text=${text}`;
}
