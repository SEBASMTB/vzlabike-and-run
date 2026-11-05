"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Trophy,
  Medal,
  Shirt,
  BookOpen,
  ArrowRight,
  Tag,
  Star,
  Info,
  Shield,
  Package,
  Gift,
  Timer,
  ScrollText,
  Droplets,
  Apple,
  Car,
  GraduationCap,
  CreditCard,
  Bike,
  Backpack,
  Flame,
  Sparkles,
  Heart,
  Target,
  Camera,
  BarChart3,
  Radio,
  Zap,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RegistrationDialog } from "@/components/RegistrationDialog";
import { SponsorsCarousel } from "@/components/SponsorsCarousel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

// ============================================================
// Interfaces
// ============================================================

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  distance: string;
  category: string;
  imageUrl: string;
  bannerImage: string;
  price: number;
  priceBs: number;
  status: string;
  maxParticipants: number;
  eventTime: string;
  featured: boolean;
  organizer: string;
  prizes: string;
  prizesImages?: string;        // JSON array de base64
  rules: string;
  rulesFile?: string;           // base64 PDF/imagen
  kitInfo: string;
  kitInfoDetails?: string;      // contenido detallado del kit
  shirtImage?: string;          // base64 imagen franela
  sponsors: string;
  sponsorsLogos?: string;       // JSON array de {logo, name, url}
  sportType: string;
  ageCalcMode: string;
  categoryInterval: number;
  registrationCount: number;
  hasShirt: boolean;
  categories: string;
}

interface CategoryOption {
  value: string;
  label: string;
  minAge: number;
  maxAge: number;
}

interface EventDetailPageProps {
  event: EventData;
  categories: CategoryOption[];
}

// ============================================================
// Kit Visual Parser — auto-detect items and assign icons
// ============================================================

interface KitItem {
  label: string;
  icon: React.ReactNode;
  gradient: string;
}

const KIT_PATTERNS: { regex: RegExp; icon: React.ReactNode; gradient: string; defaultLabel?: string }[] = [
  { regex: /jersey|franela|camiseta|remera|playera|shirt/i, icon: <Shirt className="size-7" />, gradient: "from-red-500 to-rose-600" },
  { regex: /chip|cronometr|timing|dorsal|bib|n.mero/i, icon: <Timer className="size-7" />, gradient: "from-emerald-500 to-green-600" },
  { regex: /medalla/i, icon: <Medal className="size-7" />, gradient: "from-amber-500 to-yellow-600" },
  { regex: /certificado|diploma/i, icon: <ScrollText className="size-7" />, gradient: "from-blue-500 to-indigo-600" },
  { regex: /tula|mochila|bolsa|malet.n/i, icon: <Backpack className="size-7" />, gradient: "from-purple-500 to-violet-600" },
  { regex: /agua|hidrataci.n|bebida/i, icon: <Droplets className="size-7" />, gradient: "from-cyan-500 to-teal-600" },
  { regex: /alimento|snack|comida|fruta|avituallamiento/i, icon: <Apple className="size-7" />, gradient: "from-orange-500 to-amber-600" },
  { regex: /patrocinante|regalo|obsequio|gift|sorpresa/i, icon: <Gift className="size-7" />, gradient: "from-pink-500 to-fuchsia-600" },
  { regex: /gorra|gorro/i, icon: <GraduationCap className="size-7" />, gradient: "from-slate-500 to-gray-600" },
  { regex: /casco/i, icon: <Shield className="size-7" />, gradient: "from-zinc-500 to-neutral-600" },
  { regex: /carro\s*escoba|sag\s*vehicle|camioneta/i, icon: <Car className="size-7" />, gradient: "from-sky-500 to-blue-600" },
  { regex: /llavero|llave/i, icon: <CreditCard className="size-7" />, gradient: "from-stone-500 to-neutral-600" },
  { regex: /toalla/i, icon: <Sparkles className="size-7" />, gradient: "from-teal-500 to-cyan-600" },
  { regex: /bici|bicicleta/i, icon: <Bike className="size-7" />, gradient: "from-lime-500 to-green-600" },
  { regex: /foto|fotograf/i, icon: <Camera className="size-7" />, gradient: "from-indigo-500 to-purple-600" },
  { regex: /masaje|recuperaci.n/i, icon: <Heart className="size-7" />, gradient: "from-rose-500 to-pink-600" },
  { regex: /troph?eo|copa/i, icon: <Trophy className="size-7" />, gradient: "from-yellow-500 to-amber-600" },
];

