/**
 * ============================================================
 * VBR — Importador Incremental de Corredores (por CÉDULA)
 * Script: scripts/import-runners.ts
 * Ejecución: npx tsx scripts/import-runners.ts [--dry-run] [ruta.csv]
 *
 * CARGA INICIAL: 4.000 corredores + LOTES FUTUROS sin duplicar.
 *
 * Reglas (acordadas con el cliente):
 * 1. Upsert por CÉDULA NORMALIZADA ("v- 12.345.678" → "V12345678").
 *    Si la cédula ya existe en Runner NUNCA se duplica el corredor.
 * 2. MERGE SIN BORRAR: solo se actualizan los campos con valor no
 *    vacío en el CSV. Los datos existentes válidos se conservan
 *    siempre (un lote nuevo con columnas vacías NO borra nada).
 * 3. Lotes de 500 registros (Promise.allSettled: un error no aborta).
 * 4. CSV UTF-8 (con o sin BOM).
 *
 * ENCABEZADOS EXACTOS DEL CSV (plantilla oficial:
 * plantilla-corredores-vbr.csv):
 *
 *   CEDULA,NOMBRE,APELLIDO,FECHA_NACIMIENTO,SEXO,EMAIL,TELEFONO,
 *   ESTADO,CIUDAD,DIRECCION,CLUB,TALLA,GRUPO_SANGUINEO,ALERGIAS,
 *   EMERGENCIA_NOMBRE,EMERGENCIA_TELEFONO,EMERGENCIA_PARENTESCO
 *
 * (Se aceptan además alias históricos: "FECA DE NAC", "FECHA NAC",
 *  "FECHA DE NACIMIENTO", "E MAIL", "TEAM".)
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

// ── Configuración ────────────────────────────────────────────
const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes("--dry-run");
const argFile = process.argv.find((a, i) => i > 1 && !a.startsWith("--"));
const CSV_FILE = path.resolve(
  process.cwd(),
  argFile || "corredores_vbr.csv"
);

const prisma = new PrismaClient();

// ── Tipos ────────────────────────────────────────────────────
interface RawRow {
  CEDULA?: string;
  NOMBRE?: string;
  APELLIDO?: string;
  FECHA_NACIMIENTO?: string;
  SEXO?: string;
  EMAIL?: string;
  TELEFONO?: string;
  ESTADO?: string;
  CIUDAD?: string;
  DIRECCION?: string;
  CLUB?: string;
  TALLA?: string;
  GRUPO_SANGUINEO?: string;
  ALERGIAS?: string;
  EMERGENCIA_NOMBRE?: string;
  EMERGENCIA_TELEFONO?: string;
  EMERGENCIA_PARENTESCO?: string;
  // Alias históricos
  "FECA DE NAC"?: string;
  "FECHA NAC"?: string;
  "FECHA DE NACIMIENTO"?: string;
  "E MAIL"?: string;
  TEAM?: string;
  [key: string]: string | undefined;
}

/** Datos crudos ya limpiados del CSV (vacío = null) */
interface CsvRunner {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  genero: string;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  ciudad: string | null;
  direccion: string | null;
  team: string | null;
  tallaFranela: string | null;
  grupoSanguineo: string | null;
  alergiasCondiciones: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
}

// ── Utilidades de limpieza ───────────────────────────────────

function cleanString(value: string | undefined | null): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  return cleaned === "" || cleaned === "-" || cleaned === "N/A" ? null : cleaned;
}

/** Cédula normalizada — mismo criterio que src/lib/user-auth.ts */
function normalizeCedula(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim().replace(/[\s.\-]/g, "").toUpperCase();
}

/** Fechas: DD/MM/YYYY, MM/DD/YYYY (solo si imposible latino), ISO, DD-MM-YYYY */
function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw === "-" || raw === "N/A") return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3])
    );
    if (!isNaN(d.getTime())) return d;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const y = Number(slashMatch[3]);
    let day: number;
    let month: number;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      day = b;
      month = a;
    } else {
      // Ambiguo: formato latino DD/MM/YYYY (Venezuela)
      day = a;
      month = b;
    }
    const d = new Date(y, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const d = new Date(
      Number(dashMatch[3]),
      Number(dashMatch[2]) - 1,
      Number(dashMatch[1])
    );
    if (!isNaN(d.getTime())) return d;
  }

  const native = new Date(raw);
  return isNaN(native.getTime()) ? null : native;
}

