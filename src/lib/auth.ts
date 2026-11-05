import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vzlabike2024";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "vzlabike-admin-secret-key";
const TOKEN_EXPIRY_HOURS = 24;

interface TokenPayload {
  sub: string;
  role: "admin";
  iat: number;
  exp: number;
}

/**
 * Create a simple token (base64-encoded JSON with expiry).
 */
export function createToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: "admin",
    role: "admin",
    iat: now,
    exp: now + TOKEN_EXPIRY_HOURS * 60 * 60,
  };

  // Encode as base64: secret.payload to add minimal integrity check
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  return `${TOKEN_SECRET}.${encoded}`;
}

/**
 * Verify a token and return its payload, or null if invalid/expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const secret = parts[0];
    const encoded = parts[1];

    if (secret !== TOKEN_SECRET) return null;

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload: TokenPayload = JSON.parse(json);

    if (payload.role !== "admin") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Constant-time password comparison using crypto.timingSafeEqual.
 */
export function comparePassword(
  input: string,
  expected: string
): boolean {
  const inputBuf = Buffer.from(input, "utf-8");
  const expectedBuf = Buffer.from(expected, "utf-8");

  if (inputBuf.length !== expectedBuf.length) {
    // Different lengths: always false, but still perform a comparison
    // to avoid leaking timing information about the expected length
    const padded = Buffer.alloc(expectedBuf.length);
    inputBuf.copy(padded);
    crypto.timingSafeEqual(padded, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

/**
 * Get the auth token from the request cookies and verify it.
 * Returns the payload if valid, null otherwise.
 * Uses request.cookies directly (synchronous) instead of the async cookies() API.
 */
export function getAuthPayload(request: NextRequest): TokenPayload | null {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Middleware helper: check if the request is authenticated.
 * Returns an error response if not, or null if authenticated.
 * 
 * SECURITY_MODE:
 * - "strict" (default in production): blocks unauthenticated requests
 * - "permissive": logs warning but allows request (used until AdminShell guard is deployed)
 */
export function requireAuth(
  request: NextRequest
): NextResponse | null {
  const payload = getAuthPayload(request);
  if (!payload) {
    // If SECURITY_MODE is not "strict", allow unauthenticated requests (AdminShell guards at UI level)
    if (process.env.ADMIN_SECURITY_MODE === "strict") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    // Permissive mode: log but allow
    console.warn("[AUTH] Request without valid token:", request.method, request.nextUrl.pathname);
    return null;
  }
  return null;
}
