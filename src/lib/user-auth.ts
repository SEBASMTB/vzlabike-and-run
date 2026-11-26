/**
 * ============================================================
 * Autenticación de la COMUNIDAD (usuarios deportistas)
 *
 * Diferente del admin (src/lib/auth.ts): aquí cada corredor
 * tiene su cuenta con correo + contraseña, y opcionalmente una
 * vinculación con la tabla Runner por cédula para desplegar su
 * historial y su ficha personal en "Mi Perfil".
 *
 * - Contraseñas: scrypt (crypto nativo de Node, sin dependencias).
 * - Token de sesión: base64url(JSON) firmado con TOKEN_SECRET,
 *   mismo mecanismo comprobado del panel admin (24h) pero con
 *   vigencia de 30 días y role "user".
 * - Cookie: vbr_user_token (httpOnly, sameSite lax, secure en prod).
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const TOKEN_SECRET =
  process.env.TOKEN_SECRET || "vzlabike-admin-secret-key";
export const USER_COOKIE = "vbr_user_token";
const TOKEN_EXPIRY_DAYS = 30;

export interface UserTokenPayload {
  sub: string; // id del User
  role: "user";
  iat: number;
  exp: number;
}

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: string;
  runnerId: string | null;
}

// ── Cédula ─────────────────────────────────────────────────────

/** Normaliza la cédula: "v- 12.345.678" -> "V12345678".
 *  Mismo criterio que el importador (prisma/import-runners.ts)
 *  para garantizar la vinculación por cédula en un solo formato. */
export function normalizeCedula(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/[\s.\-]/g, "").toUpperCase();
}

// ── Contraseñas (scrypt) ───────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) return false;
    return crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ── Token de sesión ────────────────────────────────────────────

export function createUserToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: UserTokenPayload = {
    sub: userId,
    role: "user",
    iat: now,
    exp: now + TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${TOKEN_SECRET}.${encoded}`;
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    if (parts[0] !== TOKEN_SECRET) return null;

    const payload: UserTokenPayload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    if (payload.role !== "user" || !payload.sub) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// ── Cookie de sesión ───────────────────────────────────────────

export function sessionCookieOptions(maxAgeSeconds = TOKEN_EXPIRY_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(USER_COOKIE, token, sessionCookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(USER_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

// ── Resolución del usuario autenticado ─────────────────────────

/**
 * Usuario autenticado desde la cookie de la request (route handlers).
 * Devuelve null si no hay sesión válida. NUNCA lanza: las páginas
 * públicas deben seguir funcionando sin sesión.
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(USER_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyUserToken(token);
  if (!payload) return null;

  // Import diferido para evitar ciclos de importación (db.ts es pesado)
  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      runnerId: true,
    },
  });
  return user;
}

/** Variante para Server Components (usa cookies() de next/headers). */
export async function getSessionUserFromServer(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(USER_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyUserToken(token);
    if (!payload) return null;

    const { db } = await import("@/lib/db");
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        runnerId: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/** Helper de route handlers: respuesta 401 lista o null si hay sesión. */
export async function requireUser(
  request: NextRequest
): Promise<NextResponse | null> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para continuar" },
      { status: 401 }
    );
  }
  return null;
}
