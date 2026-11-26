/**
 * POST /api/auth/cerrar-sesion
 *
 * Cierra la sesión de la comunidad: elimina la cookie vbr_user_token.
 */
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/user-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
