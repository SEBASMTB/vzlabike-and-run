/**
 * Script de migración para Turso
 * 
 * Agrega las columnas nuevas del modelo Event a la base de datos Turso.
 * Se ejecuta automáticamente en el primer request gracias a db.ts,
 * pero este script permite ejecutarlo manualmente si es necesario.
 * 
 * Uso: node scripts/migrate-turso.js
 * 
 * Requiere variables de entorno:
 * - DATABASE_URL=libsql://...
 * - TURSO_AUTH_TOKEN=...
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@libsql/client');

const url = process.env.DATABASE_URL || '';
const token = process.env.TURSO_AUTH_TOKEN || '';

if (!url.startsWith('libsql://')) {
  console.error('❌ DATABASE_URL debe ser una URL libsql:// de Turso');
  console.error('   Actual:', url);
  process.exit(1);
}

if (!token) {
  console.error('❌ TURSO_AUTH_TOKEN no está configurado');
  process.exit(1);
}

const client = createClient({ url, authToken: token });

// Columnas nuevas del modelo Event (migración 2026-11-05)
const EVENT_NEW_COLUMNS = [
  { name: 'shirtImage', def: "TEXT NOT NULL DEFAULT ''" },
  { name: 'kitInfoDetails', def: "TEXT NOT NULL DEFAULT ''" },
  { name: 'prizesImages', def: "TEXT NOT NULL DEFAULT '[]'" },
  { name: 'rulesFile', def: "TEXT NOT NULL DEFAULT ''" },
  { name: 'sponsorsLogos', def: "TEXT NOT NULL DEFAULT '[]'" },
  { name: 'bannerHorizontalUrl', def: 'TEXT' },
  { name: 'bannerVerticalUrl', def: 'TEXT' },
  { name: 'requiresFederationLicense', def: 'BOOLEAN NOT NULL DEFAULT 0' },
  { name: 'hasShirtOption', def: "TEXT NOT NULL DEFAULT 'OPTIONAL'" },
  { name: 'shirtPrice', def: 'REAL' },
];

async function migrate() {
  console.log('=== Migración de Turso ===');
  console.log('URL:', url.substring(0, 40) + '...');
  console.log('');

  // Verificar conexión
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  console.log(`✅ Conexión OK - ${tables.rows.length} tablas encontradas`);

  // Migrar Event
  const eventCols = await client.execute('PRAGMA table_info(Event)');
  const existing = eventCols.rows.map((r) => r.name);
  console.log(`Event: ${existing.length} columnas actuales`);

  let added = 0;
  for (const col of EVENT_NEW_COLUMNS) {
    if (!existing.includes(col.name)) {
      try {
        await client.execute(
          `ALTER TABLE Event ADD COLUMN "${col.name}" ${col.def}`
        );
        console.log(`  ✅ Agregada: ${col.name}`);
        added++;
      } catch (e) {
        console.log(`  ⚠️ ${col.name}: ${e.message}`);
      }
    } else {
      console.log(`  ⏭️ Ya existe: ${col.name}`);
    }
  }

  console.log('');
  console.log(`=== Resumen ===`);
  console.log(`Columnas agregadas: ${added}`);

  const events = await client.execute('SELECT COUNT(*) as count FROM Event');
  console.log(`Eventos en BD: ${events.rows[0].count}`);
  console.log('✅ Migración completa');
}

migrate().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
