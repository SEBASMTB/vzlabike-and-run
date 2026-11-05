"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";

const partners = [
  {
    name: "World Triathlon",
    logo: "/logo-world-athletics.png",
  },
  {
    name: "UCI",
    logo: "/logo-uci.png",
  },
  {
    name: "World Athletics",
    logo: "/logo-world-athletics-2.png",
  },
  {
    name: "FEVE Tri",
    logo: "/logo-fevetri.png",
  },
  {
    name: "FVA",
    logo: "/logo-fva.png",
  },
];

const testimonials = [
  {
    name: "Carlos Mendoza",
    role: "Director, Maratón de Caracas",
    quote:
      "VzlaBike and Run transformó nuestro evento. Los resultados en tiempo real y la plataforma VBRWorks nos dieron un nivel de profesionalismo que nunca habíamos tenido.",
  },
  {
    name: "Ana Lucía Torres",
    role: "Organizadora, Women's Run",
    quote:
      "La atención al detalle y el soporte técnico 24/7 hacen de VzlaBike and Run el mejor aliado para cualquier evento deportivo. Altamente recomendados.",
  },
  {
    name: "Roberto Sánchez",
    role: "Atleta Profesional",
    quote:
      "Como atleta, poder ver mis tiempos parciales y resultados en tiempo real durante la carrera es increíble. La tecnología que usan es de primer nivel mundial.",
  },
];

export function ClientsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [nextTestimonial]);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Clientes y Aliados"
          subtitle="Trabajamos con las marcas y organizaciones más importantes del deporte venezolano."
        />

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-16 lg:gap-x-20">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative flex items-center justify-center"
                title={partner.name}
              >
                <div className="relative flex items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-sm">
                  {/* FVA and FEVE Tri logos — larger */}
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={
                      partner.name === "FVA" || partner.name === "FEVE Tri"
                        ? 120
                        : partner.name === "UCI"
                        ? 80
                        : 140
                    }
                    height={
                      partner.name === "FVA" || partner.name === "FEVE Tri"
                        ? 120
                        : partner.name === "UCI"
                        ? 80
                        : 60
                    }
                    className="object-contain transition-all duration-300 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                    priority={index < 3}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gray-50 rounded-2xl p-8 md:p-12">
            <Quote className="size-10 text-red-300 mb-4" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6">
                  &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-foreground">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevTestimonial}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentTestimonial
                        ? "bg-red-500"
                        : "bg-gray-300"
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTestimonial}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
