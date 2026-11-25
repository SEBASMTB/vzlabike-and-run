"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatEventDateLong } from "@/lib/date-utils";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Hash,
  Tag,
  Loader2,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Hourglass,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface EventInfo {
  title: string;
  slug: string;
  date: string;
  location: string;
  distance: string;
  maxParticipants: number;
  status: string;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cupos: number;
}

interface Participante {
  bib: number | null;
  firstName: string;
  lastName: string;
  category: string;
  team: string;
  estado: string;
  ciudad: string;
  status: string;
}

interface ParticipantesResponse {
  event: EventInfo;
  stats: Stats;
  participants: Participante[];
}

// ============================================================
// Main Component
// ============================================================

export function ListaInscritosClient({ slug }: { slug: string }) {
  const [data, setData] = useState<ParticipantesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/events/${slug}/participantes`);
        if (!res.ok) {
          setError("No se pudo cargar la lista de participantes");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch {
        setError("Error al cargar la lista de participantes");
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.participants;
    return data.participants.filter((p) => {
      const bib = p.bib != null ? String(p.bib) : "";
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const cat = p.category.toLowerCase();
      const team = p.team.toLowerCase();
      const city = `${p.ciudad} ${p.estado}`.toLowerCase();
      return (
        bib.includes(term) ||
        name.includes(term) ||
        cat.includes(term) ||
        team.includes(term) ||
        city.includes(term)
      );
    });
  }, [data, search]);

  // ============================================================
  // Loading / Error states
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-red-500" />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground mb-2">
              {error || "Evento no encontrado"}
            </p>
            <Link
              href="/eventos"
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Ver todos los eventos →
            </Link>
          </div>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  const { event, stats } = data;

  // ============================================================
  // Content
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero rojo corporativo */}
        <div className="bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <Link
              href={`/eventos/${event.slug}`}
              className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium mb-4"
            >
              <ArrowLeft className="size-4" />
              Volver al evento
            </Link>
            <Badge className="bg-white/15 text-white border-white/30 mb-3">
              {event.distance || "Evento"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Lista de Inscritos
            </h1>
            <p className="text-white/90 mt-1 font-semibold">{event.title}</p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-white/85">
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" />
                {formatEventDateLong(event.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" />
                {event.location}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <ListOrdered className="size-3.5" /> Inscritos
                </p>
                <p className="text-2xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> Confirmados
                </p>
                <p className="text-2xl font-bold mt-0.5 text-emerald-200">
                  {stats.confirmed}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <Hourglass className="size-3.5" /> Pendientes
                </p>
                <p className="text-2xl font-bold mt-0.5 text-amber-200">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <Users className="size-3.5" /> Cupos libres
                </p>
                <p className="text-2xl font-bold mt-0.5">{stats.cupos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, dorsal, categoría, equipo o ciudad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Printer className="size-4 mr-1.5" />
              Imprimir lista
            </Button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs w-16">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="size-3.5" /> Dorsal
                      </span>
                    </TableHead>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="size-3.5" /> Categoría
                      </span>
                    </TableHead>
                    <TableHead className="text-xs hidden md:table-cell">
                      Equipo
                    </TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">
                      Ciudad / Estado
                    </TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-muted-foreground"
                      >
                        {data.participants.length === 0
                          ? "Aún no hay inscritos publicados para este evento. ¡Sé el primero!"
                          : "No se encontraron participantes con ese criterio de búsqueda"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p, idx) => (
                      <TableRow key={`${p.bib ?? "s"}-${idx}`}>
                        <TableCell className="font-mono text-sm font-bold text-red-600">
                          {p.bib != null ? p.bib : "—"}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {`${p.firstName} ${p.lastName}`.trim() || "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {p.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {p.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {p.team || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {[p.ciudad, p.estado].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs whitespace-nowrap",
                              p.status === "CONFIRMADO"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            )}
                          >
                            {p.status === "CONFIRMADO" ? "Confirmado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              Mostrando {filtered.length} de {data.participants.length}{" "}
              participantes · Lista actualizada automáticamente
            </div>
          </div>

          {/* CTA inscripción */}
          {event.status !== "cancelled" && stats.cupos > 0 && (
            <div className="mt-6 bg-gray-50 rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  ¿Aún no estás en la lista?
                </p>
                <p className="text-sm text-muted-foreground">
                  Quedan {stats.cupos} cupos disponibles para este evento.
                </p>
              </div>
              <Link href={`/eventos/${event.slug}/inscribirse`}>
                <Button className="gradient-primary text-white border-0 hover:opacity-90">
                  Inscribirme Ahora
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
