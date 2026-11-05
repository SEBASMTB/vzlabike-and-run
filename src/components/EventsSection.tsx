"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ArrowRight, Flame, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SectionHeading } from "./SectionHeading";
import { EventCard, type EventCardProps } from "./EventCard";
import dynamic from "next/dynamic";

// Lazy load heavy registration dialogs — only loaded when user clicks "Inscribirse"
const RegistrationDialog = dynamic(
  () => import("./RegistrationDialog").then((mod) => ({ default: mod.RegistrationDialog })),
  { loading: () => <div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>, ssr: false }
);

const GroupRegistrationDialog = dynamic(
  () => import("./GroupRegistrationDialog").then((mod) => ({ default: mod.GroupRegistrationDialog })),
  { loading: () => <div className="p-8 text-center text-muted-foreground">Cargando formulario grupal...</div>, ssr: false }
);

type RegistrationType = "individual" | "group" | null;

export function EventsSection() {
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventCardProps | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registrationType, setRegistrationType] = useState<RegistrationType>(null);

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

  const handleRegister = (event: EventCardProps) => {
    setSelectedEvent(event);
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

  return (
    <section id="eventos" className="py-20 md:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Proximos Eventos"
          subtitle="No te pierdas los eventos deportivos mas emocionantes de Venezuela. Inscríbete ahora y vive la experiencia."
        />

        {/* Featured events strip */}
        {!loading && events.filter((e) => e.featured).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-10 justify-center"
          >
            {events
              .filter((e) => e.featured)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-500 text-white rounded-full px-4 py-2 text-sm font-medium"
                >
                  <Flame className="size-4" />
                  <span>{event.title}</span>
                  <span className="opacity-70">- {event.distance}</span>
                </div>
              ))}
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onRegister={handleRegister}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/eventos">
            <Button
              size="lg"
              className="gradient-primary text-white border-0"
            >
              <CalendarDays className="size-4 mr-2" />
              Ver Todos los Eventos
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Registration Type Chooser Dialog */}
      <Dialog open={dialogOpen && registrationType === null} onOpenChange={(open) => {
        if (!open) {
          setSelectedEvent(null);
          setRegistrationType(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tipo de Inscripcion</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title} — {selectedEvent?.distance}
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
                {/* Individual */}
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

                {/* Grupal */}
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

      {/* Individual Registration Dialog (lazy loaded) */}
      {registrationType === "individual" && (
        <RegistrationDialog
          event={selectedEvent}
          open={dialogOpen}
          onOpenChange={handleIndividualClose}
        />
      )}

      {/* Group Registration Dialog (lazy loaded) */}
      {registrationType === "group" && (
        <GroupRegistrationDialog
          event={selectedEvent}
          open={dialogOpen}
          onOpenChange={handleGroupClose}
        />
      )}
    </section>
  );
}
