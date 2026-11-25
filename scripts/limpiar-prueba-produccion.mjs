// Borra la inscripción de PRUEBA en producción (cédula 99000001)
// y verifica que la inscripción real de NATHALIE MORENO quede intacta.
const BASE = "https://vzlabike-and-run.vercel.app";
const PASSWORD = process.env.ADMIN_PASS;
if (!PASSWORD) {
  console.error("Falta ADMIN_PASS");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDeploy() {
  console.log("Esperando deploy de Vercel...");
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: PASSWORD }),
      });
      if (res.ok) {
        const cookie = res.headers.get("set-cookie")?.split(";")[0];
        if (cookie) return cookie;
      }
    } catch {}
    await sleep(15000);
  }
  throw new Error("Deploy no disponible tras 10 min");
}

async function main() {
  const cookie = await waitForDeploy();
  console.log("Auth OK, cookie obtenida");

  // 1. Buscar inscripciones de prueba (99000001)
  const listRes = await fetch(
    `${BASE}/api/admin/registrations?search=99000001&limit=50`,
    { headers: { Cookie: cookie } }
  );
  const list = await listRes.json();
  const regs = list.registrations || [];
  console.log(
    `Inscripciones con cédula 99000001: ${regs.length}`,
    regs.map((r) => ({
      id: r.id,
      nombre: r.firstName ? `${r.firstName} ${r.lastName}` : r.runner?.nombres,
      estado: r.status,
    }))
  );

  if (regs.length === 0) {
    console.log("No hay inscripciones de prueba que borrar.");
  } else {
    for (const reg of regs) {
      const delRes = await fetch(
        `${BASE}/api/admin/registrations/${reg.id}`,
        { method: "DELETE", headers: { Cookie: cookie } }
      );
      const body = await delRes.json().catch(() => ({}));
      console.log(
        `DELETE ${reg.id} → HTTP ${delRes.status}`,
        JSON.stringify(body)
      );
    }
  }

  // 2. Verificar estado final: la prueba fuera, NATHALIE intacta
  const allRes = await fetch(`${BASE}/api/admin/registrations?limit=50`, {
    headers: { Cookie: cookie },
  });
  const all = await allRes.json();
  const finals = all.registrations || [];
  const quedanPrueba = finals.filter((r) =>
    (r.idNumber || r.runner?.cedula || "") === "99000001"
  );
  const nathalie = finals.filter((r) =>
    (r.idNumber || r.runner?.cedula || "") === "9479255"
  );
  console.log("---");
  console.log(`Total inscripciones en producción: ${all.pagination?.total ?? finals.length}`);
  console.log(`Quedan de prueba (99000001): ${quedanPrueba.length} (esperado 0)`);
  console.log(
    `NATHALIE MORENO (9479255): ${nathalie.length} (esperado 1)`,
    nathalie.map((r) => ({ estado: r.status, categoria: r.category?.name || r.category }))
  );

  if (quedanPrueba.length === 0 && nathalie.length >= 1) {
    console.log("RESULTADO: LIMPIEZA OK");
  } else {
    console.log("RESULTADO: REVISAR");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
