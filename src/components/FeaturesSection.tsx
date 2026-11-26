"use client";

import { motion } from "framer-motion";
import {
  Waypoints,
  PenTool,
  Cpu,
  Timer,
  Settings,
  Shield,
  Radio,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Línea de especificación técnica (pie de ficha, monospace) */
  spec: string;
  /** Mini iconos de especificación (solo tarjeta tecnológica) */
  specIcons?: LucideIcon[];
}

/**
 * "¿Por qué elegirnos?" — ficha técnica de cronometraje (negro/rojo).
 * Sin fotografías: iconografía técnica Lucide en contenedores tipo chip.
 * Diseño deliberadamente distinto a "Próximos Eventos" (claro, foto, esquinas redondas):
 * aquí es oscuro, angular (rounded-lg) y con etiquetas mono de ingeniería.
 */
const features: Feature[] = [
  {
    icon: Waypoints,
    title: "Experiencia Organizativa",
    description:
      "Más de 10 años organizando eventos deportivos de primer nivel en Venezuela. Cada carrera es una experiencia perfecta.",
    spec: "TRACK RECORD · 10+ AÑOS · 500+ EVENTOS",
  },
  {
    icon: PenTool,
    title: "Creatividad",
    description:
      "Diseñamos experiencias únicas y memorables que destacan tu evento entre los demás. Innovación en cada detalle.",
    spec: "OUTPUT · EXPERIENCIAS A MEDIDA",
  },
  {
    icon: Cpu,
    title: "Innovación Tecnológica",
    description:
      "Utilizamos la tecnología más avanzada en cronometraje y gestión de eventos para garantizar precisión total.",
    spec: "CHIP RFID · RF 13.56 MHz · LIVE",
    specIcons: [Radio, Activity],
  },
  {
    icon: Timer,
    title: "Organización al Milímetro",
    description:
      "Cada aspecto del evento está planificado con precisión milimétrica. Desde la salida hasta los resultados finales.",
    spec: "TOLERANCIA · ±0.1 s · FOTO-FINISH",
  },
  {
    icon: Settings,
    title: "Adaptabilidad",
    description:
      "Nos adaptamos a cualquier tipo de evento y modalidad: carreras, triatlones, MTB, ciclismo, virtuales y más.",
    spec: "MODOS · RUNNING / MTB / TRIATLÓN / VIRTUAL",
  },
  {
    icon: Shield,
    title: "Compromiso Total",
    description:
      "Nuestro compromiso es con la excelencia. Trabajamos incansablemente para superar las expectativas de cada cliente.",
    spec: "SLA · SOPORTE DE SALIDA A META",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/** Esquinas técnicas tipo plano de ingeniería (marcas en L) */
function CornerBrackets() {
  return (
    <>
      <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-red-500/30 group-hover:border-red-500 transition-colors" />
      <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-red-500/30 group-hover:border-red-500 transition-colors" />
      <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-red-500/30 group-hover:border-red-500 transition-colors" />
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-red-500/30 group-hover:border-red-500 transition-colors" />
    </>
  );
}

export function FeaturesSection() {
  return (
    <section id="nosotros" className="relative py-20 md:py-28 bg-[#0B0B0F] overflow-hidden">
      {/* Retícula técnica de fondo (blueprint grid) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Resplandor rojo superior */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-red-600/10 blur-[120px] rounded-full"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera tipo ficha de ingeniería */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-zinc-400">
            {"//"} Ficha técnica — Sistema de cronometraje
          </p>
        </div>

        <SectionHeading
          light
          title="¿Por Qué Elegirnos?"
          subtitle="Somos líderes en cronometraje deportivo y organización de eventos en Venezuela. Nuestra pasión por el deporte nos impulsa a ser mejores cada día."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative bg-zinc-950/90 border border-zinc-800 rounded-lg p-6 pt-7 overflow-hidden hover:border-red-500/60 hover:bg-zinc-900/90 transition-colors duration-300"
            >
              <CornerBrackets />

              {/* Número de índice de la ficha */}
              <span className="absolute top-4 right-5 font-mono text-sm text-zinc-600 group-hover:text-red-500/80 transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Icono técnico en contenedor tipo chip */}
              <div className="relative w-14 h-14 rounded-md bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex items-center justify-center shadow-[0_0_24px_rgba(220,38,38,0.35)] ring-1 ring-red-500/40 group-hover:scale-105 group-hover:shadow-[0_0_36px_rgba(220,38,38,0.55)] transition-all duration-300">
                <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-red-300/70" />
                <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-red-300/70" />
                <feature.icon className="size-7 text-white" strokeWidth={1.75} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>

              {/* Pie de especificación */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center gap-2 min-h-[2rem]">
                <span className="text-red-500 font-mono text-xs">▸</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  {feature.spec}
                </span>
                {feature.specIcons?.map((Icon, j) => (
                  <Icon key={j} className="size-3.5 text-red-500/80 ml-auto" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