function parseKitItems(text: string): KitItem[] {
  // Split by newlines first, then by bullets, then by commas
  const rawItems = text
    .split(/\n/)
    .flatMap(line => {
      // Check if line has bullets/numbered items
      const parts = line.split(/[•\-\*]\s*/);
      return parts.length > 1 ? parts : [line];
    })
    .map(s => s.trim())
    .filter(Boolean);

  // If only one line and it has commas, split by comma
  let items = rawItems;
  if (items.length <= 1 && text.includes(",")) {
    items = text.split(",").map(s => s.trim()).filter(Boolean);
  }

  return items.map(item => {
    for (const pattern of KIT_PATTERNS) {
      if (pattern.regex.test(item)) {
        return { label: item, icon: pattern.icon, gradient: pattern.gradient };
      }
    }
    // Default icon for unrecognized items
    return { label: item, icon: <Package className="size-7" />, gradient: "from-gray-500 to-slate-600" };
  });
}

// ============================================================
// Prizes Visual Parser — detect positions and structure
// ============================================================

interface PrizeItem {
  label: string;
  position?: number; // 1, 2, 3
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  textColor: string;
}

function parsePrizes(text: string): PrizeItem[] {
  const lines = text
    .split(/\n/)
    .map(s => s.trim())
    .filter(Boolean);

  return lines.map(line => {
    const lower = line.toLowerCase();
    let position: number | undefined;
    let icon = <Trophy className="size-5" />;
    let accentColor = "text-amber-600";
    let borderColor = "border-amber-200";
    let bgColor = "bg-gradient-to-br from-amber-50 to-yellow-50";
    let iconBg = "bg-amber-100";
    let textColor = "text-amber-900";

    if (/1.er|primer|1ro|1.o|primero|1\.|oro|gold/i.test(lower)) {
      position = 1;
      icon = <Trophy className="size-5" />;
      accentColor = "text-amber-500";
      borderColor = "border-amber-300";
      bgColor = "bg-gradient-to-br from-amber-50 to-yellow-50";
      iconBg = "bg-amber-200";
      textColor = "text-amber-900";
    } else if (/2.do|segundo|2ro|2\.|plata|silver/i.test(lower)) {
      position = 2;
      icon = <Medal className="size-5" />;
      accentColor = "text-gray-400";
      borderColor = "border-gray-300";
      bgColor = "bg-gradient-to-br from-gray-50 to-slate-100";
      iconBg = "bg-gray-200";
      textColor = "text-gray-700";
    } else if (/3.er|tercer|3ro|3\.|bronce|bronze/i.test(lower)) {
      position = 3;
      icon = <Medal className="size-5" />;
      accentColor = "text-orange-600";
      borderColor = "border-orange-200";
      bgColor = "bg-gradient-to-br from-orange-50 to-amber-50";
      iconBg = "bg-orange-200";
      textColor = "text-orange-900";
    } else if (/trofeo|copa|premio/i.test(lower)) {
      icon = <Trophy className="size-5" />;
      accentColor = "text-yellow-500";
      borderColor = "border-yellow-200";
      bgColor = "bg-gradient-to-br from-yellow-50 to-amber-50";
      iconBg = "bg-yellow-100";
      textColor = "text-yellow-900";
    } else if (/medall|podio/i.test(lower)) {
      icon = <Medal className="size-5" />;
      accentColor = "text-blue-500";
      borderColor = "border-blue-200";
      bgColor = "bg-gradient-to-br from-blue-50 to-indigo-50";
      iconBg = "bg-blue-100";
      textColor = "text-blue-900";
    } else if (/efectivo|dinero|cash|bs\b|usd|\$|premio.*econ/i.test(lower)) {
      icon = <Target className="size-5" />;
      accentColor = "text-green-500";
      borderColor = "border-green-200";
      bgColor = "bg-gradient-to-br from-green-50 to-emerald-50";
      iconBg = "bg-green-100";
      textColor = "text-green-900";
    }

    return { label: line, position, icon, accentColor, borderColor, bgColor, iconBg, textColor };
  });
}

// ============================================================
// Constants
// ============================================================

