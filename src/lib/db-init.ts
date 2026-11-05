// Explicit DB initialization for API routes
// Ensures tables exist and seed data is loaded before any query
//
// SAFETY GUARANTEES:
//   • NEVER drops or recreates tables – data is always preserved
//   • Uses only CREATE TABLE IF NOT EXISTS (safe no-op when table exists)
//   • Adds missing columns via ALTER TABLE ADD COLUMN (non-destructive)
//   • Retries failed raw queries with exponential backoff (1s / 2s / 4s)
//   • Seeds ONLY when the Event table has 0 rows
//   • Disconnects temporary client after initialization

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// ── DDL (CREATE TABLE IF NOT EXISTS only – NO DROP TABLE ever) ─────────────

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'running',
    "sportType" TEXT NOT NULL DEFAULT 'running',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "bannerImage" TEXT NOT NULL DEFAULT '',
    "price" REAL NOT NULL DEFAULT 0,
    "priceBs" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "maxParticipants" INTEGER NOT NULL DEFAULT 500,
    "featured" BOOLEAN NOT NULL DEFAULT 0,
    "organizer" TEXT NOT NULL DEFAULT '',
    "prizes" TEXT NOT NULL DEFAULT '',
    "rules" TEXT NOT NULL DEFAULT '',
    "kitInfo" TEXT NOT NULL DEFAULT '',
    "sponsors" TEXT NOT NULL DEFAULT '',
    "categories" TEXT NOT NULL DEFAULT '',
    "ageCalcMode" TEXT NOT NULL DEFAULT 'calendar_year',
    "categoryInterval" TEXT NOT NULL DEFAULT '10',
    "hasShirt" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event"("slug");

CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "shirtSize" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "team" TEXT NOT NULL DEFAULT '',
    "emergencyContact" TEXT NOT NULL DEFAULT '',
    "emergencyPhone" TEXT NOT NULL DEFAULT '',
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentRef" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "waiverAccepted" BOOLEAN NOT NULL DEFAULT 0,
    "bibNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mtbProfile" TEXT NOT NULL DEFAULT '',
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" REAL NOT NULL DEFAULT 0,
    "priceBs" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "images" TEXT NOT NULL DEFAULT '[]',
    "sizes" TEXT NOT NULL DEFAULT '[]',
    "color" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProductOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "totalPriceBs" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentRef" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

// ── Seed data (8 events, NEVER modify) ──────────────────────────────────────

