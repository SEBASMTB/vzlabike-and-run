/**
 * POST /api/auth/registrarse
 *
 * Registro de cuenta de la comunidad VBR.
 *
 * Flujo de vinculación por cédula:
 * 1. Se recibe { nombre, apellido?, email, password, cedula }.
 * 2. Si la cédula existe en la tabla Runner (4.000 corredores iniciales
 *    y lotes futuros), se VINCULA la cuenta al Runner: el historial de
 *    inscripciones y la ficha personal se despliegan al instante en
 *    "Mi Perfil" y el formulario de inscripción se auto-completa.
 * 3. Si la cédula NO existe, la cuenta se crea sin vinculación: cuando
 *    el organizador importe sus datos (scripts/import-runners.ts) o el
 *    corredor complete su ficha en Mi Perfil, quedará vinculada.
 *
 * Reglas de privacidad:
 * - La cédula NUNCA puede vincularse a dos cuentas: si ya está tomada
 *   por otro usuario se rechaza con error claro.
 * - Si el Runner vinculado no tiene email, se rellena con el de la cuenta.
 */
import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db";
import {
  createUserToken,
  hashPassword,
  normalizeCedula,
  setSessionCookie,
} from "@/lib/user-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(request, RATE_LIMITS.general);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    // Asegura init/DDL de BD también en desarrollo
    await getDb();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const nombre = String(body.nombre || "").trim();
    const apellido = String(body.apellido || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const cedula = normalizeCedula(body.cedula);

    // --- Validaciones ---
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }
    if (!cedula || cedula.length < 5) {
      return NextResponse.json(
        {
          error:
            "La cédula es obligatoria: con ella vinculamos tu historial deportivo",
        },
        { status: 400 }
      );
    }

    // --- Correo ya registrado ---
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        {
          error:
            "Ya existe una cuenta con este correo. Inicia sesión o recupera tu acceso.",
        },
        { status: 409 }
      );
    }

    // --- Cédula ya vinculada a otra cuenta ---
    const existingByCedula = await db.user.findFirst({
      where: { runner: { cedula } },
    });
    if (existingByCedula) {
      return NextResponse.json(
        {
          error:
            "Esta cédula ya está vinculada a otra cuenta. Inicia sesión con el correo registrado o escríbenos por WhatsApp.",
        },
        { status: 409 }
      );
    }

    // --- Buscar Runner histórico por cédula ---
    const runner = await db.runner.findUnique({ where: { cedula } });

    // --- Crear cuenta (passwordHash con scrypt) ---
    const displayName = apellido ? `${nombre} ${apellido}`.trim() : nombre;
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        nombre: displayName,
        role: "user",
        runnerId: runner ? runner.id : null,
      },
      select: { id: true, email: true, nombre: true, runnerId: true },
    });

    // Si el Runner histórico no tenía email, se rellena con el de la cuenta
    if (runner && !runner.email) {
      await db.runner.update({
        where: { id: runner.id },
        data: { email },
      });
    }

    // --- Sesión iniciada de inmediato ---
    const token = createUserToken(user.id);
    const response = NextResponse.json({
      ok: true,
      linked: Boolean(runner),
      runner: runner
        ? { nombres: runner.nombres, apellidos: runner.apellidos }
        : null,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
    return setSessionCookie(response, token);
  } catch (err) {
    console.error("[auth/registrarse]", err);
    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
