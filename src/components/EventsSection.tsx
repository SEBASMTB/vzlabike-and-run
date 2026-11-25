"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import { EventCard, type EventCardProps } from "./EventCard";

export function EventsSection() {
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [loading, setLoading] = useState(true);

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
    </section>
  );
}