function cleanGender(value: string | undefined | null): string {
  if (!value) return "M";
  const v = value.trim().toUpperCase();
  if (["F", "FEM", "FEMENINO", "FEMENINA", "W"].includes(v)) return "F";
  if (["M", "MAS", "MASC", "MASCULINO", "H"].includes(v)) return "M";
  return "M";
}

function cleanShirtSize(value: string | undefined | null): string | null {
  if (!value) return null;
  const size = value.trim().toUpperCase();
  const map: Record<string, string> = {
    XS: "XS", S: "S", SMALL: "S", SM: "S",
    M: "M", MED: "M", MEDIUM: "M", MD: "M",
    L: "L", LARGE: "L", LG: "L",
    XL: "XL", XG: "XL", "EXTRA LARGE": "XL",
    XXL: "XXL", "2XL": "XXL",
    XXXL: "XXXL", "3XL": "XXXL",
  };
  return map[size] || size;
}

/** Grupo sanguíneo razonable: O+, O-, A+, … o "Desconozco" */
function cleanBloodType(value: string | undefined | null): string | null {
  const v = cleanString(value);
  if (!v) return null;
  const up = v.toUpperCase().replace(/\s+/g, "");
  if (/^(O|A|B|AB)[+-]$/.test(up)) return up;
  return "Desconozco";
}

// ── Sanitización de filas ────────────────────────────────────

function sanitizeRow(row: RawRow): CsvRunner | null {
  const cedula = normalizeCedula(row.CEDULA);
  if (!cedula || cedula.length < 3) return null;

  const nombres = cleanString(row.NOMBRE);
  const apellidos = cleanString(row.APELLIDO);
  if (!nombres || !apellidos) return null;

  const fechaRaw =
    row.FECHA_NACIMIENTO ||
    row["FECA DE NAC"] ||
    row["FECHA NAC"] ||
    row["FECHA DE NACIMIENTO"];
  const fechaNacimiento = parseDate(fechaRaw);
  if (!fechaNacimiento) {
    console.warn(
      `  [WARN] ${cedula}: fecha inválida "${fechaRaw || ""}", se usa 01/01/1990`
    );
  }

  return {
    cedula,
    nombres,
    apellidos,
    fechaNacimiento: fechaNacimiento || new Date(1990, 0, 1),
    genero: cleanGender(row.SEXO),
    email: cleanString(row.EMAIL || row["E MAIL"]),
    telefono: cleanString(row.TELEFONO),
    estado: cleanString(row.ESTADO),
    ciudad: cleanString(row.CIUDAD),
    direccion: cleanString(row.DIRECCION),
    team: cleanString(row.CLUB || row.TEAM),
    tallaFranela: cleanShirtSize(row.TALLA),
    grupoSanguineo: cleanBloodType(row.GRUPO_SANGUINEO),
    alergiasCondiciones: cleanString(row.ALERGIAS),
    contactoEmergenciaNombre: cleanString(row.EMERGENCIA_NOMBRE),
    contactoEmergenciaTelefono: cleanString(row.EMERGENCIA_TELEFONO),
    contactoEmergenciaParentesco: cleanString(row.EMERGENCIA_PARENTESCO),
  };
}

/**
 * MERGE SIN BORRAR: valor del CSV si llega con contenido; si llega vacío
 * se conserva el dato existente en BD. fechaNacimiento es obligatoria
 * (siempre viaja del CSV o el default), genero igual.
 */
