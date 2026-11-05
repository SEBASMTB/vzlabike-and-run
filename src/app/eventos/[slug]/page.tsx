"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Ruler,
  Users,
  Trophy,
  BookOpen,
  Package,
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Star,
  Tag,
  Info,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RegistrationDialog } from "@/components/RegistrationDialog";
import { GroupRegistrationDialog } from "@/components/GroupRegistrationDialog";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { EventCardProps } from "@/components/EventCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

interface EventFullData extends EventCardProps {
  organizer?: string;
  prizes?: string;
  rules?: string;
  kitInfo?: string;
  sponsors?: string;
  maxParticipants?: number;
  status?: string;
  priceBs?: number;
}

type RegistrationType = "individual" | "group" | null;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationCount, setRegistrationCount] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [registrationType, setRegistrationType] = useState<RegistrationType>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/events/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setEvent(data);
        if (data.registrations) {
          setRegistrationCount(data.registrations.length);
        }
      })
      .catch(() => {
        setEvent(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRegister = () => {
    setRegistrationType(null);
    setDialogOpen(true);
  };

  const handleChooseType = (type: RegistrationType) => {
    setRegistrationType(type);
  };

  const handleIndividualClose = (open: boolean) => {
    if (!open) {
      setRegistrationType(null);
      setDialogOpen(false);
    }
  };

  const handleGroupClose = (open: boolean) => {
    if (!open) {
      setRegistrationType(null);
      setDialogOpen(false);
    }
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

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="size-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Evento no encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              El evento que buscas no existe o fue eliminado.
            </p>
            <Button
              className="gradient-primary text-white border-0"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const spotsLeft = Math.max(0, (event.maxParticipants || 500) - registrationCount);
  const spotsPercent = Math.min(100, (registrationCount / (event.maxParticipants || 500)) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
          {event.bannerImage || event.imageUrl ? (
            <img
              src={event.bannerImage || event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <Trophy className="size-24 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* Top Bar - Back button */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="text-white bg-black/30 backdrop-blur-sm hover:bg-black/50 hover:text-white border border-white/20"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Volver
            </Button>
          </div>

          {/* Category + Status badges */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-2 z-10">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm px-3 py-1">
              {event.category}
            </Badge>
            {event.featured && (
              <Badge className="bg-yellow-500/90 text-white border-0 text-sm px-3 py-1">
                <Star className="size-3 mr-1" /> Destacado
              </Badge>
            )}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm sm:text-base">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>{formatTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ruler className="size-4" />
                  <span>{event.distance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2/3 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Countdown + Spots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                  <p className="text-xs font-semibold text-red-700 mb-3 uppercase tracking-wider">
                    Cuenta Regresiva
                  </p>
                  <CountdownTimer targetDate={event.date} />
                </div>

                <div className="bg-white border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Cupos Disponibles
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {spotsLeft} de {event.maxParticipants || 500}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${spotsPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4 text-red-500" />
                      <span>{registrationCount} inscritos</span>
                    </div>
                    {registrationCount > 0 && (
                      <Link href={`/eventos/${slug}/inscritos`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1.5 font-semibold text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          <ClipboardList className="size-3" />
                          Ver Inscritos
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                    <BookOpen className="size-5 text-red-500" />
                    Descripcion del Evento
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </div>
                </div>
              )}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border rounded-xl p-4 text-center">
                  <Calendar className="size-5 mx-auto mb-1.5 text-red-500" />
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(event.date).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <Clock className="size-5 mx-auto mb-1.5 text-red-500" />
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTime(event.date)}
                  </p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <MapPin className="size-5 mx-auto mb-1.5 text-red-500" />
                  <p className="text-xs text-muted-foreground">Ubicacion</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {event.location}
                  </p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <Ruler className="size-5 mx-auto mb-1.5 text-red-500" />
                  <p className="text-xs text-muted-foreground">Distancia</p>
                  <p className="text-sm font-semibold text-foreground">{event.distance}</p>
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                    <User className="size-5 text-red-500" />
                    Organizador
                  </h2>
                  <p className="text-sm text-muted-foreground">{event.organizer}</p>
                </div>
              )}

              {/* Rules */}
              {event.rules && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                    <Info className="size-5 text-red-500" />
                    Reglas del Evento
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.rules}
                  </div>
                </div>
              )}

              {/* Prizes */}
              {event.prizes && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                    <Trophy className="size-5 text-red-500" />
                    Premios
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.prizes}
                  </div>
                </div>
              )}

              {/* Kit Info */}
              {event.kitInfo && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                    <Package className="size-5 text-red-500" />
                    Kit del Participante
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.kitInfo}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {event.sponsors && (
                <div className="bg-white border rounded-xl p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                    <Star className="size-5 text-red-500" />
                    Patrocinadores
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.sponsors}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - 1/3 */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Price Card */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="text-center mb-6">
                    <p className="text-sm opacity-90 mb-1">Inscripcion</p>
                    <p className="text-5xl font-bold">${event.price.toFixed(0)}</p>
                    <p className="text-sm opacity-80 mt-1">USD</p>
                    {event.priceBs && event.priceBs > 0 && (
                      <p className="text-lg font-semibold mt-2 opacity-90">
                        Bs. {event.priceBs.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Deporte</span>
                      <span className="font-medium">{event.sportType || event.category}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Distancia</span>
                      <span className="font-medium">{event.distance}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Edad</span>
                      <span className="font-medium">
                        {event.ageCalcMode === "event_day"
                          ? "Edad al dia del evento"
                          : "Ano calendario"}
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Cupos</span>
                      <span className="font-medium">{spotsLeft} disponibles</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    size="lg"
                    className="w-full bg-white text-red-600 font-bold hover:bg-white/90 text-lg py-6"
                    onClick={handleRegister}
                  >
                    Inscribirme Ahora
                    <ArrowRight className="size-5 ml-2" />
                  </Button>

                  <p className="text-center text-xs opacity-70 mt-3">
                    Individual o Grupal (2-10 personas)
                  </p>

                  {/* Ver Inscritos Link */}
                  {registrationCount > 0 && (
                    <Link
                      href={`/eventos/${slug}/inscritos`}
                      className="block mt-2"
                    >
                      <Button
                        className="w-full bg-white text-red-600 font-bold hover:bg-red-50 border-2 border-white"
                        size="sm"
                      >
                        <ClipboardList className="size-4 mr-2" />
                        Ver Lista de Inscritos ({registrationCount})
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Quick Info */}
                <div className="bg-white border rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Informacion Rapida
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="size-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Fecha</p>
                        <p className="text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Clock className="size-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Hora de Salida</p>
                        <p className="text-muted-foreground">{formatTime(event.date)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="size-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Ubicacion</p>
                        <p className="text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Tag className="size-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Modalidad</p>
                        <p className="text-muted-foreground">{event.sportType || event.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Registration Type Chooser Dialog */}
      <Dialog
        open={dialogOpen && registrationType === null}
        onOpenChange={(open) => {
          if (!open) {
            setRegistrationType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tipo de Inscripcion</DialogTitle>
            <DialogDescription>
              {event.title} — {event.distance}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key="type-selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <p className="text-sm text-muted-foreground text-center mb-6">
                Como deseas inscribirte?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChooseType("individual")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all duration-200"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                    <User className="size-8 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">Individual</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inscripcion para 1 persona
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChooseType("group")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                    <Users className="size-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">Grupal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      De 2 a 10 personas
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Individual Registration Dialog */}
      {registrationType === "individual" && (
        <RegistrationDialog
          event={event}
          open={dialogOpen}
          onOpenChange={handleIndividualClose}
        />
      )}

      {/* Group Registration Dialog */}
      {registrationType === "group" && (
        <GroupRegistrationDialog
          event={event}
          open={dialogOpen}
          onOpenChange={handleGroupClose}
        />
      )}

      <WhatsAppButton />
    </div>
  );
}
