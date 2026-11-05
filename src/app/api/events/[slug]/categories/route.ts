import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCategoriesForSport, CategoryOption } from "@/lib/categories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await db.event.findUnique({
      where: { slug },
      select: {
        sportType: true,
        ageCalcMode: true,
        date: true,
        title: true,
        openCategories: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Get predefined categories for this sport (now includes gender info)
    const allSportCategories = getCategoriesForSport(event.sportType || "running");

    // Parse open categories from event config
    const openCatsArray = event.openCategories
      ? event.openCategories.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    let categories: CategoryOption[] = [];

    if (openCatsArray.length > 0) {
      // Match predefined categories by value
      categories = allSportCategories.filter(cat => openCatsArray.includes(cat.value));

      // Handle old-format categories (without -M/-F suffix) for backward compatibility
      for (const catValue of openCatsArray) {
        if (!categories.find(c => c.value === catValue) && !catValue.startsWith("CUSTOM-")) {
          const maleVariant = allSportCategories.find(c => c.value === `${catValue}-M`);
          if (maleVariant) {
            categories.push(maleVariant);
          }
        }
      }

      // Add custom categories (CUSTOM-*)
      for (const catValue of openCatsArray) {
        if (catValue.startsWith("CUSTOM-") && !categories.find(c => c.value === catValue)) {
          const parts = catValue.replace("CUSTOM-", "").split("-");
          const genderSuffix = parts.pop();
          const name = parts.join(" ").replace(/_/g, " ");
          const genderLabel = genderSuffix === "F" ? "Damas" : "Varones";
          categories.push({
            value: catValue,
            label: `${name} - ${genderLabel}`,
            minAge: 0,
            maxAge: 999,
            gender: genderSuffix === "F" ? "F" : genderSuffix === "M" ? "M" : undefined,
          });
        }
      }
    }

    return NextResponse.json({
      categories,
      ageCalcMode: event.ageCalcMode || "calendar_year",
      sportType: event.sportType,
      eventDate: event.date,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}
