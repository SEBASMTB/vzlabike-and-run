import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Verificación de autenticación para páginas admin (Server Component).
 * Retorna null si está autenticado, o NextResponse con redirect si no.
 * 
 * Uso en cada página admin:
 *   const authResult = await checkAdminAuth();
 *   if (authResult) return authResult;
 */
export async function checkAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !verifyToken(token)) {
    // Devolver una respuesta que redirige al login con JavaScript
    // ya que redirect() de Next.js no funciona confiablemente en Vercel
    const html = `<!DOCTYPE html>
<html><head>
<meta http-equiv="refresh" content="0;url=/admin/login">
<script>window.location.href="/admin/login";</script>
</head><body></body></html>`;
    return new NextResponse(html, {
      status: 401,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Set-Cookie": "admin_token=; Path=/; Max-Age=0; HttpOnly",
      },
    });
  }

  return null;
}
