"use client";

import { motion } from "framer-motion";
import { Trophy, Lightbulb, Zap, Target, Settings, Shield } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    icon: Trophy,
    image: "/features/experiencia.webp",
    alt: "Meta de maratón con cientos de corredores cruzando el arco de cronometraje",
    title: "Experiencia Organizativa",
    description:
      "Más de 10 años organizando eventos deportivos de primer nivel en Venezuela. Cada carrera es una experiencia perfecta.",
  },
  {
    icon: Lightbulb,
    image: "/features/creatividad.webp",
    alt: "Salida de carrera con polvos de colores vibrantes",
    title: "Creatividad",
    description:
      "Diseñamos experiencias únicas y memorables que destacan tu evento entre los demás. Innovación en cada detalle.",
  },
  {
    icon: Zap,
    image: "/features/tecnologia.webp",
    alt: "Sistema de cronometraje electrónico con reloj LED en la meta",
    title: "Innovación Tecnológica",
    description:
      "Utilizamos la tecnología más avanzada en cronometraje y gestión de eventos para garantizar precisión total.",
  },
  {
    icon: Target,
    image: "/features/precision.webp",
    alt: "Vista aérea de la línea de salida organizada con conos y señalización",
    title: "Organización al Milímetro",
    description:
      "Cada aspecto del evento está planificado con precisión milimétrica. Desde la salida hasta los resultados finales.",
  },
  {
    icon: Settings,
    image: "/features/adaptabilidad.webp",
    alt: "Montañista MTB, nadador en aguas abiertas y trail runner en montaña",
    title: "Adaptabilidad",
    description:
      "Nos adaptamos a cualquier tipo de evento y modalidad: carreras, triatlones, MTB, ciclismo, virtuales y más.",
  },
  {
    icon: Shield,
    image: "/features/compromiso.webp",
    alt: "Voluntaria colocando la medalla a un corredor en la meta",
    title: "Compromiso Total",
    description:
      "Nuestro compromiso es con la excelencia. Trabajamos incansablemente para superar las expectativas de cada cliente.",
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

export function FeaturesSection() {
  return (
    <section id="nosotros" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="¿Por Qué Elegirnos?"
          subtitle="Somos líderes en cronometraje deportivo y organización de eventos en Venezuela. Nuestra pasión por el deporte nos impulsa a ser mejores cada día."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300"
            >
              {/* Imagen relacionada con el texto */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                {/* Icono superpuesto entre imagen y contenido */}
                <div className="absolute -bottom-6 left-6 w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-lg ring-4 ring-card group-hover:scale-110 transition-transform">
                  <feature.icon className="size-7 text-white" />
                </div>
              </div>
              <div className="p-6 pt-9">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
