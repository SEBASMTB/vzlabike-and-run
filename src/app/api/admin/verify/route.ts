import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
        }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
        }
      );
    }

    return NextResponse.json(
      { authenticated: true, role: payload.role },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { 
        status: 401,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
      }
    );
  }
}
