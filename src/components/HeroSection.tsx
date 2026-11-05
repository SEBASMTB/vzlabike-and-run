"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, ChevronRight, ExternalLink, Trophy, Clock, BarChart3 } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

interface CounterProps {
  target: number;
  label: string;
  suffix: string;
}

function AnimatedCounter({ target, label, suffix }: CounterProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!mounted || hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mounted, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {suffix === "+" ? "+" : ""}
        {mounted ? count.toLocaleString() : "0"}
        {suffix !== "+" ? suffix : ""}
      </div>
      <div className="text-sm text-white/70 mt-1">{label}</div>
    </div>
  );
}

export function HeroSection() {
  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/95 via-[#1A1A2E]/75 to-[#1A1A2E]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/30 to-[#1A1A2E]/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            <span className="text-gradient">25 Años</span> de Experiencia
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-white/90 max-w-3xl mb-4 leading-snug">
            Soluciones Integrales en Ingeniería de Eventos y Cronometraje Deportivo
          </p>

          <p className="text-base md:text-lg text-white/70 max-w-2xl mb-6 leading-relaxed">
            En Venezuela Bike & Run, no solo medimos el tiempo; diseñamos experiencias
            competitivas de clase mundial. Ofrecemos una gestión integral de 360°,
            acompañando a organizadores y marcas desde la concepción de la idea hasta
            la publicación del último resultado.
          </p>

          {/* Results Platform Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-red-600/20 via-red-500/10 to-orange-500/20 border border-red-400/30 rounded-2xl p-5 md:p-6 mb-8 max-w-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="size-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                  La Mejor Plataforma de Resultados de Venezuela
                </h3>
                <p className="text-sm text-white/75 mb-3 leading-relaxed">
                  Consulta resultados en tiempo real, tiempos parciales, clasificaciones por categoría y mucho más. No existe otra plataforma igual en el país.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://vbr-results.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Ver Resultados
                    <ExternalLink className="size-4" />
                  </a>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> Tiempo Real</span>
                    <span className="flex items-center gap-1"><BarChart3 className="size-3.5" /> Estadísticas</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 text-base px-8 h-12"
              onClick={() => handleScroll("#eventos")}
            >
              Ver Próximos Eventos
              <ChevronRight className="size-5" />
            </Button>
            <Button
              size="lg"
              className="gradient-primary text-white border-0 text-base px-8 h-12"
              onClick={() => handleScroll("#contacto")}
            >
              Solicitar Presupuesto
            </Button>
          </div>
        </motion.div>

        {/* Countdown to next featured event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 max-w-sm"
        >
          <p className="text-sm text-white/60 mb-2">Próximo evento destacado:</p>
          <p className="text-white font-semibold mb-2">WOMENS RUN - 5K</p>
          <CountdownTimer
            targetDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
          />
        </motion.div>
      </div>

      {/* Statistics Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-10 mt-auto"
      >
        <div className="bg-black/40 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter target={500} label="Eventos Organizados" suffix="+" />
              <AnimatedCounter target={50000} label="Participantes" suffix="+" />
              <AnimatedCounter target={25} label="Años de Experiencia" suffix="+" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">24/7</div>
                <div className="text-sm text-white/70 mt-1">Soporte Técnico</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <button
        onClick={() => handleScroll("#nosotros")}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-white transition-colors animate-bounce hidden md:block"
        aria-label="Scroll down"
      >
        <ArrowDown className="size-6" />
      </button>
    </section>
  );
}
