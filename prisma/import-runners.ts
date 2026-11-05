/**
 * ============================================================
 * FASE 2: Importacion Masiva de Corredores (Runners)
 * 
 * Script: prisma/import-runners.ts
 * Ejecucion: npx ts-node prisma/import-runners.ts
 * 
 * Lee datos historicos de corredores desde un archivo CSV
 * y los importa a la base de datos usando upsert masivo por lotes.
 * 
 * Estandar: World Athletics / UCI / World Triathlon
 * Compatible con datos ChuckScore / IPICO
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

// --- Configuracion ---
const CSV_FILE = path.resolve(process.cwd(), "corredores_vbr.csv");
const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes("--dry-run");

// --- Prisma Client ---
const prisma = new PrismaClient();

// --- Interfaces ---
interface RawRunnerRow {
  NOMBRE?: string;
  APELLIDO?: string;
  "FECA DE NAC"?: string;
  "FECHA NAC"?: string;
  "FECHA DE NACIMIENTO"?: string;
  SEXO?: string;
  TEAM?: string;
  CIUDAD?: string;
  "E MAIL"?: string;
  EMAIL?: string;
  TALLA?: string;
  TELEFONO?: string;
  CEDULA?: string;
  [key: string]: string | undefined;
}

interface SanitizedRunner {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  genero: string;
  team: string | null;
  ciudad: string | null;
  email: string | null;
  tallaFranela: string | null;
  telefono: string | null;
}

// --- Utilidades de Sanitizacion ---

/** Limpia una cadena: trim, null si vacia */
function cleanString(value: string | undefined | null): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  return cleaned === "" || cleaned === "-" || cleaned === "N/A" ? null : cleaned;
}

/** Limpia la cedula: remueve espacios, guiones, puntos
 *  Ej: "V- 12.345.678" -> "V12345678"
 */
function cleanCedula(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim().replace(/[\s.\-]/g, "").toUpperCase();
}

/** Parsea fechas en multiples formatos:
 *  - MM/DD/YYYY (formato estadounidense)
 *  - DD/MM/YYYY (formato latino)
 *  - YYYY-MM-DD (ISO)
 *  - DD-MM-YYYY
 *  Retorna null si no puede parsear
 */
function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw === "-" || raw === "N/A") return null;

  // Intentar ISO primero: YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  // Formato con /: puede ser MM/DD/YYYY o DD/MM/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    
    let day: number;
    let month: number;
    
    if (a > 12 && b <= 12) {
      // DD/MM/YYYY
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      // MM/DD/YYYY
      month = a;
      day = b;
    } else {
      // Ambos <= 12, asumimos DD/MM/YYYY (formato latino/Venezuela)
      day = a;
      month = b;
    }
    
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Formato con -: DD-MM-YYYY
  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const d = Number(dashMatch[1]);
    const m = Number(dashMatch[2]);
    const y = Number(dashMatch[3]);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  // Ultimo recurso: intentar Date nativo
  const nativeDate = new Date(raw);
  if (!isNaN(nativeDate.getTime())) return nativeDate;

  return null;
}

/** Normaliza el genero a 'M' o 'F' */
function cleanGender(value: string | undefined | null): string {
  if (!value) return "M";
  const normalized = value.trim().toUpperCase();
  if (["F", "FEM", "FEMENINO", "FEMENINA", "W"].includes(normalized)) return "F";
  if (["M", "MAS", "MASC", "MASCULINO", "MASCULINA", "H"].includes(normalized)) return "M";
  return "M";
}

/** Normaliza talla de franela */
function cleanShirtSize(value: string | undefined | null): string | null {
  if (!value) return null;
  const size = value.trim().toUpperCase();
  
  const sizeMap: Record<string, string> = {
    "XS": "XS", "EXTRAS": "XS", "EXTRA SMALL": "XS",
    "S": "S", "SMALL": "S", "SM": "S",
    "M": "M", "MED": "M", "MEDIUM": "M", "MD": "M",
    "L": "L", "LARGE": "L", "LG": "L",
    "XL": "XL", "EXTRAL": "XL", "EXTRA LARGE": "XL", "XG": "XL",
    "XXL": "XXL", "2XL": "XXL", "EXTRA EXTRA LARGE": "XXL",
    "XXXL": "XXXL", "3XL": "XXXL",
  };

  return sizeMap[size] || size;
}

// --- Sanitizacion Principal ---

function sanitizeRow(row: RawRunnerRow): SanitizedRunner | null {
  const cedula = cleanCedula(row.CEDULA);
  if (!cedula || cedula.length < 3) {
    return null;
  }

  const nombres = cleanString(row.NOMBRE);
  const apellidos = cleanString(row.APELLIDO);
  if (!nombres || !apellidos) {
    return null;
  }

  const dateStr = row["FECA DE NAC"] || row["FECHA NAC"] || row["FECHA DE NACIMIENTO"];
  const fechaNacimiento = parseDate(dateStr);
  if (!fechaNacimiento) {
    console.warn("  [WARN] Cedula " + cedula + ": fecha invalida \"" + (dateStr || "") + "\", usando default");
  }

  return {
    cedula,
    nombres,
    apellidos,
    fechaNacimiento: fechaNacimiento || new Date(1990, 0, 1),
    genero: cleanGender(row.SEXO),
    team: cleanString(row.TEAM),
    ciudad: cleanString(row.CIUDAD),
    email: cleanString(row["E MAIL"] || row.EMAIL),
    tallaFranela: cleanShirtSize(row.TALLA),
    telefono: cleanString(row.TELEFONO),
  };
}

