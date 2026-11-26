/**
 * POST /api/auth/iniciar-sesion
 *
 * Inicio de sesión de la comunidad con correo + contraseña.
 * Al validar, crea la cookie de sesión (vbr_user_token, 30 días).
 * Si el usuario tiene Runner vinculado, /api/auth/me desplegará
 * su ficha e historial automáticamente.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createUserToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/user-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(request, RATE_LIMITS.general);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, nombre: true, passwordHash: true },
    });

    // Mensaje genérico: no revelar si el correo existe o no
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = createUserToken(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
    return setSessionCookie(response, token);
  } catch (err) {
    console.error("[auth/iniciar-sesion]", err);
    return NextResponse.json(
      { error: "No pudimos iniciar sesión. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
