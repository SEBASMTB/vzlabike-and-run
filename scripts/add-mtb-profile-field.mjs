import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.vercel', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  envVars[key] = val;
}

const tursoUrl = envVars.TURSO_DATABASE_URL || '';
const tursoToken = envVars.TURSO_AUTH_TOKEN || '';

console.log('Turso URL starts with:', tursoUrl.slice(0, 20));
console.log('Turso Token present:', !!tursoToken);

if (!tursoUrl) {
  console.error('No TURSO_DATABASE_URL found');
  process.exit(1);
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken || undefined,
});

async function main() {
  try {
    const result = await client.execute("SELECT mtbProfile FROM Registration LIMIT 1");
    console.log('Column mtbProfile already exists!');
    process.exit(0);
  } catch (e) {
    if (e.message.includes('no such column')) {
      console.log('Column mtbProfile missing, adding it...');
    } else {
      console.error('Unexpected error:', e.message);
      process.exit(1);
    }
  }

  await client.execute("ALTER TABLE Registration ADD COLUMN mtbProfile TEXT NOT NULL DEFAULT ''");
  console.log('Column mtbProfile added successfully!');

  const verify = await client.execute("PRAGMA table_info(Registration)");
  const cols = verify.rows.map(r => r.name);
  console.log('Registration columns:', cols);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
