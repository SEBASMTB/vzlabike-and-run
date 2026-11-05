"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Ruler,
  ChevronLeft,
  Flame,
  Search,
  Filter,
  Users,
  ArrowRight,
  Bike,
  Activity,
  Zap,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CountdownTimer } from "@/components/CountdownTimer";

// ============================================================
// Types
// ============================================================
interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  distance: string;
  category: string;
  sportType: string;
  imageUrl: string;
  bannerImage: string;
  price: number;
  featured: boolean;
  maxParticipants: number;
  _count: { registrations: number };
}

// ============================================================
// Sport type filters
// ============================================================
const sportFilters = [
  { key: "all", label: "Todos", icon: Filter },
  { key: "running", label: "Carreras", icon: Activity },
  { key: "mtb", label: "MTB", icon: Bike },
  { key: "triathlon", label: "Triatlón", icon: Zap },
  { key: "virtual", label: "Virtual", icon: Radio },
] as const;

const categoryColors: Record<string, string> = {
  Carrera: "bg-red-100 text-red-700 border-red-200",
  Triatlon: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Triatlón": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Virtual: "bg-violet-100 text-violet-700 border-violet-200",
  MTB: "bg-amber-100 text-amber-700 border-amber-200",
};

const categoryGradients: Record<string, string> = {
  Carrera: "from-red-500 to-red-600",
  Triatlon: "from-emerald-500 to-teal-600",
  "Triatlón": "from-emerald-500 to-teal-600",
  Virtual: "from-violet-500 to-purple-600",
  MTB: "from-amber-500 to-yellow-600",
};

// ============================================================
// Helpers
// ============================================================
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getEventStatus(date: string): "upcoming" | "past" {
  return new Date(date) >= new Date() ? "upcoming" : "past";
}

// ============================================================
// Event List Card (compact version for listing page)
// ============================================================
function EventListCard({ event }: { event: EventData }) {
  const gradientClass =
    categoryGradients[event.category] || "from-red-500 to-red-600";
  const colorClass =
    categoryColors[event.category] || "bg-red-100 text-red-700";
  const status = getEventStatus(event.date);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link href={`/eventos/${event.slug}`} className="block">
        {/* Image Header */}
        <div className="relative h-48 overflow-hidden">
          {event.bannerImage || event.imageUrl ? (
            <img
              src={event.bannerImage || event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradientClass}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Category Badge */}
          <Badge
            className={`absolute top-3 left-3 ${colorClass} border font-medium`}
          >
            {event.category}
          </Badge>

          {/* Featured Badge */}
          {event.featured && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 font-medium">
              <Flame className="size-3 mr-1" />
              Destacado
            </Badge>
          )}

          {/* Status Badge */}
          {status === "past" && (
            <Badge className="absolute bottom-3 left-3 bg-gray-800 text-white border-0">
              Evento pasado
            </Badge>
          )}

          {/* Distance */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Ruler className="size-4 text-red-600" />
            <span className="text-sm font-bold text-foreground">
              {event.distance}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              <span className="text-sm">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="text-sm line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Countdown */}
          {status === "upcoming" && (
            <div className="mb-4">
              <CountdownTimer targetDate={event.date} compact />
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <span className="text-sm text-muted-foreground">Desde</span>
              <div className="text-2xl font-bold text-foreground">
                ${event.price.toFixed(0)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  USD
                </span>
              </div>
            </div>
            <Button
              size="lg"
              className="gradient-primary text-white border-0 hover:opacity-90"
            >
              Ver Detalles
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// Main Events Listing Page
// ============================================================
export default function EventosPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter and search
  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      activeFilter === "all" || event.sportType === activeFilter;
    const matchesSearch =
      searchTerm === "" ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.distance.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(
    (e) => getEventStatus(e.date) === "upcoming"
  );
  const pastEvents = filteredEvents.filter(
    (e) => getEventStatus(e.date) === "past"
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-gray-900 via-red-900/30 to-gray-900 py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-red-500 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="size-4" />
              Volver al Inicio
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Todos los Eventos
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-white/70 max-w-2xl"
            >
              Descubre todos los eventos deportivos organizados por VzlaBike
              and Run. Carreras, MTB, Triatlones y más en Venezuela.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-6 mt-8"
            >
              <div className="flex items-center gap-2 text-white/80">
                <Activity className="size-5 text-red-400" />
                <span className="text-sm">
                  <strong className="text-white">{events.length}</strong>{" "}
                  eventos totales
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="size-5 text-red-400" />
                <span className="text-sm">
                  <strong className="text-white">{upcomingEvents.length}</strong>{" "}
                  próximos
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Users className="size-5 text-red-400" />
                <span className="text-sm">
                  <strong className="text-white">
                    {events
                      .reduce((sum, e) => sum + e._count.registrations, 0)
                      .toLocaleString("es-VE")}
                  </strong>{" "}
                  inscripciones
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border-b sticky top-16 md:top-20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Sport Type Filters */}
              <div className="flex flex-wrap gap-2">
                {sportFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-red-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="size-4" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="size-6 text-red-500" />
                Próximos Eventos
                <Badge
                  variant="secondary"
                  className="ml-2 bg-red-100 text-red-700"
                >
                  {upcomingEvents.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {upcomingEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EventListCard event={event} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="size-6 text-gray-400" />
                Eventos Pasados
                <Badge variant="secondary" className="ml-2">
                  {pastEvents.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {pastEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EventListCard event={event} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Calendar className="size-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No se encontraron eventos
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || activeFilter !== "all"
                  ? "Intenta con otros filtros o términos de búsqueda"
                  : "Aún no hay eventos disponibles"}
              </p>
              {(searchTerm || activeFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl overflow-hidden border animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
