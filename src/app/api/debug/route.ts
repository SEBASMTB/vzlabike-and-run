import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    
    // Check columns
    const cols = await db.$queryRawUnsafe(`PRAGMA table_info("Event")`);
    
    // Try simple query
    let simpleResult = null;
    try {
      simpleResult = await db.$queryRawUnsafe(`SELECT id, title FROM "Event" LIMIT 1`);
    } catch (e: any) {
      simpleResult = { error: e.message };
    }

    // Check what driver is being used
    const envInfo = {
      DATABASE_URL: process.env.DATABASE_URL || '(empty)',
      NODE_ENV: process.env.NODE_ENV,
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || '(empty)',
    };

    return NextResponse.json({
      columns: cols,
      simpleQuery: simpleResult,
      env: envInfo,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