const sportTypeLabels: Record<string, string> = {
  running: "Running / Carrera",
  mtb: "Ciclismo MTB",
  triathlon: "Triatlón",
  trekking: "Trekking",
  virtual: "Virtual",
  duathlon: "Duatlón",
  aquathlon: "Acuatlón",
  trail: "Trail Running",
  recreativo: "Recreativo (Tiempo Protegido)",
  seguridad: "Organismos de Seguridad",
  other: "Otro",
  "mtb-ruta": "MTB + Ruta (Combinado)",
};

const sportTypeColors: Record<string, string> = {
  running: "bg-red-100 text-red-700 border-red-200",
  mtb: "bg-amber-100 text-amber-700 border-amber-200",
  triathlon: "bg-emerald-100 text-emerald-700 border-emerald-200",
  trekking: "bg-green-100 text-green-700 border-green-200",
  virtual: "bg-violet-100 text-violet-700 border-violet-200",
  duathlon: "bg-blue-100 text-blue-700 border-blue-200",
  aquathlon: "bg-cyan-100 text-cyan-700 border-cyan-200",
  trail: "bg-orange-100 text-orange-700 border-orange-200",
  recreativo: "bg-pink-100 text-pink-700 border-pink-200",
  seguridad: "bg-slate-100 text-slate-700 border-slate-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
  "mtb-ruta": "bg-gradient-to-r from-amber-100 to-red-100 text-red-700 border-red-200",
};

const detailIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  distance: { icon: <Target className="size-5" />, color: "text-red-500" },
  sport: { icon: <Flame className="size-5" />, color: "text-orange-500" },
  location: { icon: <MapPin className="size-5" />, color: "text-blue-500" },
  organizer: { icon: <Users className="size-5" />, color: "text-purple-500" },
  participants: { icon: <Users className="size-5" />, color: "text-green-500" },
  ageCalc: { icon: <Calendar className="size-5" />, color: "text-teal-500" },
};

function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================
// Animation variants
// ============================================================

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

// ============================================================
// Main Component
// ============================================================