function mergeRunner(existing: CsvRunner | null, csv: CsvRunner): CsvRunner {
  if (!existing) return csv;
  return {
    cedula: existing.cedula,
    nombres: csv.nombres || existing.nombres,
    apellidos: csv.apellidos || existing.apellidos,
    fechaNacimiento: csv.fechaNacimiento || existing.fechaNacimiento,
    genero: csv.genero || existing.genero,
    email: csv.email ?? existing.email,
    telefono: csv.telefono ?? existing.telefono,
    estado: csv.estado ?? existing.estado,
    ciudad: csv.ciudad ?? existing.ciudad,
    direccion: csv.direccion ?? existing.direccion,
    team: csv.team ?? existing.team,
    tallaFranela: csv.tallaFranela ?? existing.tallaFranela,
    grupoSanguineo: csv.grupoSanguineo ?? existing.grupoSanguineo,
    alergiasCondiciones: csv.alergiasCondiciones ?? existing.alergiasCondiciones,
    contactoEmergenciaNombre:
      csv.contactoEmergenciaNombre ?? existing.contactoEmergenciaNombre,
    contactoEmergenciaTelefono:
      csv.contactoEmergenciaTelefono ?? existing.contactoEmergenciaTelefono,
    contactoEmergenciaParentesco:
      csv.contactoEmergenciaParentesco ?? existing.contactoEmergenciaParentesco,
  };
}

// ── Importación ──────────────────────────────────────────────

