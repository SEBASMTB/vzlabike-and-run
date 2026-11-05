"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  Ruler,
  Users,
  Trophy,
  BookOpen,
  Package,
  User,
  Star,
  ArrowRight,
  Clock,
} from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import type { EventCardProps } from "./EventCard";

interface EventDetailDialogProps {
  event: EventCardProps | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (event: EventCardProps) => void;
}

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

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onRegister,
}: EventDetailDialogProps) {
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);

  useEffect(() => {
    if (event?.slug && open) {
      fetch(`/api/events/${event.slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.registrations) {
            setRegistrationCount(data.registrations.length);
          } else if (data._count?.registrations !== undefined) {
            setRegistrationCount(data._count.registrations);
          }
        })
        .catch(() => {});
    }
  }, [event?.slug, open]);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Banner Image */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          {event.bannerImage || event.imageUrl ? (
            <img
              src={event.bannerImage || event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Trophy className="size-20 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="mb-2 bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
              {event.category}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {event.title}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Calendar className="size-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(event.date).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock className="size-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Hora</p>
              <p className="text-sm font-semibold text-foreground">
                {formatTime(event.date)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <MapPin className="size-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Ubicacion</p>
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {event.location}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Ruler className="size-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Distancia</p>
              <p className="text-sm font-semibold text-foreground">{event.distance}</p>
            </div>
          </div>

          {/* Full date and location */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-red-500 shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-red-500 shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">
              Cuenta Regresiva
            </p>
            <CountdownTimer targetDate={event.date} />
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <BookOpen className="size-4 text-red-500" />
                Descripcion del Evento
              </h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {/* Registration count + Spots */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">
                Inscritos
              </span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {registrationCount !== null ? registrationCount : "..."}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                participantes
              </span>
            </span>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Inscripcion</p>
                <p className="text-3xl font-bold">${event.price.toFixed(0)} USD</p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {event.sportType || event.category}
                </Badge>
                <p className="text-xs mt-1 opacity-80">
                  {event.ageCalcMode === "event_day"
                    ? "Edad calculada al dia del evento"
                    : "Edad por ano calendario"}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full gradient-primary text-white border-0 text-lg py-6 hover:opacity-90"
            onClick={() => {
              onOpenChange(false);
              // Small delay so detail dialog closes before registration opens
              setTimeout(() => onRegister(event), 200);
            }}
          >
            Inscribirme Ahora
            <ArrowRight className="size-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