const SEED_EVENTS = [
  {
    id: "evt-la-culata-001",
    title: "LA CULATA",
    slug: "la-culata-2025",
    description: "Evento MTB en las montañas de La Culata. Un desafío para ciclistas de montaña con recorridos técnicos y paisajes espectaculares en plena serranía venezolana.",
    date: "2025-07-20T06:00:00.000Z",
    location: "La Culata, Mérida, Venezuela",
    distance: "40K MTB",
    category: "MTB",
    sportType: "mtb",
    imageUrl: "",
    bannerImage: "",
    price: 55,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 300,
    featured: true,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "event_day",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "evt-campana-admirable-001",
    title: "CAMPAÑA ADMIRABLE",
    slug: "campana-admirable-2025",
    description: "Carrera conmemorativa de la Campaña Admirable. Une la historia y el deporte en este recorrido que celebra el legado de Bolívar. Una experiencia única para corredores y familias.",
    date: "2025-06-15T06:00:00.000Z",
    location: "Venezuela",
    distance: "10K",
    category: "Carrera",
    sportType: "running",
    imageUrl: "",
    bannerImage: "",
    price: 30,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 1500,
    featured: true,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7300000peaj68nvak7u",
    title: "WOMENS RUN",
    slug: "womens-run-2024",
    description: "La carrera más grande de mujeres en Venezuela. Únete a miles de corredoras en esta emocionante prueba de 5K. Un evento diseñado para celebrar la fuerza, determinación y espíritu deportivo de la mujer venezolana.",
    date: "2026-06-06T00:16:23.770Z",
    location: "Caracas, Venezuela",
    distance: "5K",
    category: "Carrera",
    sportType: "running",
    imageUrl: "/event-womens-run.jpg",
    bannerImage: "",
    price: 35,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 2000,
    featured: true,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7320001peaj38mchqx3",
    title: "21K LA AUTOPISTA",
    slug: "21k-la-autopista",
    description: "La media maratón más emblemática del país. Recorre la autopista en una experiencia única con cierre total de vías. Miles de corredores disfrutan de este evento que combina deportividad y espectacularidad.",
    date: "2026-08-23T00:16:23.770Z",
    location: "Autopista Regional del Centro, Venezuela",
    distance: "21K",
    category: "Carrera",
    sportType: "running",
    imageUrl: "/event-21k-autopista.jpg",
    bannerImage: "",
    price: 65,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 5000,
    featured: true,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7330002peajacov64kx",
    title: "FARMALUNA 10K",
    slug: "farmaluna-10k-2024",
    description: "Corre bajo la luz de la luna en esta mágica carrera nocturna. La Farmaluna 10K te ofrece una experiencia diferente con iluminación especial, música en vivo y un ambiente incomparable.",
    date: "2026-05-22T00:16:23.770Z",
    location: "Caracas, Venezuela",
    distance: "10K",
    category: "Carrera",
    sportType: "running",
    imageUrl: "/event-farmaluna.jpg",
    bannerImage: "",
    price: 45,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 3000,
    featured: false,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7340003peajm6kd9t8x",
    title: "LA RUTA DIGITAL",
    slug: "la-ruta-digital-2024",
    description: "El primer evento virtual integrado con tecnología de punta. Corre desde cualquier lugar, registra tu recorrido y compite con atletas de todo el país. Resultados en tiempo real a través de nuestra plataforma VBRWorks.",
    date: "2026-06-07T00:16:23.770Z",
    location: "Virtual - Desde cualquier lugar",
    distance: "10K Virtual",
    category: "Virtual",
    sportType: "running",
    imageUrl: "/event-ruta-digital.jpg",
    bannerImage: "",
    price: 25,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 10000,
    featured: false,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7350004peajb9ekzxqd",
    title: "MARATÓN DE CARACAS",
    slug: "maraton-caracas-2024",
    description: "El maratón más importante de Venezuela. 42 kilómetros de pura emoción recorriendo las calles más emblemáticas de la capital. Un desafío para los corredores más exigentes.",
    date: "2026-07-06T00:16:23.770Z",
    location: "Caracas, Venezuela",
    distance: "42K",
    category: "Carrera",
    sportType: "running",
    imageUrl: "/event-maraton-caracas.jpg",
    bannerImage: "",
    price: 85,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 4000,
    featured: false,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
  {
    id: "cmouqk7360005peajp7h5ns41",
    title: "TRIATLÓN VZLA",
    slug: "triatlon-vzla-2024",
    description: "El triatlón más completo de Venezuela. Distancia olímpica: 1.5km de natación, 40km de ciclismo y 10km de carrera. Un evento para atletas que buscan superar sus límites en tres disciplinas.",
    date: "2026-08-05T00:16:23.770Z",
    location: "Valencia, Venezuela",
    distance: "Distancia Olímpica",
    category: "Triatlón",
    sportType: "running",
    imageUrl: "/event-triatlon.jpg",
    bannerImage: "",
    price: 120,
    priceBs: 0,
    status: "upcoming",
    maxParticipants: 500,
    featured: false,
    organizer: "",
    prizes: "",
    rules: "",
    kitInfo: "",
    sponsors: "",
    categories: "",
    ageCalcMode: "calendar_year",
    categoryInterval: "10",
    hasShirt: true,
  },
];

// ── Expected schema per table (column name → SQLite type for ALTER TABLE) ──

const EXPECTED_COLUMNS: Record<string, Record<string, string>> = {
  Event: {
    id: 'TEXT NOT NULL PRIMARY KEY',
    title: 'TEXT NOT NULL',
    slug: 'TEXT NOT NULL',
    description: "TEXT NOT NULL DEFAULT ''",
    date: 'DATETIME NOT NULL',
    location: 'TEXT NOT NULL',
    distance: 'TEXT NOT NULL',
    category: "TEXT NOT NULL DEFAULT 'running'",
    sportType: "TEXT NOT NULL DEFAULT 'running'",
    imageUrl: "TEXT NOT NULL DEFAULT ''",
    bannerImage: "TEXT NOT NULL DEFAULT ''",
    price: 'REAL NOT NULL DEFAULT 0',
    priceBs: 'REAL NOT NULL DEFAULT 0',
    status: "TEXT NOT NULL DEFAULT 'upcoming'",
    maxParticipants: 'INTEGER NOT NULL DEFAULT 500',
    featured: 'BOOLEAN NOT NULL DEFAULT 0',
    organizer: "TEXT NOT NULL DEFAULT ''",
    prizes: "TEXT NOT NULL DEFAULT ''",
    rules: "TEXT NOT NULL DEFAULT ''",
    kitInfo: "TEXT NOT NULL DEFAULT ''",
    sponsors: "TEXT NOT NULL DEFAULT ''",
    categories: "TEXT NOT NULL DEFAULT ''",
    ageCalcMode: "TEXT NOT NULL DEFAULT 'calendar_year'",
    categoryInterval: "TEXT NOT NULL DEFAULT '10'",
    hasShirt: 'BOOLEAN NOT NULL DEFAULT 1',
    createdAt: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME NOT NULL',
  },
  Registration: {
    id: 'TEXT NOT NULL PRIMARY KEY',
    eventId: 'TEXT NOT NULL',
    firstName: 'TEXT NOT NULL',
    lastName: 'TEXT NOT NULL',
    email: 'TEXT NOT NULL',
    phone: 'TEXT NOT NULL',
    idNumber: "TEXT NOT NULL DEFAULT ''",
    gender: 'TEXT NOT NULL',
    dateOfBirth: 'TEXT NOT NULL',
    shirtSize: "TEXT NOT NULL DEFAULT ''",
    category: 'TEXT NOT NULL',
    team: "TEXT NOT NULL DEFAULT ''",
    emergencyContact: "TEXT NOT NULL DEFAULT ''",
    emergencyPhone: "TEXT NOT NULL DEFAULT ''",
    paymentMethod: "TEXT NOT NULL DEFAULT ''",
    paymentRef: "TEXT NOT NULL DEFAULT ''",
    status: "TEXT NOT NULL DEFAULT 'pending'",
    waiverAccepted: 'BOOLEAN NOT NULL DEFAULT 0',
    bibNumber: 'INTEGER',
    createdAt: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    mtbProfile: "TEXT NOT NULL DEFAULT ''",
  },
  Product: {
    id: 'TEXT NOT NULL PRIMARY KEY',
    eventId: 'TEXT',
    name: 'TEXT NOT NULL',
    description: "TEXT NOT NULL DEFAULT ''",
    price: 'REAL NOT NULL DEFAULT 0',
    priceBs: 'REAL NOT NULL DEFAULT 0',
    imageUrl: "TEXT NOT NULL DEFAULT ''",
    images: "TEXT NOT NULL DEFAULT '[]'",
    sizes: "TEXT NOT NULL DEFAULT '[]'",
    color: "TEXT NOT NULL DEFAULT ''",
    stock: 'INTEGER NOT NULL DEFAULT 0',
    active: 'BOOLEAN NOT NULL DEFAULT 1',
    sortOrder: 'INTEGER NOT NULL DEFAULT 0',
    createdAt: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME NOT NULL',
  },
  ProductOrder: {
    id: 'TEXT NOT NULL PRIMARY KEY',
    productId: 'TEXT NOT NULL',
    firstName: 'TEXT NOT NULL',
    lastName: 'TEXT NOT NULL',
    email: 'TEXT NOT NULL',
    phone: 'TEXT NOT NULL',
    idNumber: "TEXT NOT NULL DEFAULT ''",
    size: "TEXT NOT NULL DEFAULT ''",
    color: "TEXT NOT NULL DEFAULT ''",
    quantity: 'INTEGER NOT NULL DEFAULT 1',
    totalPrice: 'REAL NOT NULL DEFAULT 0',
    totalPriceBs: 'REAL NOT NULL DEFAULT 0',
    paymentMethod: "TEXT NOT NULL DEFAULT ''",
    paymentRef: "TEXT NOT NULL DEFAULT ''",
    status: "TEXT NOT NULL DEFAULT 'pending'",
    notes: "TEXT NOT NULL DEFAULT ''",
    createdAt: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  },
};

// ── Retry helper with exponential backoff ──────────────────────────────────

const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

async function safeRawQuery<T = unknown>(
  prisma: PrismaClient,
  operation: 'query' | 'execute',
  sql: string,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (operation === 'query') {
        return (await prisma.$queryRawUnsafe(sql)) as T;
      } else {
        return (await prisma.$executeRawUnsafe(sql)) as T;
      }
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = RETRY_DELAYS[attempt] ?? 4000;
        console.warn(
          `[db-init] Query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms…`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ── Safe column migration (ALTER TABLE ADD COLUMN for missing columns) ─────

async function migrateMissingColumns(prisma: PrismaClient): Promise<void> {
  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    try {
      const existing = (await safeRawQuery<Array<{ name: string }>>(
        prisma,
        'query',
        `PRAGMA table_info("${table}")`,
      )) as Array<{ name: string }>;

      const existingNames = new Set(existing.map((c) => c.name));

      for (const [col, typeDef] of Object.entries(columns)) {
        if (!existingNames.has(col)) {
          try {
            await safeRawQuery(
              prisma,
              'execute',
              `ALTER TABLE "${table}" ADD COLUMN "${col}" ${typeDef}`,
            );
            console.log(`[db-init] Migration: added column "${col}" to "${table}"`);
          } catch (alterErr) {
            // SQLite ALTER TABLE ADD COLUMN has limitations (e.g. can't add
            // PRIMARY KEY or UNIQUE). Log and continue – don't crash.
            console.warn(
              `[db-init] Could not add column "${col}" to "${table}":`,
              alterErr,
            );
          }
        }
      }
    } catch (pragmaErr) {
      // Table might not exist yet – that's fine, CREATE TABLE IF NOT EXISTS
      // will handle it.
      console.warn(
        `[db-init] Could not read schema for "${table}" (table may not exist yet):`,
        pragmaErr,
      );
    }
  }
}

// ── Initialization ─────────────────────────────────────────────────────────

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Temporary client for init (avoids circular deps with db.ts)
    const tursoUrl = process.env.TURSO_DATABASE_URL || '';
    const tursoToken = process.env.TURSO_AUTH_TOKEN || '';
    const dbUrl = process.env.DATABASE_URL || '';
    let prisma: PrismaClient;

    if (tursoUrl.startsWith('libsql://')) {
      const adapter = new PrismaLibSQL({
        url: tursoUrl,
        authToken: tursoToken || undefined,
        concurrency: 10,
      });
      prisma = new PrismaClient({ adapter });
    } else if (dbUrl.startsWith('libsql://')) {
      const adapter = new PrismaLibSQL({
        url: dbUrl,
        authToken: tursoToken || undefined,
        concurrency: 10,
      });
      prisma = new PrismaClient({ adapter });
    } else if (dbUrl.startsWith('file:')) {
      const adapter = new PrismaLibSQL({
        url: dbUrl,
        concurrency: 10,
      });
      prisma = new PrismaClient({ adapter });
    } else if (process.env.NODE_ENV === 'production') {
      const adapter = new PrismaLibSQL({
        url: 'file:/tmp/vzlabike.db',
        concurrency: 10,
      });
      prisma = new PrismaClient({ adapter });
    } else {
      prisma = new PrismaClient();
    }

    try {
      console.log("[db-init] Verificando/creando tablas...");

      // Step 1: CREATE TABLE IF NOT EXISTS (safe – no-op when table exists)
      const statements = CREATE_TABLES_SQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const sql of statements) {
        await safeRawQuery(prisma, 'execute', sql);
      }
      console.log("[db-init] Tablas verificadas (CREATE IF NOT EXISTS OK).");

      // Step 2: Migrate missing columns (safe – ADD COLUMN is non-destructive)
      await migrateMissingColumns(prisma);

      // Step 3: Seed events ONLY if the table is completely empty
      const count = await prisma.event.count();
      if (count === 0) {
        console.log(`[db-init] Tabla vacía, sembrando ${SEED_EVENTS.length} eventos...`);
        for (const event of SEED_EVENTS) {
          await prisma.event.create({
            data: {
              ...event,
              createdAt: new Date("2026-05-07T00:16:23.772Z"),
              updatedAt: new Date("2026-05-07T00:16:23.772Z"),
            },
          });
        }
        console.log("[db-init] Seed completado.");
      } else {
        console.log(`[db-init] Ya hay ${count} eventos en la BD. No se sobreescriben.`);
      }

      initialized = true;
    } catch (err) {
      console.error("[db-init] Error:", err);
      initPromise = null; // Allow retry
    } finally {
      // Always disconnect the temporary client
      await prisma.$disconnect();
    }
  })();

  return initPromise;
}