async function importRunners(): Promise<void> {
  console.log("==================================================");
  console.log("  VBR — Importación incremental de corredores");
  console.log("  Archivo: " + CSV_FILE);
  console.log("  Lote: " + BATCH_SIZE + " registros");
  console.log("  Modo: " + (DRY_RUN ? "DRY RUN (simulación)" : "PRODUCCIÓN"));
  console.log("==================================================\n");

  if (!fs.existsSync(CSV_FILE)) {
    console.error("ERROR: Archivo no encontrado: " + CSV_FILE);
    console.error("Coloca corredores_vbr.csv en la raíz del proyecto o pasa");
    console.error("la ruta como argumento: npx tsx scripts/import-runners.ts mi-lote.csv");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, "utf-8");
  const cleanContent = csvContent.replace(/^\uFEFF/, ""); // BOM UTF-8

  const records: RawRow[] = parse(cleanContent, {
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  console.log("[CSV] Registros leídos: " + records.length + "\n");

  const sanitized: CsvRunner[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  records.forEach((row, index) => {
    const runner = sanitizeRow(row);
    if (runner) {
      sanitized.push(runner);
    } else {
      skipped.push({
        row: index + 2,
        reason:
          "Cédula: " + (row.CEDULA || "—") + " | Nombre: " + (row.NOMBRE || "—"),
      });
    }
  });

  // Cédulas duplicadas DENTRO del mismo CSV: gana el último registro
  const seen = new Map<string, CsvRunner>();
  let duplicatesInFile = 0;
  for (const r of sanitized) {
    if (seen.has(r.cedula)) duplicatesInFile++;
    seen.set(r.cedula, r); // el último dato manda
  }
  const unique = Array.from(seen.values());

  console.log("[OK] Válidos: " + sanitized.length);
  if (duplicatesInFile > 0) {
    console.log(
      "[OK] Duplicados dentro del CSV: " +
        duplicatesInFile +
        " (se consolidaron a " +
        unique.length +
        " únicos)"
    );
  }
  console.log("[SKIP] Omitidos: " + skipped.length);
  if (skipped.length > 0) {
    skipped.slice(0, 15).forEach((s) => console.log("   Fila " + s.row + ": " + s.reason));
    if (skipped.length > 15)
      console.log("   … y " + (skipped.length - 15) + " más");
  }
  console.log("");

  if (unique.length === 0) {
    console.log("[WARN] No hay registros válidos para importar.");
    await prisma.$disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("[DRY RUN] Primeros 5 registros:");
    unique.slice(0, 5).forEach((r, i) => {
      console.log(
        "  " +
          (i + 1) +
          ". " +
          r.cedula +
          " | " +
          r.nombres +
          " " +
          r.apellidos +
          " | " +
          r.fechaNacimiento.toISOString().slice(0, 10) +
          " | " +
          r.genero +
          " | " +
          (r.estado || "-") +
          " | " +
          (r.team || "-")
      );
    });
    console.log(
      "\n  Total: " + unique.length + " corredores se crearían/actualizarían."
    );
    await prisma.$disconnect();
    return;
  }

  // ── Upsert por lotes de 500, con merge contra la BD ──
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  const startTime = Date.now();
  const totalBatches = Math.ceil(unique.length / BATCH_SIZE);

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(
      `[BATCH] Lote ${batchNum}/${totalBatches} (${batch.length} registros)…`
    );

    // 1) Leer existentes del lote en UNA consulta
    const existingRows = await prisma.runner.findMany({
      where: { cedula: { in: batch.map((b) => b.cedula) } },
    });
    const existingMap = new Map<string, (typeof existingRows)[number]>();
    for (const ex of existingRows) existingMap.set(ex.cedula, ex);

    // 2) Upsert con el merge sin borrar
    const results = await Promise.allSettled(
      batch.map((csvRow) => {
        const existing = existingMap.get(csvRow.cedula) || null;
        const merged = mergeRunner(existing as CsvRunner | null, csvRow);
        return prisma.runner.upsert({
          where: { cedula: csvRow.cedula },
          update: {
            nombres: merged.nombres,
            apellidos: merged.apellidos,
            fechaNacimiento: merged.fechaNacimiento,
            genero: merged.genero,
            email: merged.email,
            telefono: merged.telefono,
            estado: merged.estado,
            ciudad: merged.ciudad,
            direccion: merged.direccion,
            team: merged.team,
            tallaFranela: merged.tallaFranela,
            grupoSanguineo: merged.grupoSanguineo,
            alergiasCondiciones: merged.alergiasCondiciones,
            contactoEmergenciaNombre: merged.contactoEmergenciaNombre,
            contactoEmergenciaTelefono: merged.contactoEmergenciaTelefono,
            contactoEmergenciaParentesco: merged.contactoEmergenciaParentesco,
          },
          create: {
            cedula: merged.cedula,
            nombres: merged.nombres,
            apellidos: merged.apellidos,
            fechaNacimiento: merged.fechaNacimiento,
            genero: merged.genero,
            email: merged.email,
            telefono: merged.telefono,
            estado: merged.estado,
            ciudad: merged.ciudad,
            direccion: merged.direccion,
            team: merged.team,
            tallaFranela: merged.tallaFranela,
            grupoSanguineo: merged.grupoSanguineo,
            alergiasCondiciones: merged.alergiasCondiciones,
            contactoEmergenciaNombre: merged.contactoEmergenciaNombre,
            contactoEmergenciaTelefono: merged.contactoEmergenciaTelefono,
            contactoEmergenciaParentesco: merged.contactoEmergenciaParentesco,
          },
        });
      })
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        // Ya existía en BD (antes del upsert) → actualizado; si no → creado
        if (existingMap.has(batch[idx].cedula)) {
          totalUpdated++;
        } else {
          totalCreated++;
        }
      } else {
        totalErrors++;
        const reason = (result as PromiseRejectedResult).reason;
        console.error(
          "  [ERROR] " +
            batch[idx].cedula +
            ": " +
            (reason?.message || String(reason))
        );
      }
    });

    const processed = Math.min(i + BATCH_SIZE, unique.length);
    console.log(
      "  [PROGRESO] " +
        processed +
        "/" +
        unique.length +
        " (" +
        ((processed / unique.length) * 100).toFixed(1) +
        "%)"
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalInDb = await prisma.runner.count();

  console.log("\n==================================================");
  console.log("  RESUMEN DE IMPORTACIÓN");
  console.log("==================================================");
  console.log("  Registros en CSV:        " + records.length);
  console.log("  Válidos únicos:          " + unique.length);
  console.log("  Omitidos:                " + skipped.length);
  console.log("  Nuevos creados:          " + totalCreated);
  console.log("  Existentes actualizados: " + totalUpdated);
  console.log("  Errores:                 " + totalErrors);
  console.log("  Total corredores en BD:  " + totalInDb);
  console.log("  Tiempo:                  " + elapsed + "s");
  console.log("==================================================");
  console.log(
    "Listo. Relanza este script con el mismo CSV o con lotes nuevos:"
  );
  console.log("los corredores existentes NO se duplican y sus datos");
  console.log("válidos se conservan (merge sin borrar).");

  await prisma.$disconnect();
}

importRunners().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
