"use client";

import { useState, useEffect } from "react";
import { EventDetailPage } from "./EventDetailPage";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Loader2 } from "lucide-react";
import { type CategoryOption, parseEventCategories } from "@/lib/categories";

interface EventDetailClientProps {
  slug: string;
}

export function EventDetailClient({ slug }: EventDetailClientProps) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) {
          setError("Evento no encontrado");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data);
        setLoading(false);
      } catch {
        setError("Error al cargar el evento");
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

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

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground mb-2">
              {error || "Evento no encontrado"}
            </p>
            <a href="/eventos" className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver todos los eventos →
            </a>
          </div>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  let categories: CategoryOption[] = [];
  if (event.categories && event.categories.trim()) {
    categories = parseEventCategories(event.categories, event.sportType || "running");
  }

  return (
    <EventDetailPage
      event={{ ...event, registrationCount: 0 }}
      categories={categories}
    />
  );
}
