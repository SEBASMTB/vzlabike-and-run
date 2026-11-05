/**
 * API: /api/bcv-rate
 *
 * Retorna la tasa oficial del BCV (Banco Central de Venezuela) del día.
 * Intenta obtener la tasa en tiempo real; si falla, usa una tasa de respaldo.
 *
 * GET /api/bcv-rate
 * Response: { rate: number, date: string, source: string }
 */

import { NextResponse } from "next/server";

// Tasa de respaldo (actualizar manualmente si la API falla)
const FALLBACK_RATE = 145.50;

// Cache simple (1 hora)
let cachedRate: { rate: number; date: string; source: string; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export async function GET() {
  // Return cached if still valid
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return NextResponse.json(cachedRate);
  }

  try {
    // Intentar obtener la tasa del BCV via API pública
    const response = await fetch("https://bcv-api.deno.dev/", {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const rate = data?.usd?.rate || data?.rate || data?.dolar?.referencial_rate;
      if (rate && !isNaN(rate)) {
        const result = {
          rate: rate,
          date: data?.date || data?.usd?.date || new Date().toISOString(),
          source: "BCV (tiempo real)",
          timestamp: Date.now(),
        };
        cachedRate = result;
        return NextResponse.json(result);
      }
    }
  } catch {
    // Falló la API, usar fallback
  }

  // Usar tasa de respaldo
  const result = {
    rate: FALLBACK_RATE,
    date: new Date().toISOString(),
    source: "Tasa de respaldo (manual)",
    timestamp: Date.now(),
  };
  cachedRate = result;
  return NextResponse.json(result);
}
