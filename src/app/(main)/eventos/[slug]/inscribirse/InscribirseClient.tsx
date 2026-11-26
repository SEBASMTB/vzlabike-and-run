"use client";

import { useState, useEffect } from "react";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Loader2 } from "lucide-react";

interface InscribirseClientProps {
  slug: string;
}

/** Ficha del Runner vinculado a la sesión (respuesta de /api/auth/me) */
interface RunnerProfile {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  ciudad: string | null;
  team: string | null;
  tallaFranela: string | null;
  grupoSanguineo?: string | null;
  alergiasCondiciones?: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
}

export function InscribirseClient({ slug }: InscribirseClientProps) {
  const [event, setEvent] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [sessionRunner, setSessionRunner] = useState<RunnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Ficha del atleta con sesión iniciada (para auto-completar todo el
        // formulario). Si no hay sesión, la página ya redirigió al login.
        try {
          const meRes = await fetch("/api/auth/me");
          if (meRes.ok) {
            const me = await meRes.json();
            if (me?.runner) setSessionRunner(me.runner);
          }
        } catch {
          // Sin prellenado si falla: el flujo manual sigue funcionando
        }

        // Fetch event
        const eventRes = await fetch(`/api/events/${slug}`);
        if (!eventRes.ok) {
          setError("Evento no encontrado");
          setLoading(false);
          return;
        }
        const eventData = await eventRes.json();

        if (eventData.status === "cancelled" || eventData.status === "finished") {
          setError("Este evento ya no acepta inscripciones");
          setLoading(false);
          return;
        }

        setEvent(eventData);

        // Fetch categories
        try {
          const catRes = await fetch(`/api/events/${slug}/categories`);
          if (catRes.ok) {
            const catData = await catRes.json();
            // Respuesta: { categories: [...], ageCalcMode, eventDate, source }
            const list = Array.isArray(catData)
              ? catData
              : Array.isArray(catData?.categories)
                ? catData.categories
                : [];
            setCategories(list);
          }
        } catch {
          // Categories are optional
        }

        setLoading(false);
      } catch {
        setError("Error al cargar el evento");
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-red-500" />
            <p className="text-muted-foreground">Cargando formulario de inscripción...</p>
          </div>
        </main>
        <div className="print:hidden">
          <Footer />
          <WhatsAppButton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-xl font-semibold text-foreground mb-2">{error}</p>
            <a href="/eventos" className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver todos los eventos →
            </a>
          </div>
        </main>
        <div className="print:hidden">
          <Footer />
          <WhatsAppButton />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const eventData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    date: event.date,
    price: event.price,
    hasShirt: event.hasShirt,
    hasShirtOption: event.hasShirtOption,
    shirtPrice: event.shirtPrice,
    sportType: event.sportType,
    location: event.location,
    // Cuentas de destino de pago configurables (se muestran solo en el Paso 3)
    paymentAccounts: event.paymentAccounts,
  };

  const catList = categories.map((c: any) => ({
    id: c.id || c.value,
    name: c.name || c.label,
    gender: c.gender || "",
    minAge: c.minAge || 0,
    maxAge: c.maxAge || 99,
    price: c.price || event.price || 0,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RegistrationWizard
            event={eventData}
            categories={catList}
            sessionRunner={sessionRunner}
          />
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
        <WhatsAppButton />
      </div>
    </div>
  );
}
