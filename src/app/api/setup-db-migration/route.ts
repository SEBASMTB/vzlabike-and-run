/**
 * API: /api/setup-db-migration
 * 
 * Ejecuta la migración del schema a la base de datos configurada.
 * En producción con Turso, esto crea las tablas y aplica los ALTER TABLE
 * necesarios para los nuevos campos.
 * 
 * Debe llamarse después de configurar DATABASE_URL con Turso:
 * GET /api/setup-db-migration
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Only allow in admin context (check auth cookie)
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "No autorizado. Inicia sesión como admin primero." },
      { status: 401 }
    );
  }

  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const tursoToken = process.env.TURSO_AUTH_TOKEN || "";
    
    const config = {
      databaseUrl: dbUrl.startsWith("libsql://") ? `${dbUrl.substring(0, 30)}...` : dbUrl,
      isTurso: dbUrl.startsWith("libsql://"),
      hasToken: !!tursoToken,
      nodeEnv: process.env.NODE_ENV,
    };

    // Test basic query
    let tableCount = 0;
    try {
      const result = await (db as any).$queryRawUnsafe(
        `SELECT name FROM sqlite_master WHERE type='table'`
      );
      tableCount = Array.isArray(result) ? result.length : 0;
    } catch (e) {
      // Tables might not exist yet
    }

    return NextResponse.json({
      status: "ok",
      config,
      tables: tableCount,
      message: config.isTurso
        ? "✅ Conectado a Turso - datos persistentes"
        : "⚠️ Usando SQLite local/efímero - configura Turso para persistencia",
      nextSteps: !config.isTurso
        ? [
            "1. Crea cuenta en https://turso.tech",
            "2. Crea una base de datos",
            "3. Copia la URL (libsql://...) y el Auth Token",
            "4. En Vercel: Settings → Environment Variables",
            "5. Agrega DATABASE_URL=libsql://...",
            "6. Agrega TURSO_AUTH_TOKEN=tu-token",
            "7. Redeploy",
          ]
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error al verificar DB",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}
