"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Calendar, Ruler, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";

export interface EventCardProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  distance: string;
  category: string;
  imageUrl: string;
  price: number;
  featured?: boolean;
  sportType?: string;
  bannerImage?: string;
  ageCalcMode?: string;
  categories?: string;
  hasShirt?: boolean;
  onRegister?: (event: EventCardProps) => void;
}

const categoryColors: Record<string, string> = {
  Carrera: "bg-red-100 text-red-700 border-red-200",
  Triatlon: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Triatlón: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Virtual: "bg-violet-100 text-violet-700 border-violet-200",
  MTB: "bg-amber-100 text-amber-700 border-amber-200",
};

const categoryGradients: Record<string, string> = {
  Carrera: "from-red-500 to-red-500",
  Triatlon: "from-emerald-500 to-teal-500",
  Triatlón: "from-emerald-500 to-teal-500",
  Virtual: "from-violet-500 to-purple-500",
  MTB: "from-amber-500 to-yellow-500",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function EventCard({
  id,
  slug,
  title,
  description,
  date,
  location,
  distance,
  category,
  imageUrl,
  price,
  featured,
  sportType,
  bannerImage,
  ageCalcMode,
  categories,
  hasShirt,
  onRegister,
}: EventCardProps) {
  const router = useRouter();
  const gradientClass = categoryGradients[category] || "from-red-500 to-red-500";
  const colorClass = categoryColors[category] || "bg-red-100 text-red-700";

  const eventData: EventCardProps = {
    id,
    slug,
    title,
    description: description || "",
    date,
    location,
    distance,
    category,
    imageUrl,
    price,
    featured,
    sportType,
    bannerImage,
    ageCalcMode,
    categories,
    hasShirt,
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/eventos/${slug}`)}
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        {bannerImage || imageUrl ? (
          <img
            src={bannerImage || imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category Badge */}
        <Badge
          className={`absolute top-3 left-3 ${colorClass} border font-medium`}
        >
          {category}
        </Badge>

        {/* Featured Badge */}
        {featured && (
          <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 font-medium">
            ⭐ Destacado
          </Badge>
        )}

        {/* Distance */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <Ruler className="size-4 text-red-600" />
          <span className="text-sm font-bold text-foreground">{distance}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">
          {title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span className="text-sm">{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-4">
          <CountdownTimer targetDate={date} compact />
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <span className="text-sm text-muted-foreground">Desde</span>
            <div className="text-2xl font-bold text-foreground">
              ${price.toFixed(0)}
              <span className="text-sm font-normal text-muted-foreground ml-1">USD</span>
            </div>
          </div>
          <Button
            size="lg"
            className="gradient-primary text-white border-0 hover:opacity-90"
          >
            Ver Detalles
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
