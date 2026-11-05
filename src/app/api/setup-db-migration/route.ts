import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/setup-db-migration
 * Verify mtbProfile column exists in Registration table.
 */
export async function GET() {
  try {
    try {
      await db.$queryRaw`SELECT mtbProfile FROM Registration LIMIT 1`;
      return NextResponse.json({
        success: true,
        message: "Column mtbProfile already exists",
      });
    } catch {
      // Column doesn't exist, try to add it
      try {
        await db.$executeRawUnsafe("ALTER TABLE Registration ADD COLUMN mtbProfile TEXT NOT NULL DEFAULT ''");
        return NextResponse.json({
          success: true,
          message: "Column mtbProfile added successfully",
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: err?.message || String(err) },
          { status: 500 }
        );
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
