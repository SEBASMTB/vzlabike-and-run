import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getEventsCache,
  setEventsCache,
  invalidateEventsCache,
  isEventsCacheFresh,
} from "@/lib/events-cache";

export { invalidateEventsCache };

export async function GET(request: NextRequest) {
  try {
    // ?fresh=1 → admin/internal consumers: bypass in-memory cache AND edge cache
    const fresh = request.nextUrl.searchParams.get("fresh") === "1";
    const now = Date.now();

    if (fresh) {
      const db = await getDb();
      const events = await db.$queryRawUnsafe(
        `SELECT id, title, slug, sportType, date, location, distance,
                description, price, priceBs, status, featured, hasShirt,
                hasShirtOption, shirtPrice, categoryInterval, ageCalcMode,
                organizer, maxParticipants, requiresFederationLicense,
                createdAt, updatedAt
         FROM Event
         ORDER BY date ASC`
      );
      return new NextResponse(JSON.stringify(events), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
          "X-Cache": "FRESH",
        },
      });
    }

    // Return cached response if still fresh
    if (isEventsCacheFresh(now)) {
      return new NextResponse(getEventsCache()!.data, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
          "X-Cache": "HIT",
        },
      });
    }

    const db = await getDb();
    // Use raw SQL to select ONLY lightweight fields (exclude base64 images)
    // This reduces response from 2.3MB to ~50KB
    const events = await db.$queryRawUnsafe(
      `SELECT id, title, slug, sportType, date, location, distance,
              description, price, priceBs, status, featured, hasShirt,
              hasShirtOption, shirtPrice, categoryInterval, ageCalcMode,
              organizer, maxParticipants, requiresFederationLicense,
              createdAt, updatedAt
       FROM Event
       ORDER BY date ASC`
    );

    const data = JSON.stringify(events);

    // Store in cache
    setEventsCache(data, now);

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
        shirtPrice: shirtPrice != null ? shirtPrice : 0,
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
    invalidateEventsCache();

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Error creating event:", err);
    return NextResponse.json(
      { error: "Error al crear evento", detail: String(err) },
      { status: 500 }
    );
  }
}
