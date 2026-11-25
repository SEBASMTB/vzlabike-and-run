import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendPreRegistrationEmail } from "@/lib/email";
import { calculateAge, parseEventCategories, validateMTBCategory, validateGenericCategory, getCategoriesForSport, type CategoryOption } from "@/lib/categories";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 5 registrations per 60s per IP
    const limit = rateLimit(request, RATE_LIMITS.register);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    // Limit request body size (payment proof image can be ~1MB base64)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1_500_000) {
      return NextResponse.json(
        { error: "La solicitud es demasiado grande" },
        { status: 413 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      gender,
      dateOfBirth,
      shirtSize,
      category,
      team,
      emergencyContact,
      emergencyPhone,
      paymentMethod,
      paymentRef,
      waiverAccepted,
      mtbProfile,
    } = body;

    if (!firstName || !lastName || !email || !phone || !idNumber || !gender || !dateOfBirth || !category) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Selecciona un método de pago" },
        { status: 400 }
      );
    }

    if (!waiverAccepted) {
      return NextResponse.json(
        { error: "Debes aceptar la liberación de responsabilidad" },
        { status: 400 }
      );
    }

    // Check event exists by slug
    const event = await db.event.findUnique({ where: { slug } });
    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Check registration count
    const regCount = await db.registration.count({ where: { eventId: event.id } });
    if (regCount >= event.maxParticipants) {
      return NextResponse.json(
        { error: "El evento ha alcanzado el máximo de participantes" },
        { status: 400 }
      );
    }

    // Check duplicate idNumber (cédula) for the same event
    const existingReg = await db.registration.findFirst({
      where: { eventId: event.id, idNumber: (idNumber || "").toUpperCase() },
    });
    if (existingReg) {
      return NextResponse.json(
        { error: "Ya existe una inscripción con esta cédula de identidad para este evento" },
        { status: 400 }
      );
    }

    // MTB category validation (always validate for MTB events)
    // - Categorías legacy JSON → reglas MTB (Élite, 100 Kilos, Recreativo)
    // - Categorías en BD o estándar del deporte → validación genérica edad/género
    if (event.sportType === "mtb") {
      const age = calculateAge(dateOfBirth, event.date.toISOString(), event.ageCalcMode || "calendar_year");
      const legacyCats: CategoryOption[] = parseEventCategories(event.categories, "mtb");

      let validation: { valid: boolean; error?: string };
      if (legacyCats.length > 0) {
        validation = validateMTBCategory(category, age, legacyCats, gender, mtbProfile);
      } else {
        let servedCats: CategoryOption[];
        try {
          const dbCats = await db.category.findMany({ where: { eventId: event.id } });
          servedCats = dbCats.length > 0
            ? dbCats.map((c) => ({
                value: c.name,
                label: c.name,
                minAge: c.minAge,
                maxAge: c.maxAge,
                gender: c.gender === "M" || c.gender === "F" ? c.gender : undefined,
              }))
            : getCategoriesForSport("mtb");
        } catch {
          servedCats = getCategoriesForSport("mtb");
        }
        validation = validateGenericCategory(category, age, servedCats, gender);
      }
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Categoría no válida para tu edad o género" },
          { status: 400 }
        );
      }
    }

    // Resolver categoryId real en BD por nombre de categoría (si existe)
    let categoryId: string | null = null;
    try {
      const match = await db.category.findFirst({
        where: { eventId: event.id, name: category },
      });
      categoryId = match?.id ?? null;
    } catch {
      categoryId = null;
    }

    // Generate bib number
    const bibNumber = regCount + 1;

    const registration = await db.registration.create({
      data: {
        eventId: event.id,
        firstName,
        lastName,
        email,
        phone,
        idNumber: idNumber || "",
        gender,
        dateOfBirth,
        shirtSize: shirtSize || "",
        category,
        team: team || "",
        emergencyContact: emergencyContact || "",
        emergencyPhone: emergencyPhone || "",
        paymentMethod: paymentMethod || "",
        paymentRef: paymentRef || "",
        waiverAccepted: waiverAccepted || false,
        status: "pending",
        bibNumber,
        categoryId,
      },
    });

    // Send confirmation email (non-blocking)
    sendPreRegistrationEmail({
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      eventTitle: event.title,
      eventDate: event.date.toISOString(),
      eventLocation: event.location,
      eventDistance: event.distance,
      category: registration.category,
      paymentMethod: registration.paymentMethod,
    }).catch(() => {});

    return NextResponse.json(registration, { status: 201 });
  } catch (err) {
    console.error("[API register] Error:", err);
    return NextResponse.json(
      { error: "Error al procesar inscripción", detail: String(err).slice(0, 300) },
      { status: 500 }
    );
  }
}
