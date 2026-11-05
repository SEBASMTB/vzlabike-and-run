import { Header } from "@/components/Header";
import { ResultsBanner } from "@/components/ResultsBanner";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { EventsSection } from "@/components/EventsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { PlatformSection } from "@/components/PlatformSection";
import { ClientsSection } from "@/components/ClientsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ResultsFloatingButton } from "@/components/ResultsFloatingButton";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <ResultsBanner />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <EventsSection />
        <ServicesSection />
        <PlatformSection />
        <ClientsSection />
        <ContactSection />
      </main>
      <Footer />
      <ResultsFloatingButton />
      <WhatsAppButton />
    </div>
  );
}
