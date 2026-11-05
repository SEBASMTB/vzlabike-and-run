import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/setup-db
 * Creates missing tables and columns in the Turso database.
 */
export async function GET() {
  const results: string[] = [];

  try {
    // --- Event columns (legacy migrations) ---
    const eventColumns = [
      { name: "ageCalcMode", def: "TEXT NOT NULL DEFAULT 'calendar_year'" },
      { name: "sportType", def: "TEXT NOT NULL DEFAULT 'running'" },
      { name: "bannerImage", def: "TEXT NOT NULL DEFAULT ''" },
      { name: "priceBs", def: "REAL NOT NULL DEFAULT 0" },
      { name: "categories", def: "TEXT NOT NULL DEFAULT ''" },
      { name: "kitInfo", def: "TEXT NOT NULL DEFAULT ''" },
      { name: "hasShirt", def: "INTEGER NOT NULL DEFAULT 1" },
    ];

    for (const col of eventColumns) {
      try {
        await db.$executeRawUnsafe(
          `ALTER TABLE Event ADD COLUMN ${col.name} ${col.def}`
        );
        results.push(`Added column: Event.${col.name}`);
      } catch (err: any) {
        if (err?.message?.includes("duplicate column")) {
          results.push(`Column Event.${col.name} already exists`);
        } else {
          results.push(`Event.${col.name} error: ${err?.message}`);
        }
      }
    }

    // --- Create Product table ---
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Product (
          id TEXT NOT NULL PRIMARY KEY,
          eventId TEXT,
          name TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          price REAL NOT NULL DEFAULT 0,
          priceBs REAL NOT NULL DEFAULT 0,
          imageUrl TEXT NOT NULL DEFAULT '',
          images TEXT NOT NULL DEFAULT '[]',
          sizes TEXT NOT NULL DEFAULT '[]',
          color TEXT NOT NULL DEFAULT '',
          stock INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1,
          sortOrder INTEGER NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE SET NULL
        )
      `);
      results.push("Table Product created/verified");
    } catch (err: any) {
      results.push(`Product table error: ${err?.message}`);
    }

    // --- Create ProductOrder table ---
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ProductOrder (
          id TEXT NOT NULL PRIMARY KEY,
          productId TEXT NOT NULL,
          firstName TEXT NOT NULL DEFAULT '',
          lastName TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          idNumber TEXT NOT NULL DEFAULT '',
          size TEXT NOT NULL DEFAULT '',
          color TEXT NOT NULL DEFAULT '',
          quantity INTEGER NOT NULL DEFAULT 1,
          totalPrice REAL NOT NULL DEFAULT 0,
          totalPriceBs REAL NOT NULL DEFAULT 0,
          paymentMethod TEXT NOT NULL DEFAULT '',
          paymentRef TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT NOT NULL DEFAULT '',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
        )
      `);
      results.push("Table ProductOrder created/verified");
    } catch (err: any) {
      results.push(`ProductOrder table error: ${err?.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Database setup complete",
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err), results },
      { status: 500 }
    );
  }
}
