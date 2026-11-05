import { NextRequest, NextResponse } from "next/server";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "vzlabike-admin-secret-key";

function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const secret = parts[0];
    const encoded = parts[1];

    if (secret !== TOKEN_SECRET) return false;

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json);

    if (payload.role !== "admin") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except login page and API routes)
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/admin/")
  ) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token || !verifyToken(token)) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
