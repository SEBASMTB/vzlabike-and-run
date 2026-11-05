import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const [
      totalEvents,
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      recentRegistrations,
      eventsWithPrice,
    ] = await Promise.all([
      db.event.count(),
      db.registration.count(),
      db.registration.count({ where: { status: "confirmed" } }),
      db.registration.count({ where: { status: "pending" } }),
      db.registration.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { event: { select: { title: true } } },
      }),
      db.event.findMany({
        orderBy: { date: "asc" },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          sportType: true,
          status: true,
          price: true,
          distance: true,
          _count: { select: { registrations: true } },
          registrations: {
            where: { status: "confirmed" },
            select: { id: true },
          },
        },
      }),
    ]);

    // Calculate estimated revenue from confirmed registrations
    let estimatedRevenue = 0;
    const eventsWithCount = eventsWithPrice.map((e) => {
      const confirmedCount = e.registrations.length;
      const revenue = confirmedCount * e.price;
      estimatedRevenue += revenue;
      return {
        id: e.id,
        title: e.title,
        date: e.date,
        location: e.location,
        category: e.sportType,
        status: e.status,
        price: e.price,
        distance: e.distance,
        totalRegistrations: e._count.registrations,
        confirmedRegistrations: confirmedCount,
        revenue,
      };
    });

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
