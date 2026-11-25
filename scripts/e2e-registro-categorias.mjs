/**
 * E2E: replica el flujo reportado por el usuario.
 * 1) Crear evento con date-only "2027-02-14" SIN categorías
 * 2) Verificar fecha guardada = mediodía UTC (no retrocede un día)
 * 3) GET categorías públicas → fallback por deporte (nunca vacío)
 * 4) POST inscripción (57 años, F) → 201, con categoryId resuelto si hay BD
 * 5) Bulk de categorías → GET público source:"db" → inscripción con categoryId
 * 6) PUT fecha "2027-02-14" → sigue en mediodía UTC
 */
const BASE = process.env.E2E_BASE || "http://localhost:3100";
const TOKEN_SECRET = "vzlabike-admin-secret-key";

function makeToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: "admin", role: "admin", iat: now, exp: now + 3600 };
  return `${TOKEN_SECRET}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
}

const COOKIE = `admin_token=${makeToken()}`;
const JSON_HDRS = { "Content-Type": "application/json", Cookie: COOKIE };

function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  // 1) Crear evento como lo hace el formulario (date-only, sin categorías)
  const evRes = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: JSON_HDRS,
    body: JSON.stringify({
      title: "TEST RUTA CAMPAÑA ADMIRABLE",
      slug: "test-ruta-campana-admirable",
      sportType: "mtb",
      date: "2027-02-14",
      location: "MERIDA VENEZUELA",
      distance: "18K",
      category: "mtb",
      price: 25,
      priceBs: 0,
      maxParticipants: 500,
      status: "upcoming",
      categories: "",
    }),
  });
  const ev = await evRes.json();
  check("crear evento 201", evRes.status === 201, `status=${evRes.status}`);
  check("fecha = mediodía UTC 14-feb", ev.date === "2027-02-14T12:00:00.000Z", ev.date);
  const eventId = ev.id;

  // 2) GET público de categorías → fallback por deporte
  const catRes = await fetch(`${BASE}/api/events/test-ruta-campana-admirable/categories`);
  const catData = await catRes.json();
  check("categorías 200", catRes.status === 200, `status=${catRes.status}`);
  check("source defaults", catData.source === "defaults", catData.source);
  check("categorías no vacías", Array.isArray(catData.categories) && catData.categories.length > 0, `n=${catData.categories?.length}`);
  const fCat = catData.categories.find((c) => c.gender === "F" && catData.categories ? (57 >= c.minAge && 57 <= c.maxAge) : false);
  check("hay categoría F que cubre 57 años", !!fCat, fCat ? fCat.name : "NO");

  // 3) Inscripción sin categorías en BD (flujo legacy) → debe funcionar
  const regRes = await fetch(`${BASE}/api/events/test-ruta-campana-admirable/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Nathalie", lastName: "Moreno",
      email: "nathalie@test.com", phone: "04141234567",
      idNumber: "V1234567", gender: "F", dateOfBirth: "12/05/1969",
      shirtSize: "M", category: fCat ? fCat.name : "General Damas",
      team: "VzlaBike and Run Team",
      emergencyContact: "Test", emergencyPhone: "04147654321",
      paymentMethod: "transferencia", paymentRef: "REF123",
      waiverAccepted: true,
    }),
  });
  const reg = await regRes.json();
  check("inscripción legacy 201", regRes.status === 201, `status=${regRes.status} err=${reg.error || "-"}`);

  // 4) Bulk de categorías (como el formulario admin)
  const bulkRes = await fetch(`${BASE}/api/admin/events/${eventId}/categories/bulk`, {
    method: "POST",
    headers: JSON_HDRS,
    body: JSON.stringify({
      categories: [
        { name: "Máster C Damas (50-59)", minAge: 50, maxAge: 59, gender: "F", price: 25 },
        { name: "Máster C Varones (50-59)", minAge: 50, maxAge: 59, gender: "M", price: 25 },
        { name: "Élite Masculino", minAge: 19, maxAge: 999, gender: "M", price: 25 },
      ],
    }),
  });
  const bulk = await bulkRes.json();
  check("bulk categorías 201", bulkRes.status === 201, `status=${bulkRes.status} count=${bulk.count}`);
  const dbF = (bulk.categories || []).find((c) => c.gender === "F");

  // 5) GET público ahora desde BD
  const cat2 = await (await fetch(`${BASE}/api/events/test-ruta-campana-admirable/categories`)).json();
  check("source db tras bulk", cat2.source === "db", cat2.source);
  check("3 categorías en BD", cat2.categories.length === 3, `n=${cat2.categories.length}`);
  check("género MIXTO normalizado", cat2.categories.every((c) => c.gender === "" || c.gender === "M" || c.gender === "F"), JSON.stringify(cat2.categories.map((c) => c.gender)));

  // 6) Inscripción con categoría de BD → categoryId resuelto
  const reg2Res = await fetch(`${BASE}/api/events/test-ruta-campana-admirable/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Maria", lastName: "Perez",
      email: "maria@test.com", phone: "04149998877",
      idNumber: "V7654321", gender: "F", dateOfBirth: "01/01/1968",
      shirtSize: "S", category: "Máster C Damas (50-59)",
      team: "", emergencyContact: "Test2", emergencyPhone: "04141112233",
      paymentMethod: "movil", paymentRef: "REF456",
      waiverAccepted: true,
    }),
  });
  const reg2 = await reg2Res.json();
  check("inscripción con BD 201", reg2Res.status === 201, `status=${reg2Res.status} err=${reg2.error || "-"}`);
  check("categoryId resuelto en BD", !!reg2.categoryId && reg2.categoryId === (dbF && dbF.id), `categoryId=${reg2.categoryId}`);

  // 7) PUT del admin con la misma fecha → no retrocede
  const putRes = await fetch(`${BASE}/api/admin/events/${eventId}`, {
    method: "PUT",
    headers: JSON_HDRS,
    body: JSON.stringify({ date: "2027-02-14", title: "TEST RUTA CAMPAÑA ADMIRABLE" }),
  });
  const put = await putRes.json();
  check("PUT fecha = mediodía UTC", put.date === "2027-02-14T12:00:00.000Z", put.date);

  // Limpieza: borrar evento de prueba
  const delRes = await fetch(`${BASE}/api/admin/events/${eventId}`, {
    method: "DELETE", headers: { Cookie: COOKIE },
  });
  check("limpieza evento test", delRes.ok, `status=${delRes.status}`);
}

main().catch((e) => { console.error("E2E ERROR:", e); process.exitCode = 1; });
