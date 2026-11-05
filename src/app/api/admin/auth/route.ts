import { NextRequest, NextResponse } from "next/server";
import { comparePassword, createToken } from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 login attempts per 60s per IP (prevent brute force)
    const limit = rateLimit(request, RATE_LIMITS.auth);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos segundos antes de intentar de nuevo." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vzlabike2024";

    if (!comparePassword(password, ADMIN_PASSWORD)) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const token = createToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