export function EventDetailPage({ event, categories }: EventDetailPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const spotsLeft = event.maxParticipants - event.registrationCount;

  const kitItems = useMemo(() => (event.kitInfo ? parseKitItems(event.kitInfo) : []), [event.kitInfo]);
  const prizeItems = useMemo(() => (event.prizes ? parsePrizes(event.prizes) : []), [event.prizes]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header — mismo que la página principal */}
      <Header />

      {/* Banner */}
      <div className="relative pt-16 md:pt-20">
        {event.bannerImage || event.imageUrl ? (
          <div className="relative h-[280px] sm:h-[350px] md:h-[420px] w-full overflow-hidden">
            <img
              src={event.bannerImage || event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="relative h-[280px] sm:h-[350px] md:h-[420px] w-full gradient-primary">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content over banner */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap gap-2">
                <Badge className={sportTypeColors[event.sportType] || sportTypeColors.other}>
                  {sportTypeLabels[event.sportType] || event.category}
                </Badge>
                {event.featured && (
                  <Badge className="bg-red-500 text-white border-0">
                    <Star className="size-3 mr-1" /> Destacado
                  </Badge>
                )}
                {event.status === "active" && (
                  <Badge className="bg-green-500 text-white border-0">
                    Inscripciones Abiertas
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {formatDateFull(event.date)}
                </span>
                {event.eventTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {event.eventTime}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {event.location}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/50"
              >
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Cuenta Regresiva
                </p>
                <CountdownTimer targetDate={event.date} />
              </motion.div>

              {/* Description */}
              {event.description && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Info className="size-5 text-red-500" />
                    Información General
                  </h2>
                  <div className="bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-6 border border-gray-200/50">
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                      {event.description}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Event Details Grid — Enhanced with icons */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                  <Calendar className="size-5 text-red-500" />
                  Detalles del Evento
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-red-50 text-red-500 group-hover:scale-110 transition-transform">
                        <Target className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Distancia(s)</p>
                        <p className="font-semibold text-foreground">{event.distance}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-orange-50 text-orange-500 group-hover:scale-110 transition-transform">
                        <Flame className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Disciplina</p>
                        <p className="font-semibold text-foreground">
                          {sportTypeLabels[event.sportType] || event.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                        <MapPin className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Lugar</p>
                        <p className="font-semibold text-foreground">{event.location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-500 group-hover:scale-110 transition-transform">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Organizador</p>
                        <p className="font-semibold text-foreground">{event.organizer || "VzlaBike and Run®"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-green-50 text-green-500 group-hover:scale-110 transition-transform">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Participantes</p>
                        <p className="font-semibold text-foreground">
                          {event.registrationCount} / {event.maxParticipants}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-500 group-hover:scale-110 transition-transform">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cálculo de Edad</p>
                        <p className="font-semibold text-foreground">
                          {event.ageCalcMode === "calendar_year"
                            ? "Año Calendario"
                            : "Fecha del Día del Evento"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Categories — only show if admin explicitly created them */}
              {categories.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Tag className="size-5 text-red-500" />
                    Categorías por Edad
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Las categorías se asignan automáticamente al momento de la inscripción según la disciplina{" "}
                    <strong>{sportTypeLabels[event.sportType] || event.category}</strong>.
                  </p>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {categories.map((cat) => (
                      <motion.div
                        key={cat.value}
                        variants={item}
                        className="bg-white rounded-xl border p-3 text-center hover:border-red-300 hover:shadow-md transition-all cursor-default"
                      >
                        <p className="text-[10px] font-mono text-red-500 font-bold">{cat.value}</p>
                        <p className="font-semibold text-sm text-foreground mt-0.5">{cat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {/* ========== FOTO OFICIAL DE LA FRANELA ========== */}
              {event.shirtImage && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Shirt className="size-5 text-red-500" />
                    Franela Oficial del Evento
                  </h2>
                  <div className="bg-white rounded-2xl border p-6 flex flex-col sm:flex-row gap-6 items-center">
                    <img
                      src={event.shirtImage}
                      alt="Franela oficial"
                      className="w-full sm:w-64 h-auto rounded-xl object-contain"
                    />
                    {event.kitInfoDetails && (
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">Contenido del Kit</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {event.kitInfoDetails}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* ========== KIT DETAILS (solo texto, sin imagen) ========== */}
              {!event.shirtImage && event.kitInfoDetails && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Package className="size-5 text-red-500" />
                    Contenido del Kit
                  </h2>
                  <div className="bg-white rounded-2xl border p-6">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {event.kitInfoDetails}
                    </p>
                  </div>
                </motion.section>
              )}

              {/* ========== KIT DE PARTICIPANTE — VISUAL CARDS ========== */}
              {kitItems.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                    <Shirt className="size-5 text-red-500" />
                    Kit de Participante
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Todo lo que incluye tu inscripción
                  </p>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {kitItems.map((kit, idx) => (
                      <motion.div
                        key={idx}
                        variants={item}
                        className="relative group cursor-default"
                      >
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                          {/* Icon with gradient background */}
                          <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${kit.gradient} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                            {kit.icon}
                          </div>
                          {/* Label */}
                          <p className="text-xs font-medium text-center text-foreground leading-tight">
                            {kit.label}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {/* ========== PREMIOS — VISUAL CARDS ========== */}
              {prizeItems.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                    <Trophy className="size-5 text-yellow-500" />
                    Premios
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Reconocimiento a los mejores
                  </p>

                  {/* Podium for top 3 */}
                  {prizeItems.some(p => p.position) ? (
                    <div className="space-y-4">
                      {/* Top 3 podium cards */}
                      {prizeItems.filter(p => p.position).length >= 2 && (
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                          {[...prizeItems.filter(p => p.position).sort((a, b) => (a.position || 99) - (b.position || 99))].map((prize, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + idx * 0.1 }}
                              className={`flex-1 ${prize.position === 1 ? "sm:order-2" : prize.position === 2 ? "sm:order-1" : "sm:order-3"}`}
                            >
                              <div className={`${prize.bgColor} rounded-2xl p-5 border ${prize.borderColor} h-full relative overflow-hidden`}>
                                {/* Position badge */}
                                <div className={`absolute top-3 right-3 ${prize.iconBg} rounded-full w-8 h-8 flex items-center justify-center ${prize.accentColor} font-bold text-sm`}>
                                  {prize.position}
                                </div>
                                {/* Icon */}
                                <div className={`${prize.iconBg} w-12 h-12 rounded-xl flex items-center justify-center ${prize.accentColor} mb-3`}>
                                  {prize.icon}
                                </div>
                                <p className={`font-semibold text-sm ${prize.textColor} leading-snug`}>
                                  {prize.label}
                                </p>
                                {prize.position === 1 && (
                                  <div className="absolute -bottom-1 -right-1 opacity-10">
                                    <Trophy className="size-24 text-amber-500" />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Remaining prizes (non-positioned or if no podium) */}
                      {prizeItems.filter(p => !p.position || prizeItems.filter(pp => pp.position).length < 2).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {prizeItems
                            .filter(p => !p.position || prizeItems.filter(pp => pp.position).length < 2)
                            .map((prize, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + idx * 0.05 }}
                            >
                              <div className={`${prize.bgColor} rounded-xl p-4 border ${prize.borderColor} flex items-start gap-3 hover:shadow-md transition-shadow`}>
                                <div className={`${prize.iconBg} w-10 h-10 rounded-lg flex items-center justify-center ${prize.accentColor} shrink-0`}>
                                  {prize.icon}
                                </div>
                                <p className={`text-sm font-medium ${prize.textColor} leading-snug`}>
                                  {prize.label}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No positions detected — show as elegant list */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prizeItems.map((prize, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                        >
                          <div className={`${prize.bgColor} rounded-xl p-4 border ${prize.borderColor} flex items-start gap-3 hover:shadow-md transition-shadow`}>
                            <div className={`${prize.iconBg} w-10 h-10 rounded-lg flex items-center justify-center ${prize.accentColor} shrink-0`}>
                              {prize.icon}
                            </div>
                            <p className={`text-sm font-medium ${prize.textColor} leading-snug`}>
                              {prize.label}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.section>
              )}

              {/* Prize Images Gallery */}
              {event.prizesImages && (() => {
                try {
                  const imgs = JSON.parse(event.prizesImages);
                  if (!Array.isArray(imgs) || imgs.length === 0) return null;
                  return (
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32 }}
                    >
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                        <Camera className="size-5 text-yellow-500" />
                        Afiches de Premios
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {imgs.map((img: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + idx * 0.1 }}
                            className="rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <img
                              src={img}
                              alt={`Afich de premios ${idx + 1}`}
                              className="w-full h-auto object-contain bg-gray-50"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  );
                } catch { return null; }
              })()}

              {/* Rules */}
              {event.rules && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <BookOpen className="size-5 text-red-500" />
                    Reglas y Reglamento
                  </h2>
                  <div className="bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-6 border border-gray-200/50">
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                      {event.rules}
                    </div>

                    {/* Reglamento completo descargable (PDF o imagen) */}
                    {event.rulesFile && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <a
                          href={event.rulesFile}
                          download={`reglamento-${event.slug}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          <FileText className="size-4" />
                          Descargar Reglamento Completo
                          <ArrowRight className="size-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* Sponsors — Carrusel de logos + texto */}
              {(event.sponsorsLogos || event.sponsors) && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Star className="size-5 text-red-500" />
                    Patrocinadores
                  </h2>

                  {/* Carrusel animado de logos */}
                  {event.sponsorsLogos && (() => {
                    try {
                      const logos = JSON.parse(event.sponsorsLogos);
                      if (!Array.isArray(logos) || logos.length === 0) return null;
                      return <SponsorsCarousel sponsorsLogos={event.sponsorsLogos} />;
                    } catch { return null; }
                  })()}

                  {/* Texto adicional de patrocinadores */}
                  {event.sponsors && (
                    <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/50">
                      <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                        {event.sponsors}
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              {/* Resultados Section */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="size-5 text-red-500" />
                  Resultados del Evento
                </h2>
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  {/* Dark gradient background matching VBRWorks portal */}
                  <div className="bg-gradient-to-br from-[#0B0D17] via-[#111827] to-[#0B0D17] p-6 sm:p-8">
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                      backgroundSize: '40px 40px'
                    }} />

                    <div className="relative z-10">
                      {/* Header with branding */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Trophy className="size-5 text-red-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm tracking-wide">VBRWorks</span>
                              <span className="text-white/30 font-light text-xs">®</span>
                            </div>
                            <p className="text-white/40 text-xs">Plataforma de Resultados</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                          <Activity className="size-3 text-green-400 animate-pulse" />
                          <span className="text-[10px] font-medium text-green-400">EN LÍNEA</span>
                        </div>
                      </div>

                      {/* Event info strip */}
                      <div className="flex flex-wrap items-center gap-3 mb-6 text-xs">
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                          <Calendar className="size-3.5 text-white/40" />
                          <span className="text-white/60">{formatDateFull(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                          <MapPin className="size-3.5 text-white/40" />
                          <span className="text-white/60">{event.location}</span>
                        </div>
                        {event.sportType && (
                          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                            <Bike className="size-3.5 text-white/40" />
                            <span className="text-white/60">{event.sportType === 'cycling' ? 'Ciclismo' : event.sportType === 'running' ? 'Running' : 'Multideporte'}</span>
                          </div>
                        )}
                      </div>

                      {/* Feature cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                          { icon: <Radio className="size-4" />, label: 'Cronometraje RFID', desc: 'Tiempos oficiales' },
                          { icon: <Zap className="size-4" />, label: 'En Vivo', desc: 'Tiempo real' },
                          { icon: <BarChart3 className="size-4" />, label: 'Estadísticas', desc: 'Data detallada' },
                          { icon: <Users className="size-4" />, label: 'Clasificaciones', desc: 'Posiciones' },
                        ].map((f) => (
                          <div
                            key={f.label}
                            className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300 group"
                          >
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 mb-2 group-hover:bg-red-500/20 transition-colors">
                              <span className="text-red-400">{f.icon}</span>
                            </div>
                            <p className="text-white text-xs font-medium mb-0.5">{f.label}</p>
                            <p className="text-white/30 text-[10px]">{f.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <a
                          href="https://vbr-results.vercel.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
                        >
                          <BarChart3 className="size-4" />
                          Ver Resultados
                          <ExternalLink className="size-3.5" />
                        </a>
                        <p className="text-white/25 text-[11px]">
                          Resultados procesados por VBRWorks®
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right Column - Registration Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Price Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border shadow-lg overflow-hidden"
                >
                  {/* Price Header */}
                  <div className="gradient-primary p-6 text-white text-center">
                    <p className="text-sm opacity-90 mb-1">Inversión</p>
                    <div className="flex items-center justify-center gap-3">
                      <div>
                        <span className="text-4xl font-bold">${event.price.toFixed(0)}</span>
                        <span className="text-sm opacity-80 ml-1">USD</span>
                      </div>
                    </div>
                    {event.priceBs > 0 && (
                      <p className="text-sm opacity-80 mt-1">
                        Bs. {event.priceBs.toFixed(0)}
                      </p>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Quick info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-4 shrink-0" />
                        <span>{formatDateFull(event.date)}</span>
                      </div>
                      {event.eventTime && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="size-4 shrink-0" />
                          <span>{event.eventTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Spots */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cupos disponibles</span>
                        <span className={spotsLeft <= 10 ? "text-red-600 font-semibold" : "font-medium"}>
                          {spotsLeft > 0 ? spotsLeft : 0} de {event.maxParticipants}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((event.registrationCount / event.maxParticipants) * 100, 100)}%` }}
                        />
                      </div>
                      {spotsLeft <= 10 && spotsLeft > 0 && (
                        <p className="text-xs text-red-500 font-medium">
                          ¡Quedan pocos cupos!
                        </p>
                      )}
                      {spotsLeft <= 0 && (
                        <p className="text-xs text-red-500 font-medium">
                          Cupos agotados
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Register Button */}
                    {event.status === "cancelled" ? (
                      <Button disabled className="w-full" size="lg">
                        Evento Cancelado
                      </Button>
                    ) : spotsLeft <= 0 ? (
                      <Button disabled className="w-full" size="lg">
                        Cupos Agotados
                      </Button>
                    ) : (
                      <Link href={`/eventos/${event.slug}/inscribirse`} className="block">
                        <Button
                          className="w-full gradient-primary text-white border-0 hover:opacity-90"
                          size="lg"
                        >
                          Inscribirme Ahora
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      </Link>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      Acepta la liberación de responsabilidad al inscribirte
                    </p>
                  </div>
                </motion.div>

                {/* Payment Methods Preview */}
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Métodos de pago aceptados:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Binance</Badge>
                    <Badge variant="outline" className="text-xs">Zelle</Badge>
                    <Badge variant="outline" className="text-xs">Pago Móvil</Badge>
                    <Badge variant="outline" className="text-xs">Transferencia</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — mismo que la página principal */}
      <Footer />
      <WhatsAppButton />

      {/* Registration Dialog */}
      <RegistrationDialog
        event={{
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          distance: event.distance,
          category: event.category,
          imageUrl: event.bannerImage || event.imageUrl,
          price: event.price,
          priceBs: event.priceBs,
          featured: event.featured,
          sportType: event.sportType || "running",
          ageCalcMode: event.ageCalcMode || "calendar_year",
          hasShirt: event.hasShirt,
          categories: event.categories,
        }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventData={{
          organizer: event.organizer,
        }}
      />
    </div>
  );
}