// --- Importacion Masiva con Upsert ---

async function importRunners(): Promise<void> {
  console.log("==================================================");
  console.log("  VBR - Importacion Masiva de Corredores");
  console.log("  Archivo: " + CSV_FILE);
  console.log("  Batch size: " + BATCH_SIZE);
  console.log("  Modo: " + (DRY_RUN ? "DRY RUN (simulacion)" : "PRODUCCION"));
  console.log("==================================================\n");

  // Leer CSV
  if (!fs.existsSync(CSV_FILE)) {
    console.error("ERROR: Archivo no encontrado: " + CSV_FILE);
    console.error("  Coloca el archivo corredores_vbr.csv en la raiz del proyecto");
    console.error("  Formato esperado del CSV:");
    console.error("    NOMBRE, APELLIDO, \"FECA DE NAC\", SEXO, TEAM, CIUDAD, \"E MAIL\", TALLA, TELEFONO, CEDULA");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, "utf-8");
  const cleanContent = csvContent.replace(/^\uFEFF/, "");

  const records: RawRunnerRow[] = parse(cleanContent, {
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  console.log("[CSV] Registros leidos: " + records.length + "\n");

  // Sanitizar todos los registros
  const sanitized: SanitizedRunner[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  records.forEach((row, index) => {
    const runner = sanitizeRow(row);
    if (runner) {
      sanitized.push(runner);
    } else {
      const cedula = row.CEDULA || "SIN CEDULA";
      const nombre = row.NOMBRE || "SIN NOMBRE";
      skipped.push({ row: index + 2, reason: "Cedula: " + cedula + ", Nombre: " + nombre });
    }
  });

  console.log("[OK] Registros validos: " + sanitized.length);
  console.log("[SKIP] Registros omitidos: " + skipped.length);
  
  if (skipped.length > 0 && skipped.length <= 20) {
    skipped.forEach(function(s) { console.log("   Fila " + s.row + ": " + s.reason); });
  } else if (skipped.length > 20) {
    skipped.slice(0, 20).forEach(function(s) { console.log("   Fila " + s.row + ": " + s.reason); });
    console.log("   ... y " + (skipped.length - 20) + " mas");
  }
  console.log("");

  if (sanitized.length === 0) {
    console.log("[WARN] No hay registros validos para importar.");
    await prisma.$disconnect();
    return;
  }

  // DRY RUN: solo mostrar, no guardar
  if (DRY_RUN) {
    console.log("[DRY RUN] Primeros 5 registros sanitizados:");
    sanitized.slice(0, 5).forEach(function(r, i) {
      const dateStr = r.fechaNacimiento.toISOString().split("T")[0];
      console.log("  " + (i + 1) + ". " + r.cedula + " | " + r.nombres + " " + r.apellidos + " | " + dateStr + " | " + r.genero + " | " + (r.team || "-") + " | " + (r.ciudad || "-"));
    });
    console.log("\n  Total: " + sanitized.length + " corredores serian importados/actualizados.");
    await prisma.$disconnect();
    return;
  }

  // Upsert por lotes
  let totalCreated = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
    const batch = sanitized.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(sanitized.length / BATCH_SIZE);

    console.log("[BATCH] Lote " + batchNum + "/" + totalBatches + " (" + batch.length + " registros)...");

    const results = await Promise.allSettled(
      batch.map(function(runner) {
        return prisma.runner.upsert({
          where: { cedula: runner.cedula },
          update: {
            nombres: runner.nombres,
            apellidos: runner.apellidos,
            fechaNacimiento: runner.fechaNacimiento,
            genero: runner.genero,
            team: runner.team,
            ciudad: runner.ciudad,
            email: runner.email,
            tallaFranela: runner.tallaFranela,
            telefono: runner.telefono,
          },
          create: runner,
        });
      })
    );

    results.forEach(function(result, idx) {
      if (result.status === "fulfilled") {
        totalCreated++;
      } else {
        totalErrors++;
        const reason = result.reason;
        console.error("  [ERROR] Cedula " + batch[idx].cedula + ": " + (reason?.message || String(reason)));
      }
    });

    const processed = Math.min(i + BATCH_SIZE, sanitized.length);
    const pct = ((processed / sanitized.length) * 100).toFixed(1);
    console.log("  [PROGRESS] " + processed + "/" + sanitized.length + " (" + pct + "%)");
  }

  // Resumen Final
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalInDb = await prisma.runner.count();

  console.log("\n==================================================");
  console.log("  RESUMEN DE IMPORTACION");
  console.log("==================================================");
  console.log("  Registros en CSV:         " + records.length);
  console.log("  Validos sanitizados:      " + sanitized.length);
  console.log("  Omitidos:                 " + skipped.length);
  console.log("  Importados/Actualizados:  " + totalCreated);
  console.log("  Errores DB:               " + totalErrors);
  console.log("  Total en BD:              " + totalInDb);
  console.log("  Tiempo:                   " + elapsed + "s");
  console.log("==================================================\n");

  await prisma.$disconnect();
}

// --- Ejecucion ---
importRunners().catch(function(error) {
  console.error("Error fatal:", error);
  process.exit(1);
});
