"use client";

import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface InscribirsePageProps {
  event: any;
  registrationCount: number;
}

export function InscribirsePage({ event, registrationCount }: InscribirsePageProps) {
  const categories = (event.categoryList || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    gender: c.gender,
    minAge: c.minAge,
    maxAge: c.maxAge,
    price: c.price,
  }));

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
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RegistrationWizard
            event={eventData}
            runner={null}
            categories={categories}
          />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
