import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health check endpoint for monitoring.
 * Returns DB connectivity status and basic system info.
 * Use this with UptimeRobot, BetterUptime, or similar services.
 *
 * GET /api/health
 */
export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let dbLatency = 0;
  let eventCount = 0;
  let registrationCount = 0;
  let dbError = "";

  try {
    const dbStart = Date.now();
    eventCount = await db.event.count();
    registrationCount = await db.registration.count();
    dbLatency = Date.now() - dbStart;
    dbOk = true;
  } catch (err) {
    dbError = String(err);
  }

  const totalLatency = Date.now() - start;

  const status = dbOk ? "ok" : "degraded";
  const statusCode = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "2.0.0",
      checks: {
        database: {
          status: dbOk ? "ok" : "error",
          latency_ms: dbLatency,
          error: dbError || undefined,
          events: eventCount,
          registrations: registrationCount,
        },
      },
      performance: {
        total_latency_ms: totalLatency,
        memory_usage_mb: Math.round(
          (process.memoryUsage?.().heapUsed || 0) / 1024 / 1024
        ),
      },
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
        "X-Response-Time": `${totalLatency}ms`,
      },
    }
  );
}
