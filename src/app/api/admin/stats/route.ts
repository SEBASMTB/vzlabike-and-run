import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    // Use counts only (no include) to avoid Prisma type mismatch with Registration
    const totalEvents = await db.event.count();
    const totalRegistrations = await db.registration.count();

    // Use raw SQL for counts by status (avoids Prisma field type issues)
    let confirmedRegistrations = 0;
    let pendingRegistrations = 0;
    try {
      const confirmed = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM Registration WHERE LOWER(status) = 'confirmed' OR LOWER(status) = 'approved'`
      ) as any[];
      confirmedRegistrations = confirmed[0]?.count || 0;
    } catch {}

    try {
      const pending = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM Registration WHERE LOWER(status) = 'pending'`
      ) as any[];
      pendingRegistrations = pending[0]?.count || 0;
    } catch {}

    // Recent registrations via raw SQL (avoids Prisma include issues)
    let recentRegistrations: any[] = [];
    try {
      recentRegistrations = await db.$queryRawUnsafe(
        `SELECT r.id, r.firstName, r.lastName, r.email, r.status, r.createdAt,
                e.title as eventTitle
         FROM Registration r
         LEFT JOIN Event e ON r.eventId = e.id
         ORDER BY r.createdAt DESC
         LIMIT 10`
      ) as any[];
    } catch {}

    // Events with counts via raw SQL
    let eventsWithCount: any[] = [];
    try {
      eventsWithCount = await db.$queryRawUnsafe(
        `SELECT e.id, e.title, e.date, e.location, e.sportType, e.status, e.price, e.distance,
                (SELECT COUNT(*) FROM Registration r WHERE r.eventId = e.id) as totalRegistrations,
                (SELECT COUNT(*) FROM Registration r WHERE r.eventId = e.id AND (LOWER(r.status) = 'confirmed' OR LOWER(r.status) = 'approved')) as confirmedRegistrations
         FROM Event e
         ORDER BY e.date ASC`
      ) as any[];

      // Calculate revenue
      eventsWithCount = eventsWithCount.map((e: any) => ({
        ...e,
        revenue: (e.confirmedRegistrations || 0) * (e.price || 0),
        category: e.sportType,
      }));
    } catch {}

    const estimatedRevenue = eventsWithCount.reduce(
      (sum: number, e: any) => sum + (e.revenue || 0),
      0
    );

    return NextResponse.json({
      totalEvents,
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      estimatedRevenue,
      recentRegistrations,
      eventsWithCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
