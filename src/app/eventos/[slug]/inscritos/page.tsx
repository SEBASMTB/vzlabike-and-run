"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Trophy,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegistrationItem {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string;
  category: string;
}

interface CategoryGroup {
  category: string;
  count: number;
  registrations: RegistrationItem[];
}

interface EventInfo {
  id: string;
  title: string;
  slug: string;
  sportType: string;
  maxParticipants: number;
}

interface RegistrationsData {
  event: EventInfo;
  totalRegistrations: number;
  categories: CategoryGroup[];
}

export default function InscritosPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<RegistrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/events/${slug}/registrations`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrado");
        return res.json();
      })
      .then((json) => {
        setData(json);
        // Expand all categories by default
        const expanded: Record<string, boolean> = {};
        json.categories.forEach((cat: CategoryGroup) => {
          expanded[cat.category] = true;
        });
        setExpandedCategories(expanded);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const expandAll = () => {
    if (!data) return;
    const expanded: Record<string, boolean> = {};
    data.categories.forEach((cat) => {
      expanded[cat.category] = true;
    });
    setExpandedCategories(expanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Filter registrations based on search and gender
  const filteredCategories = data
    ? data.categories
        .map((cat) => {
          let regs = cat.registrations;

          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            regs = regs.filter(
              (r) =>
                r.firstName.toLowerCase().includes(term) ||
                r.lastName.toLowerCase().includes(term) ||
                r.idNumber.toLowerCase().includes(term)
            );
          }

          if (genderFilter !== "all") {
            regs = regs.filter((r) =>
              cat.category.toLowerCase().includes(
                genderFilter === "M" ? "varon" : "dam"
              )
            );
          }

          return { ...cat, registrations: regs, count: regs.length };
        })
        .filter((cat) => cat.count > 0)
    : [];

  const totalFiltered = filteredCategories.reduce(
    (sum, cat) => sum + cat.count,
    0
  );

  // CSV export
  const exportCSV = () => {
    if (!data) return;
    const rows: string[] = [
      [
        "#",
        "Nombre",
        "Apellido",
        "Cedula",
        "Fecha de Nacimiento",
        "Categoria",
      ].join(","),
    ];
    let counter = 1;
    for (const cat of data.categories) {
      for (const r of cat.registrations) {
        rows.push(
          [
            counter++,
            `"${r.firstName}"`,
            `"${r.lastName}"`,
            `"${r.idNumber || ""}"`,
            `"${r.dateOfBirth || ""}"`,
            `"${r.category}"`,
          ].join(",")
        );
      }
    }
    const blob = new Blob(["\uFEFF" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscritos-${data.event.slug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mt-2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="size-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {error || "Evento no encontrado"}
            </h1>
            <p className="text-muted-foreground mb-6">
              No se pudieron cargar los inscritos.
            </p>
            <Button
              className="gradient-primary text-white border-0"
              onClick={() => router.push(`/eventos/${slug}`)}
            >
              <ArrowLeft className="size-4 mr-2" />
              Volver al Evento
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/eventos/${slug}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Volver al Evento
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {data.event.title}
            </h1>
            <p className="text-white/80 text-sm">
              Lista de inscritos confirmados
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2.5">
                <Users className="size-5 text-white/90" />
                <div>
                  <p className="text-xs text-white/60">Total Inscritos</p>
                  <p className="text-xl font-bold">
                    {data.totalRegistrations}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2.5">
                <Trophy className="size-5 text-white/90" />
                <div>
                  <p className="text-xs text-white/60">Categorias</p>
                  <p className="text-xl font-bold">
                    {data.categories.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2.5">
                <Calendar className="size-5 text-white/90" />
                <div>
                  <p className="text-xs text-white/60">Cupos Maximos</p>
                  <p className="text-xl font-bold">
                    {data.event.maxParticipants || 500}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b sticky top-16 md:top-20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o cedula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Gender Filter */}
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="size-4 mr-2" />
                  <SelectValue placeholder="Genero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="M">Varones</SelectItem>
                  <SelectItem value="F">Damas</SelectItem>
                </SelectContent>
              </Select>

              {/* Expand/Collapse */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="text-xs"
                >
                  <ChevronDown className="size-3 mr-1" />
                  Expandir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="text-xs"
                >
                  <ChevronUp className="size-3 mr-1" />
                  Colapsar
                </Button>
              </div>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="text-xs"
              >
                <Download className="size-3 mr-1" />
                Exportar CSV
              </Button>
            </div>

            {searchTerm || genderFilter !== "all" ? (
              <p className="text-xs text-muted-foreground mt-2">
                Mostrando {totalFiltered} de {data.totalRegistrations} inscritos
              </p>
            ) : null}
          </div>
        </div>

        {/* Categories List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <Users className="size-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || genderFilter !== "all"
                  ? "No se encontraron inscritos"
                  : "Aun no hay inscritos confirmados"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || genderFilter !== "all"
                  ? "Intenta con otros terminos de busqueda o filtros."
                  : "Se el primero en inscribirte en este evento."}
              </p>
              {!searchTerm && genderFilter === "all" && (
                <Link href={`/eventos/${slug}`}>
                  <Button className="gradient-primary text-white border-0 mt-4">
                    Inscribirme Ahora
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white border rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Trophy className="size-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-foreground text-base">
                        {cat.category}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {cat.count} inscrito{cat.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs font-bold">
                      {cat.count}
                    </Badge>
                    {expandedCategories[cat.category] !== false ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Registration Table */}
                {expandedCategories[cat.category] !== false && (
                  <div className="border-t overflow-x-auto">
                    {/* Table Header */}
                    <div className="hidden sm:grid sm:grid-cols-[3rem_1fr_1fr_7rem_6rem] bg-gray-50 px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div>#</div>
                      <div>Nombre</div>
                      <div>Apellido</div>
                      <div>Cedula</div>
                      <div>F. Nacimiento</div>
                    </div>

                    {/* Rows */}
                    {cat.registrations.map((reg, idx) => (
                      <div
                        key={reg.id}
                        className={`grid grid-cols-2 sm:grid-cols-[3rem_1fr_1fr_7rem_6rem] px-5 py-3 items-center ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-red-50/30 transition-colors`}
                      >
                        <div className="text-sm text-muted-foreground font-mono hidden sm:block">
                          {idx + 1}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {reg.firstName}
                        </div>
                        <div className="text-sm text-foreground">
                          {reg.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {reg.idNumber || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reg.dateOfBirth || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
