import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// ── Simple in-memory cache for public GET /api/events ─────────────────────
// Reduces Turso queries dramatically during traffic spikes.
// Cache invalidates on any POST (admin creates event).
let eventsCache: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 15_000; // 15 seconds

export async function GET() {
  try {
    // Return cached response if still fresh
    const now = Date.now();
    if (eventsCache && now - eventsCache.timestamp < CACHE_TTL) {
      return new NextResponse(eventsCache.data, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
          "X-Cache": "HIT",
        },
      });
    }

    const db = await getDb();
    const events = await db.event.findMany({
      orderBy: { date: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    const data = JSON.stringify(events);

    // Store in cache
    eventsCache = { data, timestamp: now };

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[API /events] Error:", err);
    return NextResponse.json(
      { error: "Error al obtener eventos", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      title, slug, description, date, location, distance, category,
      sportType, imageUrl, bannerImage, price, priceBs,
      maxParticipants, featured, status,
      organizer, prizes, rules, kitInfo, sponsors, categories,
      ageCalcMode, categoryInterval, hasShirt, hasShirtOption, shirtPrice,
      requiresFederationLicense, bannerHorizontalUrl, bannerVerticalUrl,
      shirtImage, kitInfoDetails, prizesImages, rulesFile, sponsorsLogos,
    } = body;

    if (!title || !slug || !date || !location || !distance || !category) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const event = await db.event.create({
      data: {
        title,
        slug,
        description: description || "",
        date: new Date(date),
        location,
        distance,
        sportType: sportType || category || "running",
        imageUrl: imageUrl || "",
        bannerImage: bannerImage || "",
        bannerHorizontalUrl: bannerHorizontalUrl || null,
        bannerVerticalUrl: bannerVerticalUrl || null,
        hasShirtOption: hasShirtOption || "OPTIONAL",
        shirtPrice: shirtPrice ?? null,
        shirtImage: shirtImage || "",
        kitInfoDetails: kitInfoDetails || "",
        price: price || 0,
        priceBs: priceBs || 0,
        maxParticipants: maxParticipants || 500,
        featured: featured || false,
        status: status || "upcoming",
        organizer: organizer || "",
        prizes: prizes || "",
        prizesImages: prizesImages || "[]",
        rules: rules || "",
        rulesFile: rulesFile || "",
        kitInfo: kitInfo || "",
        sponsors: sponsors || "",
        sponsorsLogos: sponsorsLogos || "[]",
        categories: categories || "",
        ageCalcMode: ageCalcMode || "calendar_year",
        categoryInterval: categoryInterval || "10",
        hasShirt: hasShirt !== false,
        requiresFederationLicense: requiresFederationLicense || false,
      },
    });

    // Invalidate cache when new event is created
    eventsCache = null;

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Error creating event:", err);
    return NextResponse.json(
      { error: "Error al crear evento", detail: String(err) },
      { status: 500 }
    );
  }
}
