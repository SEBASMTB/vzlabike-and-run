"use client";

import { motion } from "framer-motion";
import {
  Timer,
  BarChart3,
  Split,
  MapPin,
  Share2,
  Globe,
  Tag,
  Bike,
  FootprintsIcon,
  MonitorSmartphone,
  Cpu,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const timingServices = [
  {
    icon: Timer,
    title: "Cronometraje de Eventos",
    description: "Sistema de cronometraje de alta precisión con tecnología RFID para resultados exactos.",
  },
  {
    icon: BarChart3,
    title: "Resultados en Tiempo Real",
    description: "Publicación instantánea de resultados en línea durante el desarrollo del evento.",
  },
  {
    icon: Split,
    title: "Tiempos Parciales",
    description: "Registros de tiempos intermedios en puntos clave del recorrido.",
  },
  {
    icon: MapPin,
    title: "Seguimiento de Atletas",
    description: "Tracking en vivo de cada participante a lo largo del recorrido.",
  },
  {
    icon: Share2,
    title: "Actualizaciones en Redes Sociales",
    description: "Publicación automática de resultados y highlights en redes sociales.",
  },
  {
    icon: Globe,
    title: "Página de Resultados Personalizada",
    description: "Página web dedicada al evento con resultados, fotos y estadísticas.",
  },
];

const equipmentProducts = [
  {
    icon: Tag,
    title: "TAG Multisport",
    description: "Chip RFID diseñado para triatlón y carreras. Resistente al agua y de alta durabilidad.",
    badge: "Triatlón / Carrera",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Bike,
    title: "TAG Road-MTB",
    description: "Chip especial para ciclismo. Montaje seguro en la bicicleta con máxima precisión.",
    badge: "Ciclismo",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: FootprintsIcon,
    title: "Custom Shoe Tag",
    description: "TAG personalizado para calzado deportivo. Cómodo y fácil de colocar.",
    badge: "Running",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    icon: MonitorSmartphone,
    title: "VBRWorks Platform",
    description: "Plataforma integral de gestión de eventos. Inscripciones, resultados y más.",
    badge: "Software",
    badgeColor: "bg-violet-100 text-violet-700",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ServicesSection() {
  return (
    <section id="servicios" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Timing & Technology */}
        <SectionHeading
          title="Nuestros Servicios"
          subtitle="Ofrecemos soluciones integrales para la gestión y cronometraje de eventos deportivos."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {timingServices.map((service) => (
            <motion.div key={service.title} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg hover:border-red-200 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <service.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Equipment & Products */}
        <SectionHeading
          title="Equipamiento y Productos"
          subtitle="Tecnología de vanguardia para garantizar la mejor experiencia en cronometraje deportivo."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {equipmentProducts.map((product) => (
            <motion.div key={product.title} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <product.icon className="size-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {product.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={product.badgeColor}
                      >
                        {product.badge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
