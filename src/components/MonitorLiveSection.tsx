"use client";

import { motion } from "framer-motion";
import {
  Zap,
  MonitorPlay,
  Crosshair,
  Smartphone,
  Play,
  MessageSquare,
} from "lucide-react";

const RESULTS_URL = "https://vbr-results.vercel.app";

const highlights = [
  {
    icon: Zap,
    title: "Resultados inmediatos",
    desc: "Publicados al instante, al cruzar la meta cada atleta aparece en pantalla.",
  },
  {
    icon: MonitorPlay,
    title: "En el mismo sitio del evento",
    desc: "Pantalla en vivo en la zona de meta: consulta sin esperas ni filas.",
  },
  {
    icon: Crosshair,
    title: "Máxima precisión",
    desc: "Tiempos oficiales por chip, validados por nuestro sistema de cronometraje.",
  },
  {
    icon: Smartphone,
    title: "Sin apps ni esperas",
    desc: "Nada de descargar aplicaciones: la información está frente a ti, en vivo.",
  },
];

export function MonitorLiveSection() {
  return (
    <section id="monitor-live" className="py-20 md:py-28 bg-gray-50/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy / mensaje */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-red-600 uppercase">
                Nuevo · Monitor Live
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-5">
              Tus resultados,{" "}
              <span className="text-gradient">en vivo</span> y en el mismo
              lugar del evento
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Los corredores ya no tienen que esperar ni entrar a una
              aplicación para ver sus resultados: el{" "}
              <strong className="text-foreground">Monitor Live</strong> los
              muestra en la pantalla del evento, al instante y con la máxima
              precisión. Cruza la meta y tu tiempo ya está en la pantalla.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-9">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.08 }}
                  className="flex gap-3"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                    <h.icon className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-0.5">
                      {h.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {h.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={RESULTS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 text-sm"
              >
                <Play className="size-4" />
                Ver resultados en línea
              </a>
              <a
                href="/#contacto"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-foreground font-medium px-7 py-3.5 rounded-xl transition-all duration-300 text-sm"
              >
                <MessageSquare className="size-4 text-red-500" />
                Solicitar para mi evento
              </a>
            </div>
          </motion.div>

          {/* Monitor con animación ligera */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            {/* Resplandor de pantalla detrás del monitor */}
            <div
              aria-hidden
              className="absolute -inset-6 bg-gradient-to-br from-red-500/15 via-transparent to-amber-400/15 rounded-[2rem] blur-2xl"
            />

            {/* Bisel del monitor */}
            <div className="relative rounded-2xl bg-[#0B0D17] p-2 shadow-2xl ring-1 ring-black/40">
              <div className="relative rounded-xl overflow-hidden aspect-[16/9]">
                <img
                  src="/monitor-live.webp"
                  alt="Monitor Live de VzlaBike and Run mostrando el Top 10 en vivo del evento Santa Ana Corre 10K con podio y tiempos oficiales"
                  loading="lazy"
                  className="animate-kenburns-live w-full h-full object-cover transform-gpu"
                />
                {/* Degradado inferior sutil para el pie */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                {/* Badge EN VIVO sobre la imagen */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 px-3.5 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[11px] font-bold tracking-widest text-white">
                    EN VIVO
                  </span>
                </div>
              </div>

              {/* Pie del monitor */}
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[11px] font-medium text-white/60">
                  VBR Timing System · Pantalla del evento
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Actualización continua
                </span>
              </div>
            </div>

            {/* Base/soporte del monitor */}
            <div className="relative mx-auto w-32 h-3 bg-gradient-to-b from-[#1A1A2E] to-[#0B0D17] rounded-b-xl" />
            <div className="relative mx-auto w-56 h-1.5 bg-[#0B0D17]/80 rounded-full mt-1" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
