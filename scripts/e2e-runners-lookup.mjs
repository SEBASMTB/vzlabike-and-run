// Verificación rápida de /api/runners/lookup:
// 1. POST registro con talla + emergencia → 201
// 2. Lookup por cédula exacta → found, tallaFranela y contacto presentes
// 3. Lookup por solo dígitos (sin "V-") → found (match por sufijo)
// 4. Lookup cédula inexistente → found:false
const BASE = process.env.E2E_BASE || "http://localhost:3000";
const TOKEN_SECRET = "vzlabike-admin-secret-key";

function makeToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: "admin", role: "admin", iat: now, exp: now + 3600 };
  return `${TOKEN_SECRET}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
}
const JSON_HDRS = { "Content-Type": "application/json", Cookie: `admin_token=${makeToken()}` };

function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  // Evento desechable
  const slug = `test-lookup-${Date.now()}`;
  const evRes = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: JSON_HDRS,
    body: JSON.stringify({
      title: "TEST LOOKUP", slug, sportType: "running",
      date: "2027-03-01", location: "Caracas", distance: "10K",
      category: "running", price: 10, maxParticipants: 100,
    }),
  });
  check("crear evento", evRes.status === 201, `status=${evRes.status}`);
  const ev = await evRes.json();

  // Registro con talla y contacto de emergencia
  const regRes = await fetch(`${BASE}/api/events/${slug}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "LUIS", lastName: "PEREZ TEST",
      email: "luis.test@example.com", phone: "04141234567",
      idNumber: "V-18456789", gender: "M", dateOfBirth: "15/06/1990",
      shirtSize: "L", category: "General Masculino",
      team: "Equipo Prueba Lookup", emergencyContact: "MARIA PEREZ",
      emergencyPhone: "04169876543", emergRelation: "Hermano/a",
      estado: "Distrito Capital", ciudad: "Caracas",
      paymentMethod: "zelle", paymentRef: "REF-001",
      waiverAccepted: true, totalAmount: 10,
    }),
  });
  check("registro 201", regRes.status === 201, `status=${regRes.status}`);

  // Lookup exacto con prefijo
  const l1 = await (await fetch(`${BASE}/api/runners/lookup?cedula=V-18456789`)).json();
  check("lookup exacto found", l1.found === true && l1.runner?.cedula === "V-18456789",
    JSON.stringify(l1.runner ? { nombre: l1.runner.nombres, talla: l1.runner.tallaFranela, emerg: l1.runner.contactoEmergenciaNombre, parentesco: l1.runner.contactoEmergenciaParentesco } : l1));
  check("lookup trae talla", l1.runner?.tallaFranela === "L");
  check("lookup trae emergencia", l1.runner?.contactoEmergenciaNombre === "MARIA PEREZ" && l1.runner?.contactoEmergenciaParentesco === "Hermano/a");
  check("lookup trae ciudad/estado", l1.runner?.ciudad === "Caracas" && l1.runner?.estado === "Distrito Capital");
  check("lookup ISO fecha", /^1990-06-15/.test(l1.runner?.fechaNacimiento || ""), l1.runner?.fechaNacimiento);

  // Lookup por solo dígitos (sufijo)
  const l2 = await (await fetch(`${BASE}/api/runners/lookup?cedula=18456789`)).json();
  check("lookup solo dígitos found", l2.found === true, `found=${l2.found}`);

  // Inexistente
  const l3 = await (await fetch(`${BASE}/api/runners/lookup?cedula=X-99999999`)).json();
  check("inexistente found:false", l3.found === false);

  // Limpieza
  const delRes = await fetch(`${BASE}/api/admin/events/${ev.id}`, {
    method: "DELETE", headers: JSON_HDRS,
  });
  check("limpieza evento", delRes.status === 200, `status=${delRes.status}`);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
