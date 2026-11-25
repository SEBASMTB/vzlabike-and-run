/**
 * Test unitario: notificaciones al corredor (src/lib/notify.ts)
 * Ejecutar: npx tsx scripts/test-notify.ts
 */
import {
  normalizeWhatsappPhone,
  buildApprovalMessage,
  whatsappApprovalUrl,
} from "../src/lib/notify";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\n═══ 1. Normalización de teléfonos venezolanos para wa.me ═══");
check("0412-1234567 → 584121234567", normalizeWhatsappPhone("0412-1234567") === "584121234567", normalizeWhatsappPhone("0412-1234567") || "null");
check("04121234567 → 584121234567", normalizeWhatsappPhone("04121234567") === "584121234567");
check("4121234567 (sin 0) → 584121234567", normalizeWhatsappPhone("4121234567") === "584121234567");
check("+58 412 1234567 → 584121234567", normalizeWhatsappPhone("+58 412 1234567") === "584121234567");
check("584121234567 ya internacional → igual", normalizeWhatsappPhone("584121234567") === "584121234567");
check("vacío → null", normalizeWhatsappPhone("") === null);
check("undefined → null", normalizeWhatsappPhone(undefined) === null);
check("sin dígitos → null", normalizeWhatsappPhone("abc") === null);
check("+1 555 123 4567 (EEUU) → dígitos genéricos", normalizeWhatsappPhone("+1 555 123 4567") === "15551234567");

console.log("\n═══ 2. Mensaje de aprobación (nombre, evento, categoría, dorsal, caja) ═══");
const msg = buildApprovalMessage({
  firstName: "MARIA",
  lastName: "PEREZ",
  eventTitle: "LA RUTA DE LA CAMPAÑA ADMIRABLE",
  eventDate: "2027-02-14T00:00:00.000Z",
  eventLocation: "MERIDA VENEZUELA",
  eventSlug: "la-ruta-de-la-campana-admirable",
  categoryName: "Máster C Masculino (50-59)",
  bibNumber: 575,
  bibBoxLabel: "Caja 500–599",
});
check("Incluye el nombre", msg.includes("MARIA PEREZ"));
check("Incluye APROBADO", msg.includes("APROBADO"));
check("Incluye el evento", msg.includes("LA RUTA DE LA CAMPAÑA ADMIRABLE"));
check("Incluye la categoría", msg.includes("Máster C Masculino (50-59)"));
check("Incluye el dorsal #575", msg.includes("DORSAL: #575"));
check("Incluye la caja de retiro", msg.includes("Caja 500–599"));
check("Incluye la caja en la instrucción del día del evento", msg.includes("caja de retiro"));
check("Incluye el enlace de consulta", msg.includes("/eventos/la-ruta-de-la-campana-admirable"));
check("NO incluye email/teléfono/referencia (sin PII)", !msg.includes("@") || !/\b(telephone|referencia)\b/i.test(msg));

console.log("\n═══ 3. URL de WhatsApp ═══");
const url = whatsappApprovalUrl("0414-555-1234", {
  firstName: "JOSE",
  eventTitle: "TEST EVENT",
  bibNumber: 12,
  bibBoxLabel: "Caja 1–99",
});
check("URL empieza con https://wa.me/584145551", url?.startsWith("https://wa.me/584145551234?text=") === true, url || "null");
check("El texto va URL-encoded", url ? decodeURIComponent(url.split("text=")[1] || "").includes("DORSAL: #12") : false);
check("Sin teléfono válido → null", whatsappApprovalUrl("", { firstName: "X", eventTitle: "Y", bibNumber: 1 }) === null);
check("Teléfono basura → null", whatsappApprovalUrl("123", { firstName: "X", eventTitle: "Y", bibNumber: 1 }) === null);

console.log(`\n═══ RESULTADO: ${pass} pass, ${fail} fail ═══`);
console.log("\n── Ejemplo de mensaje generado ──\n" + msg);
process.exit(fail > 0 ? 1 : 0);
