"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Widget público "¿Ya te inscribiste?" — el corredor escribe su cédula y ve
 * el estado de su inscripción con el dorsal y la caja de retiro asignados.
 * Solo datos mínimos (sin PII sensible).
 */

interface LookupResult {
  found: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
  category?: string;
  status?: string;
  bibNumber?: number | null;
  bibBoxLabel?: string | null;
  shirtSize?: string | null;
  rejectReason?: string | null;
}

export function BibLookupWidget({ slug }: { slug: string }) {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    const value = cedula.trim();
    if (value.length < 5) {
      setError("Ingresa tu cédula completa");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(slug)}/mi-inscripcion?cedula=${encodeURIComponent(value)}`
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "No se pudo consultar. Intenta de nuevo.");
      } else {
        setResult(data);
      }
    } catch {
      setError("No se pudo consultar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const statusUI =
    result?.status === "APPROVED"
      ? { label: "Confirmado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle }
      : result?.status === "REJECTED"
      ? { label: "Rechazado", cls: "bg-red-100 text-red-700 border-red-200", icon: XCircle }
      : { label: "Pendiente de aprobación", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <KeyRound className="size-4 text-red-600" />
        ¿Ya te inscribiste? Consulta tu dorsal y caja
      </p>
      <div className="mt-2 flex gap-2">
        <Input
          value={cedula}
          onChange={(e) => {
            setCedula(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLookup();
          }}
          placeholder="Tu cédula (V-12345678)"
          className="h-9"
          aria-label="Cédula para consultar inscripción"
        />
        <Button
          size="sm"
          onClick={handleLookup}
          disabled={loading}
          className="gradient-primary text-white border-0 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Consultar
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {result && !error && (
        <div className="mt-3 rounded-lg border bg-white px-3 py-2.5 text-sm">
          {result.found ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {result.firstName} {result.lastName}
                </span>
                <Badge variant="outline" className={cn("text-xs", statusUI.cls)}>
                  <statusUI.icon className="mr-1 size-3" />
                  {statusUI.label}
                </Badge>
              </div>
              {result.category && (
                <p className="text-xs text-muted-foreground">
                  Categoría: <span className="font-medium text-gray-700">{result.category}</span>
                </p>
              )}
              {result.bibNumber != null ? (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-red-600 font-mono text-base">
                    Dorsal #{result.bibNumber}
                  </span>
                  {result.bibBoxLabel && (
                    <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                      {result.bibBoxLabel}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Retira tu kit, número y chip en esa caja
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tu dorsal y caja se asignan automáticamente cuando el
                  organizador apruebe tu pago.
                </p>
              )}
              {result.status === "REJECTED" && result.rejectReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs font-semibold text-red-800">
                    Motivo: {result.rejectReason}
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    Corrige lo indicado y vuelve a reportar tu pago por
                    WhatsApp para participar.
                  </p>
                  <a
                    href="https://wa.me/584120162685"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-md bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Corregir / reportar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {result.message || "No encontramos una inscripción con esa cédula."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
