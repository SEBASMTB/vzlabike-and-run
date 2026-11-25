import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendPreRegistrationEmail } from "@/lib/email";
import { calculateAge, parseEventCategories, validateMTBCategory, validateGenericCategory, getCategoriesForSport, parseDateDDMMYYYY, type CategoryOption } from "@/lib/categories";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/events/[slug]/register
 *
 * Persistencia real en base de datos (Prisma + Turso):
 *   1. Valida y normaliza la fecha de nacimiento (DD/MM/YYYY o ISO).
 *   2. Upsert del Runner por cédula (registro único del atleta).
 *   3. Crea la Registration vinculada a Event + Runner + Category
 *      (cuando la categoría existe en BD) con snapshot completo:
 *      ubicación, contacto de emergencia, montos USD/Bs y tasa BCV.
 */

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

    // Limit request body size. El comprobante viaja como base64 dentro del
    // JSON; el cliente ya comprime imágenes (máx 1600px) y topea PDFs en 3MB.
    // Techo serverless Vercel ~4.5MB → guard en 4MB.
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 4_000_000) {
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
      emergRelation,
      estado,
      ciudad,
      paymentMethod,
      paymentRef,
      paymentProof,
      waiverAccepted,
      mtbProfile,
      totalAmount,
      bcvRate,
      totalBs,
      registrationType,
    } = body;

    if (!firstName || !lastName || !email || !phone || !idNumber || !gender || !dateOfBirth || !category) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // ── Validación server-side de la fecha de nacimiento (anti-basura) ──
    // Acepta DD/MM/YYYY (wizard) o YYYY-MM-DD; rechaza fechas futuras,
    // menores de 5 años y edades imposibles (>100).
    const dobParsed = dateOfBirth.includes("/")
      ? parseDateDDMMYYYY(dateOfBirth)
      : /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
        ? (() => {
            const [y, m, d] = dateOfBirth.split("-").map(Number);
            return new Date(y, m - 1, d);
          })()
        : null;
    if (!dobParsed || isNaN(dobParsed.getTime())) {
      return NextResponse.json(
        { error: "Fecha de nacimiento inválida. Formato esperado: DD/MM/YYYY" },
        { status: 400 }
      );
    }
    const now = new Date();
    let ageToday = now.getFullYear() - dobParsed.getFullYear();
    const mDiff = now.getMonth() - dobParsed.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < dobParsed.getDate())) ageToday--;
    if (ageToday < 0) {
      return NextResponse.json(
        { error: "La fecha de nacimiento no puede ser futura. Verifica el año." },
        { status: 400 }
      );
    }
    if (ageToday < 5 || ageToday > 100) {
      return NextResponse.json(
        { error: "Fecha de nacimiento no válida. Verifica el año." },
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

    // ── Upsert del Runner por cédula (BD real de atletas) ──
    // El atleta queda registrado una sola vez; en inscripciones futuras se
    // actualizan sus datos de contacto sin duplicar el perfil.
    let runnerId: string | null = null;
    try {
      const cedulaNorm = (idNumber || "").toUpperCase().trim();
      const runnerPayload = {
        cedula: cedulaNorm,
        nombres: String(firstName).trim(),
        apellidos: String(lastName).trim(),
        fechaNacimiento: dobParsed,
        genero: gender === "F" ? "F" : "M",
        email: String(email).trim(),
        telefono: String(phone).trim(),
        estado: estado ? String(estado) : null,
        ciudad: ciudad ? String(ciudad) : null,
        team: team ? String(team) : null,
      };
      const existingRunner = await db.runner.findUnique({
        where: { cedula: cedulaNorm },
      });
      if (existingRunner) {
        await db.runner.update({
          where: { id: existingRunner.id },
          data: {
            nombres: runnerPayload.nombres,
            apellidos: runnerPayload.apellidos,
            fechaNacimiento: runnerPayload.fechaNacimiento,
            genero: runnerPayload.genero,
            email: runnerPayload.email,
            telefono: runnerPayload.telefono,
            estado: runnerPayload.estado,
            ciudad: runnerPayload.ciudad,
            team: runnerPayload.team,
          },
        });
        runnerId = existingRunner.id;
      } else {
        const newRunner = await db.runner.create({ data: runnerPayload });
        runnerId = newRunner.id;
      }
    } catch (runnerErr) {
      // El Runner es una mejora de datos: si falla, la inscripción continúa
      console.error("[API register] Runner upsert omitido:", runnerErr);
    }

    // Generate bib number
    const bibNumber = regCount + 1;

    const registration = await db.registration.create({
      data: {
        eventId: event.id,
        runnerId,
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
        club: team || "",
        // Snapshot geográfico y de emergencia del wizard
        estado: estado || "",
        ciudad: ciudad || "",
        emergName: emergencyContact || "",
        emergPhone: emergencyPhone || "",
        emergRelation: emergRelation || "",
        emergencyContact: emergencyContact || "",
        emergencyPhone: emergencyPhone || "",
        // Montos y tasa del momento del pago
        totalAmount: typeof totalAmount === "number" ? totalAmount : 0,
        totalAmountBs: typeof totalBs === "number" ? totalBs : 0,
        bcvRate: typeof bcvRate === "number" ? bcvRate : 0,
        paymentMethod: paymentMethod || "",
        paymentRef: paymentRef || "",
        paymentProofUrl: paymentProof || null,
        registrationType: registrationType === "other" ? "other" : "self",
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
