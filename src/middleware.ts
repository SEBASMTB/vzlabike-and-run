import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "vzlabike-admin-secret-key";

function isValidToken(token: string): boolean {
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
  const isLoginPage = pathname === "/admin/login";

  // Get token and verify it properly
  const tokenCookie = request.cookies.get("admin_token");
  const hasValidToken = tokenCookie?.value ? isValidToken(tokenCookie.value) : false;

  // If not authenticated and not on login page, redirect to login
  if (!hasValidToken && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
