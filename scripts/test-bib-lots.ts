/**
 * Test unitario: lógica de lotes de dorsales (src/lib/bib-lots.ts)
 * Escenario del usuario: Élite vs Máster C + margen de 10 por categoría.
 * Ejecutar: npx tsx scripts/test-bib-lots.ts
 */
import {
  bibLotPriority,
  computeOrderedLotRanges,
  RESERVA_PRESENCIAL,
} from "../src/lib/bib-lots";

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

// Categorías reales del evento LA RUTA DE LA CAMPAÑA ADMIRABLE (16)
const CATS = [
  { id: "c1", name: "Femenino Sport (15-29)", minAge: 15, gender: "F" },
  { id: "c2", name: "Máster A Femenino (30-39)", minAge: 30, gender: "F" },
  { id: "c3", name: "Máster B Femenino (40+)", minAge: 40, gender: "F" },
  { id: "c4", name: "Juvenil Masculino (15-18)", minAge: 15, gender: "M" },
  { id: "c5", name: "100 Kilos Masculino (Libre)", minAge: 15, gender: "M" },
  { id: "c6", name: "Senior Masculino (19-29)", minAge: 19, gender: "M" },
  { id: "c7", name: "Élite Masculino (Libre)", minAge: 19, gender: "M" },
  { id: "c8", name: "Recreativo Masculino (25+)", minAge: 25, gender: "M" },
  { id: "c9", name: "Máster A Masculino (30-39)", minAge: 30, gender: "M" },
  { id: "c10", name: "Máster B Masculino (40-49)", minAge: 40, gender: "M" },
  { id: "c11", name: "Máster C Masculino (50-59)", minAge: 50, gender: "M" },
  { id: "c12", name: "Máster D Masculino (60+)", minAge: 60, gender: "M" },
  { id: "c13", name: "Dupla Familiar (Libre)", minAge: 15, gender: "MIXTO" },
  { id: "c14", name: "Dupla Mixta (Libre)", minAge: 15, gender: "MIXTO" },
  { id: "c15", name: "E-Bike (Libre)", minAge: 15, gender: "MIXTO" },
  { id: "c16", name: "Organismos de Seguridad del Estado (Libre)", minAge: 18, gender: "MIXTO" },
];

console.log("\n═══ 1. Prioridad de categorías ═══");
check("Élite Masculino tiene prioridad 0", bibLotPriority(CATS.find(c => c.id === "c7")!) === 0);
check("Élite Femenino (hipotética) tendría prioridad 0", bibLotPriority({ name: "Élite Femenino", minAge: 19, gender: "F" }) === 0);
check("Juvenil tiene prioridad 1", bibLotPriority(CATS.find(c => c.id === "c4")!) === 1);
check("Máster C (50) > prioridad que Senior (19)", bibLotPriority(CATS.find(c => c.id === "c11")!) > bibLotPriority(CATS.find(c => c.id === "c6")!));
check("Máster D (60) es la de mayor prioridad numérica (última)", bibLotPriority(CATS.find(c => c.id === "c12")!) === 2 + 60 / 100);

console.log("\n═══ 2. Lotes correlativos con reserva (500 cupos, 16 cats) ═══");
const lots = computeOrderedLotRanges(CATS, 500);
const byId = new Map(lots.map(l => [l.cat.id, l]));

// Élite primero y con los números más bajos
const elite = byId.get("c7")!;
check("Élite Masculino arranca en el #1", elite.start === 1, `start=${elite.start}`);
check("Élite Masculino es la primera categoría", lots[0].cat.id === "c7");
const juvenil = byId.get("c4")!;
check("Juvenil es la segunda categoría", lots[1].cat.id === "c4");
check("Juvenil empieza justo después de Élite", juvenil.start === elite.end + 1, `${juvenil.start} vs ${elite.end}+1`);

// Máster C SOLO en su lote, nunca #1
const masterC = byId.get("c11")!;
check("Máster C NO empieza en 1 (su lote está al final)", masterC.start > 100, `start=${masterC.start}`);
check("Máster C viene después de Máster B", masterC.start > byId.get("c10")!.start);
check("Máster D es la última categoría", lots[lots.length - 1].cat.id === "c12");

// Bloque = base + reserva
const base = Math.floor(500 / 16); // 31
const expectedBlock = base + RESERVA_PRESENCIAL; // 41
check(`Bloque = ${base} base + ${RESERVA_PRESENCIAL} reserva = ${expectedBlock}`, elite.end - elite.start + 1 === expectedBlock, `block=${elite.end - elite.start + 1}`);

// Sin cruces entre rangos y correlativos perfectos
let noOverlap = true;
let correlativo = true;
let cursor = 1;
for (const l of lots) {
  if (l.start !== cursor) correlativo = false;
  if (l.end < l.start) noOverlap = false;
  cursor = l.end + 1;
}
check("Todos los lotes son correlativos sin huecos", correlativo);
check("Ningún rango se cruza ni se repite", noOverlap);

// La reserva del sábado: los últimos 10 números del bloque quedan para presencial
check("Cada categoría tiene ≥10 números de margen", lots.every(l => l.end - l.start + 1 >= RESERVA_PRESENCIAL));

console.log("\n═══ 3. Simulación de asignación (primer libre dentro del lote) ═══");
const taken = new Set<number>();
function assign(catId: string): number | null {
  const lot = byId.get(catId)!;
  for (let n = lot.start; n <= lot.end; n++) if (!taken.has(n)) { taken.add(n); return n; }
  return null;
}
const bElite = assign("c7") ?? -1;
const bMasterC = assign("c11") ?? -1;
const bJuvenil = assign("c4") ?? -1;
check("Élite recibe el #1", bElite === 1, `bib=${bElite}`);
check("Máster C NO recibe el #1 ni un número de Élite", bMasterC !== 1 && bMasterC >= masterC.start && bMasterC <= masterC.end, `bib=${bMasterC}, lote Máster C=${masterC.start}–${masterC.end}`);
check("Juvenil recibe el primer libre de SU lote", bJuvenil === juvenil.start, `bib=${bJuvenil}`);
// Lote de Máster C lleno → NO invadir otras categorías
for (let n = masterC.start; n <= masterC.end; n++) taken.add(n);
const bMasterCLleno = assign("c11");
check("Lote de Máster C lleno → null (nunca un número de otra categoría)", bMasterCLleno === null);
check("Ese fallo NO tocó el rango de Élite (Élite sigue teniendo libres)", !Array.from({length: expectedBlock}, (_, i) => i + elite.start).every(n => taken.has(n)));

console.log(`\n═══ RESULTADO: ${pass} pass, ${fail} fail ═══`);
process.exit(fail > 0 ? 1 : 0);
