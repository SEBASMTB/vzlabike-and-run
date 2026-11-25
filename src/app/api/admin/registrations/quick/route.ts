import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assignBibForRegistration } from "@/lib/bib-assignment";
import { normalizePaymentRef } from "@/lib/payment-accounts";
import { sendApprovalEmail } from "@/lib/email";

/**
 * POST /api/admin/registrations/quick
 *
 * Inscripción rápida en sitio / WhatsApp: el organizador captura en segundos
 * los datos mínimos del atleta que pagó en la puerta. La inscripción nace
 * APPROVED (pago verificado en el momento) y recibe dorsal + caja de forma
 * atómica de inmediato. También marca como MATCHED un pago sin ficha cuya
 * referencia coincida.
 *
 * Body: {
 *   eventId, firstName, lastName, idNumber, gender,
 *   dateOfBirth?, phone?, email?, categoryId?, shirtSize?,
 *   paymentMethod?, paymentRef?, team?, estado?, ciudad?, totalAmount?
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      eventId,
      firstName,
      lastName,
      idNumber,
      gender,
      dateOfBirth,
      phone,
      email,
      categoryId,
      shirtSize,
      paymentMethod,
      paymentRef,
      team,
      estado,
      ciudad,
      totalAmount,
    } = body;

    if (!eventId || !firstName || !lastName || !idNumber) {
      return NextResponse.json(
        { error: "Evento, nombre, apellido y cédula son obligatorios" },
        { status: 400 }
      );
    }

    const event = await db.event.findUnique({ where: { id: String(eventId) } });
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Sin duplicar cédulas en el mismo evento
    const cedulaNorm = String(idNumber).toUpperCase().trim();
    const dup = await db.registration.findFirst({
      where: { eventId: event.id, idNumber: cedulaNorm },
    });
    if (dup) {
      return NextResponse.json(
        { error: `Ya existe una inscripción con la cédula ${cedulaNorm} en este evento` },
        { status: 400 }
      );
    }

    // Resolver categoría (id → snapshot de nombre)
    let categorySnapshot = "";
    let resolvedCategoryId: string | null = null;
    if (categoryId) {
      const cat = await db.category.findUnique({ where: { id: String(categoryId) } });
      if (cat && cat.eventId === event.id) {
        resolvedCategoryId = cat.id;
        categorySnapshot = cat.name;
      }
    }

    // Crear inscripción YA APROBADA (pago verificado en sitio)
    const registration = await db.registration.create({
      data: {
        eventId: event.id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        idNumber: cedulaNorm,
        gender: gender === "F" ? "F" : gender === "M" ? "M" : "",
        dateOfBirth: dateOfBirth ? String(dateOfBirth) : "",
        phone: phone ? String(phone).trim() : "",
        email: email ? String(email).trim() : "",
        categoryId: resolvedCategoryId,
        category: categorySnapshot,
        shirtSize: shirtSize ? String(shirtSize) : "",
        team: team ? String(team).trim() : "",
        club: team ? String(team).trim() : "",
        estado: estado ? String(estado) : "",
        ciudad: ciudad ? String(ciudad) : "",
        paymentMethod: paymentMethod ? String(paymentMethod) : "efectivo",
        paymentRef: paymentRef ? String(paymentRef).trim() : "",
        totalAmount: typeof totalAmount === "number" ? totalAmount : event.price || 0,
        status: "APPROVED",
        waiverAccepted: true, // inscripción en sitio la confirma el organizador
      },
    });

    // Dorsal + caja inmediatos (lote de la categoría)
    const assigned = await assignBibForRegistration(registration.id);

    // Runner upsert (perfil del atleta para futuras inscripciones)
    try {
      const existingRunner = await db.runner.findUnique({
        where: { cedula: cedulaNorm },
      });
      const runnerData = {
        cedula: cedulaNorm,
        nombres: String(firstName).trim(),
        apellidos: String(lastName).trim(),
        fechaNacimiento: dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth))
          ? new Date(`${dateOfBirth}T12:00:00Z`)
          : existingRunner?.fechaNacimiento ?? new Date("1990-01-01T12:00:00Z"),
        genero: gender === "F" ? "F" : "M",
        email: email ? String(email).trim() : existingRunner?.email ?? null,
        telefono: phone ? String(phone).trim() : existingRunner?.telefono ?? null,
        estado: estado ? String(estado) : existingRunner?.estado ?? null,
        ciudad: ciudad ? String(ciudad) : existingRunner?.ciudad ?? null,
        team: team ? String(team).trim() : existingRunner?.team ?? null,
        tallaFranela: shirtSize ? String(shirtSize) : existingRunner?.tallaFranela ?? null,
      };
      if (existingRunner) {
        await db.runner.update({ where: { id: existingRunner.id }, data: runnerData });
        await db.registration.update({
          where: { id: registration.id },
          data: { runnerId: existingRunner.id },
        });
      } else {
        const newRunner = await db.runner.create({ data: runnerData });
        await db.registration.update({
          where: { id: registration.id },
          data: { runnerId: newRunner.id },
        });
      }
    } catch (runnerErr) {
      console.error("[API quick] Runner upsert omitido:", runnerErr);
    }

    // Conciliación: si la referencia coincide con un pago sin ficha del evento
    const refNorm = normalizePaymentRef(String(paymentRef || ""));
    if (refNorm) {
      try {
        const records = await db.paymentRecord.findMany({
          where: { eventId: event.id, status: "UNMATCHED" },
        });
        const matched = records.find(
          (r) => normalizePaymentRef(r.reference) === refNorm
        );
        if (matched) {
          await db.paymentRecord.update({
            where: { id: matched.id },
            data: {
              status: "MATCHED",
              matchedRegistrationId: registration.id,
              matchedAt: new Date(),
            },
          });
        }
      } catch {
        // La conciliación es una mejora: no bloquea la inscripción rápida
      }
    }

    const final = await db.registration.findUnique({
      where: { id: registration.id },
    });

    // Correo de aprobación al corredor (si dejó email); nunca bloquea
    let emailSent = false;
    let emailSkipped: boolean | undefined;
    let emailError: string | undefined;
    try {
      let categoryName = categorySnapshot;
      if (resolvedCategoryId && !categoryName) {
        try {
          const cat = await db.category.findUnique({
            where: { id: resolvedCategoryId },
            select: { name: true },
          });
          if (cat) categoryName = cat.name;
        } catch {}
      }
      const emailResult = await sendApprovalEmail({
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: email ? String(email).trim() : "",
        eventTitle: event.title || "",
        eventDate: event.date ? String(event.date) : null,
        eventLocation: event.location || null,
        eventDistance: event.distance || null,
        categoryName,
        bibNumber: assigned.bibNumber,
        bibBoxLabel: assigned.bibBoxLabel,
        eventSlug: event.slug || null,
      });
      emailSent = emailResult.sent;
      emailSkipped = emailResult.skipped;
      emailError = emailResult.error;
    } catch (emailErr) {
      console.error("[API quick] email aprobación omitido:", emailErr);
    }

    return NextResponse.json(
      {
        ...final,
        bibNumber: assigned.bibNumber,
        bibBoxLabel: assigned.bibBoxLabel,
        bibWarning: assigned.bibNumber == null ? assigned.reason : undefined,
        emailSent,
        emailSkipped,
        emailError,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API admin registrations quick] Error:", err);
    return NextResponse.json(
      { error: "Error al crear la inscripción rápida" },
      { status: 500 }
    );
  }
}
