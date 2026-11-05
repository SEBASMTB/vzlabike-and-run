import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendPreRegistrationEmail } from "@/lib/email";
import { calculateAge, parseEventCategories, validateMTBCategory } from "@/lib/categories";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

interface GroupParticipant {
  firstName: string;
  lastName: string;
  idNumber: string;
  gender: string;
  dateOfBirth: string;
  shirtSize?: string;
  category: string;
  mtbProfile?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 3 group registrations per 60s per IP
    const limit = rateLimit(request, RATE_LIMITS.registerGroup);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const {
      participants,
      email,
      phone,
      emergencyContact,
      emergencyPhone,
      paymentMethod,
      paymentRef,
      waiverAccepted,
    } = body as {
      participants: GroupParticipant[];
      email: string;
      phone: string;
      emergencyContact: string;
      emergencyPhone: string;
      paymentMethod: string;
      paymentRef: string;
      waiverAccepted: boolean;
    };

    // Validate required fields
    if (!participants || !Array.isArray(participants) || participants.length < 2 || participants.length > 10) {
      return NextResponse.json(
        { error: "Debes incluir entre 2 y 10 participantes" },
        { status: 400 }
      );
    }

    if (!email || !phone) {
      return NextResponse.json(
        { error: "Email y teléfono del responsable son requeridos" },
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

    // Validate each participant
    for (const p of participants) {
      if (!p.firstName || !p.lastName || !p.idNumber || !p.gender || !p.dateOfBirth || !p.category) {
        return NextResponse.json(
          { error: `Faltan campos requeridos para el participante ${p.firstName || p.idNumber || "desconocido"}` },
          { status: 400 }
        );
      }
    }

    // Check event exists
    const event = await db.event.findUnique({ where: { slug } });
    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Check if there's enough capacity
    const currentCount = await db.registration.count({ where: { eventId: event.id } });
    const spotsNeeded = participants.length;
    if (currentCount + spotsNeeded > event.maxParticipants) {
      return NextResponse.json(
        { error: `No hay suficientes cupos disponibles. Quedan ${Math.max(0, event.maxParticipants - currentCount)} cupos.` },
        { status: 400 }
      );
    }

    // Check for duplicate cédulas within the group
    const idNumbers = participants.map((p) => p.idNumber.toUpperCase().trim());
    const uniqueIdNumbers = new Set(idNumbers);
    if (uniqueIdNumbers.size !== idNumbers.length) {
      return NextResponse.json(
        { error: "Hay cédulas duplicadas dentro del grupo. Cada participante debe tener una cédula única." },
        { status: 400 }
      );
    }

    // Check for existing registrations with the same cédula for this event
    const existingRegs = await db.registration.findMany({
      where: {
        eventId: event.id,
        idNumber: { in: Array.from(uniqueIdNumbers) },
      },
    });

    if (existingRegs.length > 0) {
      const dupes = existingRegs.map((r) => r.idNumber).join(", ");
      return NextResponse.json(
        { error: `Ya existen inscripciones con las siguientes cédulas para este evento: ${dupes}` },
        { status: 400 }
      );
    }

    // MTB category/profile validation for each participant
    if (event.sportType === "mtb") {
      const eventCats = parseEventCategories(event.categories, "mtb");
      for (const p of participants) {
        if (p.mtbProfile) {
          const age = calculateAge(p.dateOfBirth, event.date.toISOString(), event.ageCalcMode || "calendar_year");
          const validation = validateMTBCategory(
            p.category,
            age,
            eventCats,
            p.gender,
            p.mtbProfile as "competitivo" | "recreativo"
          );
          if (!validation.valid) {
            return NextResponse.json(
              { error: `${p.firstName} ${p.lastName}: ${validation.error || "Categoría no válida para el perfil seleccionado"}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Create all registrations in a transaction
    const createdRegistrations: Array<{
      id: string;
      bibNumber: number | null;
      firstName: string;
      lastName: string;
      category: string;
    }> = [];

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];

      // Get fresh count for bib assignment
      const latestCount = await db.registration.count({ where: { eventId: event.id } });
      const bibNumber = latestCount + 1;

      const registration = await db.registration.create({
        data: {
          eventId: event.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: email,
          phone: phone,
          idNumber: p.idNumber.toUpperCase().trim(),
          gender: p.gender,
          dateOfBirth: p.dateOfBirth,
          shirtSize: p.shirtSize || "",
          category: p.category,
          team: "",
          emergencyContact: emergencyContact || "",
          emergencyPhone: emergencyPhone || "",
          paymentMethod: paymentMethod || "",
          paymentRef: paymentRef || "",
          waiverAccepted: waiverAccepted || false,
          status: "pending",
          bibNumber,
        },
      });

      createdRegistrations.push({
        id: registration.id,
        bibNumber: registration.bibNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        category: registration.category,
      });
    }

    // Send confirmation email for each participant (non-blocking)
    for (const p of participants) {
      sendPreRegistrationEmail({
        firstName: p.firstName,
        lastName: p.lastName,
        email: email,
        eventTitle: event.title,
        eventDate: event.date.toISOString(),
        eventLocation: event.location,
        eventDistance: event.distance,
        category: p.category,
        paymentMethod: paymentMethod || "",
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        message: `Grupo inscrito exitosamente con ${participants.length} participantes`,
        count: participants.length,
        registrations: createdRegistrations.map((r) => ({
          id: r.id,
          bibNumber: r.bibNumber,
          firstName: r.firstName,
          lastName: r.lastName,
          category: r.category,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Group registration error:", error);
    return NextResponse.json(
      { error: "Error al procesar la inscripción grupal" },
      { status: 500 }
    );
  }
}
