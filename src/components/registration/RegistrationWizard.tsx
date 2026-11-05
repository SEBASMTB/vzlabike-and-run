"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import {
  ESTADOS_VENEZUELA,
  PARENTESCOS,
  CLUBES_VENEZUELA,
  CLUB_OPCIONES_ESPECIALES,
  TALLAS_FRANELA,
  METODOS_PAGO,
  type MetodoPago,
} from "@/lib/venezuela-data";
import { useToast } from "@/hooks/use-toast";
import { OrderSummary } from "./OrderSummary";
import {
  User,
  MapPin,
  Users,
  Shirt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  DollarSign,
  Info,
  Loader2,
  ArrowLeft,
  Pencil,
  X,
  Lock,
  Smartphone,
  Wallet,
  Banknote,
  TrendingUp,
  Hash,
  Building2,
  ShieldCheck,
  Heart,
  PartyPopper,
  Calendar,
  Trophy,
  Phone,
  Mail,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface RegEvent {
  id: string;
  title: string;
  slug: string;
  date: string;
  price: number;
  hasShirt: boolean;
  hasShirtOption: string; // INCLUDED, OPTIONAL, NONE
  shirtPrice: number | null;
  sportType: string;
  location: string;
}

interface RegRunner {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  genero: string;
  estado: string;
}

interface RegCategory {
  id: string;
  name: string;
  gender: string;
  minAge: number;
  maxAge: number;
  price: number;
}

interface RegFormData {
  registrationType: "self" | "other";
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  genero: string;
  estado: string;
  ciudad: string;
  emergName: string;
  emergPhone: string;
  emergRelation: string;
  club: string;
  clubOtro: string;
  categoryId: string;
  shirtSize: string;
  paymentMethod: string;
  paymentRef: string;
  paymentProof: string; // base64
}

interface RegistrationWizardProps {
  event: RegEvent;
  runner?: RegRunner | null;
  categories: RegCategory[];
}

// ============================================================
// Constants
// ============================================================

const STEPS: { id: number; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 1, label: "Perfil del Participante", shortLabel: "Perfil", icon: User },
  { id: 2, label: "Datos Geográficos y Contacto", shortLabel: "Geografía", icon: MapPin },
  { id: 3, label: "Club y Categoría", shortLabel: "Club", icon: Users },
  { id: 4, label: "Kit y Pago", shortLabel: "Kit y Pago", icon: CreditCard },
];

const TOTAL_STEPS = STEPS.length;

const GENDERS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

const PAYMENT_ICONS: Record<string, LucideIcon> = {
  transferencia: Banknote,
  movil: Smartphone,
  divisas: DollarSign,
  zelle: Wallet,
};

const EMPTY_FORM: RegFormData = {
  registrationType: "self",
  cedula: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  email: "",
  telefono: "",
  genero: "",
  estado: "",
  ciudad: "",
  emergName: "",
  emergPhone: "",
  emergRelation: "",
  club: "",
  clubOtro: "",
  categoryId: "",
  shirtSize: "",
  paymentMethod: "",
  paymentRef: "",
  paymentProof: "",
};

// ============================================================
// Date helpers
// ============================================================

/** Parse DD/MM/YYYY into a Date */
function parseDDMMYYYY(str: string): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

/** Parse any date string (DD/MM/YYYY, YYYY-MM-DD or native) */
function parseAnyDate(str: string): Date | null {
  if (!str) return null;
  const ddmmyyyy = parseDDMMYYYY(str);
  if (ddmmyyyy) return ddmmyyyy;
  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }
  const native = new Date(str);
  return isNaN(native.getTime()) ? null : native;
}

/** Convert a Date into YYYY-MM-DD for input[type=date] */
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert a Date into DD/MM/YYYY for the API */
function toDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${day}/${m}/${y}`;
}

/** Calculate full years of age from a birth date */
function calcAge(birth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Map runner data into form fields */
function runnerToForm(runner: RegRunner): Partial<RegFormData> {
  const dob = parseAnyDate(runner.fechaNacimiento);
  return {
    cedula: runner.cedula || "",
    nombres: runner.nombres || "",
    apellidos: runner.apellidos || "",
    fechaNacimiento: dob ? toInputDate(dob) : "",
    email: runner.email || "",
    telefono: runner.telefono || "",
    genero: runner.genero || "",
    estado: runner.estado || "",
  };
}

// ============================================================
// Component
// ============================================================

export function RegistrationWizard({
  event,
  runner,
  categories,
}: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [waiverAccepted, setWaiverAccepted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegFormData | "waiverAccepted", string>>>({});
  const [successData, setSuccessData] = useState<{
    registrationId?: string;
    categoryName: string;
    totalUSD: number;
    totalBs: number | null;
  } | null>(null);

  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [bcvSource, setBcvSource] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState<RegFormData>({
    ...EMPTY_FORM,
    registrationType: runner ? "self" : "other",
  });

  const { toast } = useToast();

  // Prefill from runner on mount (initial load only)
  useEffect(() => {
    if (runner && formData.registrationType === "self") {
      setFormData((d) => ({ ...d, ...runnerToForm(runner) }));
    }
  }, []);

  // Fetch BCV rate on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bcv-rate", { cache: "no-store" });
        if (!res.ok) throw new Error("rate fetch failed");
        const data = await res.json();
        if (cancelled) return;
        if (typeof data.rate === "number" && !isNaN(data.rate)) {
          setBcvRate(data.rate);
          setBcvSource(data.source || null);
        } else {
          setBcvRate(null);
          setBcvSource("No disponible");
        }
      } catch {
        if (cancelled) return;
        setBcvRate(null);
        setBcvSource("No disponible");
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Handlers ──────────────────────────────────────────────

  const update = useCallback(
    <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => {
      setFormData((d) => ({ ...d, [field]: value }));
      setErrors((e) => {
        if (!e[field]) return e;
        const next = { ...e };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handleRegistrationTypeChange = (val: "self" | "other") => {
    // Reset profile fields, then set new registration type
    setFormData({ ...EMPTY_FORM, registrationType: val });
    setIsEditing(false);
    setErrors({});

    if (val === "self" && runner) {
      setFormData((d) => ({ ...d, ...runnerToForm(runner) }));
    }
  };

  // ─── Computed ──────────────────────────────────────────────

  const calculatedAge = useMemo(() => {
    if (!formData.fechaNacimiento) return null;
    const d = parseAnyDate(formData.fechaNacimiento);
    if (!d) return null;
    return calcAge(d);
  }, [formData.fechaNacimiento]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.categoryId) || null,
    [categories, formData.categoryId]
  );

  const showShirtSection = !!event.hasShirt;

  const shirtExtraUSD = useMemo(() => {
    if (!showShirtSection) return 0;
    if (!formData.shirtSize) return 0;
    if (event.hasShirtOption === "INCLUDED") return 0;
    if (event.hasShirtOption === "OPTIONAL" && event.shirtPrice) return event.shirtPrice;
    return 0;
  }, [showShirtSection, formData.shirtSize, event.hasShirtOption, event.shirtPrice]);

  const subtotalUSD = selectedCategory?.price ?? event.price;
  const totalUSD = subtotalUSD + shirtExtraUSD;
  const totalBs = bcvRate !== null ? totalUSD * bcvRate : null;

  const selectedPaymentMethod: MetodoPago | null =
    METODOS_PAGO.find((m) => m.id === formData.paymentMethod) || null;

  // Pre-compute suggested categories (age + gender match)
  const eligibleCategories = useMemo(() => {
    if (calculatedAge === null) return categories;
    return categories.filter((c) => {
      const minOk = calculatedAge >= c.minAge;
      const maxOk =
        c.maxAge === 0 || c.maxAge >= 100 || calculatedAge <= c.maxAge;
      const genderOk =
        !c.gender ||
        c.gender === "Mixto" ||
        c.gender === "MIX" ||
        c.gender === "ALL" ||
        !formData.genero ||
        c.gender === formData.genero;
      return minOk && maxOk && genderOk;
    });
  }, [categories, calculatedAge, formData.genero]);

  const participantName = useMemo(() => {
    const n = formData.nombres.trim();
    const a = formData.apellidos.trim();
    if (!n && !a) return "";
    return `${n} ${a}`.trim();
  }, [formData.nombres, formData.apellidos]);

  // ─── Validation ────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RegFormData | "waiverAccepted", string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const digitsOnly = (s: string) => s.replace(/\D/g, "");

    if (step === 1) {
      if (!formData.cedula.trim()) newErrors.cedula = "Cédula requerida";
      else if (formData.cedula.trim().length < 5) newErrors.cedula = "Mínimo 5 caracteres";
      if (!formData.nombres.trim()) newErrors.nombres = "Nombres requeridos";
      if (!formData.apellidos.trim()) newErrors.apellidos = "Apellidos requeridos";
      if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "Fecha de nacimiento requerida";
      else {
        const d = parseAnyDate(formData.fechaNacimiento);
        if (!d) newErrors.fechaNacimiento = "Fecha inválida";
        else if (calcAge(d) < 5) newErrors.fechaNacimiento = "Edad no válida para inscribirse";
        else if (calcAge(d) > 100) newErrors.fechaNacimiento = "Verifica la fecha";
      }
      if (!formData.email.trim()) newErrors.email = "Correo requerido";
      else if (!emailRegex.test(formData.email)) newErrors.email = "Correo inválido";
      if (!formData.telefono.trim()) newErrors.telefono = "Teléfono requerido";
      else if (digitsOnly(formData.telefono).length < 7)
        newErrors.telefono = "Mínimo 7 dígitos";
    }

    if (step === 2) {
      if (!formData.estado) newErrors.estado = "Selecciona un estado";
      if (!formData.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
      if (!formData.emergName.trim()) newErrors.emergName = "Nombre del contacto requerido";
      if (!formData.emergPhone.trim()) newErrors.emergPhone = "Teléfono requerido";
      else if (digitsOnly(formData.emergPhone).length < 7)
        newErrors.emergPhone = "Mínimo 7 dígitos";
      if (!formData.emergRelation) newErrors.emergRelation = "Parentesco requerido";
    }

    if (step === 3) {
      if (!formData.club) newErrors.club = "Selecciona una opción";
      if (
        formData.club === CLUB_OPCIONES_ESPECIALES[0] &&
        !formData.clubOtro.trim()
      )
        newErrors.clubOtro = "Especifica el nombre del club";
      if (!formData.categoryId) newErrors.categoryId = "Selecciona una categoría";
    }

    if (step === 4) {
      if (showShirtSection && !formData.shirtSize)
        newErrors.shirtSize = "Selecciona una talla";
      if (!formData.paymentMethod) newErrors.paymentMethod = "Selecciona un método";
      if (
        selectedPaymentMethod?.requiereReferencia &&
        !formData.paymentRef.trim()
      )
        newErrors.paymentRef = "Número de referencia requerido";
      if (
        selectedPaymentMethod?.requiereComprobante &&
        !formData.paymentProof
      )
        newErrors.paymentProof = "Sube el comprobante de pago";
      if (!waiverAccepted) newErrors.waiverAccepted = "Debes aceptar la responsabilidad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((s) => s + 1);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } else {
      toast({
        title: "Revisa los campos",
        description: "Algunos campos requeridos están incompletos o inválidos.",
        variant: "destructive",
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setErrors({});
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // ─── Submit ────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Datos incompletos",
        description: "Completa todos los campos requeridos del paso final.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const dobDate = parseAnyDate(formData.fechaNacimiento);
      const dobStr = dobDate ? toDisplayDate(dobDate) : formData.fechaNacimiento;

      // Resolve final club/team name
      let finalTeam = formData.club;
      if (formData.club === CLUB_OPCIONES_ESPECIALES[0]) {
        finalTeam = formData.clubOtro.trim();
      } else if (formData.club === CLUB_OPCIONES_ESPECIALES[1]) {
        finalTeam = "No encontró su club";
      } else if (formData.club === CLUB_OPCIONES_ESPECIALES[2]) {
        finalTeam = "Independiente";
      }

      const payload = {
        eventId: event.id,
        firstName: formData.nombres.trim(),
        lastName: formData.apellidos.trim(),
        email: formData.email.trim(),
        phone: formData.telefono.trim(),
        idNumber: formData.cedula.trim(),
        gender: formData.genero,
        dateOfBirth: dobStr,
        shirtSize: showShirtSection ? formData.shirtSize : "",
        category: selectedCategory?.name || "",
        team: finalTeam || "",
        emergencyContact: formData.emergName.trim(),
        emergencyPhone: formData.emergPhone.trim(),
        paymentMethod: formData.paymentMethod,
        paymentRef: formData.paymentRef.trim(),
        paymentProof: formData.paymentProof || "",
        waiverAccepted,
        totalAmount: totalUSD,
        bcvRate: bcvRate ?? undefined,
        totalBs: totalBs ?? undefined,
        registrationType: formData.registrationType,
      };

      const res = await fetch(
        `/api/events/${encodeURIComponent(event.slug)}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Error de inscripción",
          description:
            (result && typeof result === "object" && "error" in result && String((result as Record<string, unknown>).error)) ||
            "No se pudo procesar la inscripción.",
          variant: "destructive",
        });
        return;
      }

      const regId =
        (result && typeof result === "object" && (
          (result as Record<string, unknown>).id ||
          (result as Record<string, unknown>).registrationId
        )) || undefined;

      setSuccessData({
        registrationId: regId ? String(regId) : undefined,
        categoryName: selectedCategory?.name || "",
        totalUSD,
        totalBs,
      });

      toast({
        title: "¡Inscripción enviada!",
        description: "Tu solicitud está pendiente de aprobación.",
      });
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar la inscripción. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────

  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-xl"
        >
          <Card className="border-red-200 p-0 shadow-xl">
            <div className="gradient-primary rounded-t-xl px-6 py-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring" }}
                className="mx-auto flex size-20 items-center justify-center rounded-full bg-white/20 backdrop-blur"
              >
                <PartyPopper className="size-10" />
              </motion.div>
              <h2 className="mt-4 text-2xl font-bold">¡Inscripción Registrada!</h2>
              <p className="mt-1 text-sm text-white/90">
                Tu solicitud está pendiente de aprobación
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="rounded-xl bg-gray-50 p-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Evento</span>
                    <span className="font-semibold text-gray-900">
                      {event.title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Participante</span>
                    <span className="font-semibold text-gray-900">
                      {participantName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cédula</span>
                    <span className="font-semibold text-gray-900">
                      {formData.cedula}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Categoría</span>
                    <span className="font-semibold text-gray-900">
                      {successData.categoryName || "—"}
                    </span>
                  </div>
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total USD</span>
                    <span className="font-bold text-red-600">
                      ${successData.totalUSD.toFixed(2)}
                    </span>
                  </div>
                  {successData.totalBs !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Bs</span>
                      <span className="font-bold text-gray-900">
                        Bs.{" "}
                        {successData.totalBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  {successData.registrationId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">ID</span>
                      <span className="font-mono text-gray-600">
                        {successData.registrationId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Estado</span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      PENDIENTE
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Recibirás confirmación por correo electrónico una vez aprobada tu
                inscripción.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href={`/eventos/${event.slug}`}>
                  <Button variant="outline" className="w-full gap-2 sm:w-auto">
                    <ArrowLeft className="size-4" /> Volver al evento
                  </Button>
                </Link>
                <Link href="/#eventos">
                  <Button className="gradient-primary w-full gap-2 text-white sm:w-auto">
                    <Trophy className="size-4" /> Ver otros eventos
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-primary text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href={`/eventos/${event.slug}`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ChevronLeft className="size-4" /> Volver al evento
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{event.title}</h1>
              <p className="mt-1 text-sm text-white/85">
                Formulario de inscripción
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {event.date
                  ? new Date(event.date).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Por confirmar"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {event.location || "Por confirmar"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <main className="lg:col-span-2">
            <Card className="p-0">
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon;
                    return <Icon className="size-5" />;
                  })()}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
                    Paso {currentStep} de {TOTAL_STEPS}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {STEPS[currentStep - 1].label}
                  </h2>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {currentStep === 1 &&
                      renderStep1({
                        formData,
                        runner,
                        isEditing,
                        calculatedAge,
                        errors,
                        update,
                        setIsEditing,
                        handleRegistrationTypeChange,
                      })}
                    {currentStep === 2 &&
                      renderStep2({ formData, errors, update })}
                    {currentStep === 3 &&
                      renderStep3({
                        formData,
                        errors,
                        update,
                        categories,
                        eligibleCategories,
                        calculatedAge,
                      })}
                    {currentStep === 4 &&
                      renderStep4({
                        formData,
                        errors,
                        update,
                        event,
                        showShirtSection,
                        bcvRate,
                        bcvSource,
                        rateLoading,
                        totalUSD,
                        totalBs,
                        selectedPaymentMethod,
                        waiverAccepted,
                        setWaiverAccepted,
                      })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="size-4" /> Anterior
                </Button>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {STEPS.map((s) => (
                    <span
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all ${
                        s.id === currentStep
                          ? "w-6 bg-red-500"
                          : s.id < currentStep
                          ? "w-3 bg-red-300"
                          : "w-3 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {currentStep < TOTAL_STEPS ? (
                  <Button
                    onClick={handleNext}
                    className="gradient-primary gap-2 text-white hover:opacity-95"
                  >
                    Siguiente <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gradient-primary gap-2 text-white hover:opacity-95"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Procesando…
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> Finalizar Inscripción
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </main>

          <aside className="lg:col-span-1">
            <OrderSummary
              eventName={event.title}
              eventDate={event.date}
              eventLocation={event.location}
              sportType={event.sportType}
              participantName={participantName}
              categoryName={selectedCategory?.name ?? null}
              shirtSize={formData.shirtSize || null}
              subtotalUSD={subtotalUSD}
              shirtExtraUSD={shirtExtraUSD}
              totalUSD={totalUSD}
              bcvRate={bcvRate}
              bcvRateSource={bcvSource}
              totalBs={totalBs}
              paymentMethodLabel={selectedPaymentMethod?.label ?? null}
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step indicator
// ============================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;
          return (
            <div
              key={step.id}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      step.id <= currentStep ? "bg-red-500" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                    isDone
                      ? "bg-red-500 text-white"
                      : isActive
                      ? "gradient-primary text-white ring-4 ring-red-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      step.id < currentStep ? "bg-red-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-1.5 hidden text-[10px] leading-tight sm:block ${
                  isActive ? "font-semibold text-red-700" : "text-gray-400"
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Field error helper
// ============================================================

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  );
}

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

// ============================================================
// Step 1: Perfil del Participante
// ============================================================

interface Step1Props {
  formData: RegFormData;
  runner: RegRunner | null | undefined;
  isEditing: boolean;
  calculatedAge: number | null;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  setIsEditing: (v: boolean) => void;
  handleRegistrationTypeChange: (val: "self" | "other") => void;
}

function renderStep1({
  formData,
  runner,
  isEditing,
  calculatedAge,
  errors,
  update,
  setIsEditing,
  handleRegistrationTypeChange,
}: Step1Props) {
  const selfMode = formData.registrationType === "self";
  const fieldsDisabled = selfMode && !isEditing;

  return (
    <div className="space-y-6">
      {/* Registration type */}
      <div>
        <Label className="mb-2 block text-sm font-semibold text-gray-700">
          ¿Para quién es esta inscripción?
        </Label>
        <RadioGroup
          value={formData.registrationType}
          onValueChange={(v) => handleRegistrationTypeChange(v as "self" | "other")}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label
            htmlFor="reg-self"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
              selfMode
                ? "border-red-500 bg-red-50/60 ring-2 ring-red-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <RadioGroupItem value="self" id="reg-self" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="size-4 text-red-600" />
                <span className="font-semibold text-gray-900">Para mí</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Cargaré automáticamente los datos de tu perfil.
              </p>
            </div>
          </label>

          <label
            htmlFor="reg-other"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
              !selfMode
                ? "border-red-500 bg-red-50/60 ring-2 ring-red-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <RadioGroupItem value="other" id="reg-other" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-red-600" />
                <span className="font-semibold text-gray-900">
                  Para otra persona
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Completa manualmente los datos del participante.
              </p>
            </div>
          </label>
        </RadioGroup>

        {selfMode && runner && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5" />
              {isEditing
                ? "Estás editando los datos de tu perfil para esta inscripción."
                : "Datos cargados desde tu perfil. Puedes editarlos si lo deseas."}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                isEditing
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-white text-red-600 hover:bg-red-50"
              }`}
            >
              {isEditing ? (
                <>
                  <X className="size-3" /> Cancelar
                </>
              ) : (
                <>
                  <Pencil className="size-3" /> Editar perfil
                </>
              )}
            </button>
          </div>
        )}

        {selfMode && !runner && (
          <p className="mt-3 flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <Info className="size-3.5" />
            No se encontró un perfil de corredor. Completa los datos manualmente.
          </p>
        )}
      </div>

      <Separator />

      {/* Personal fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cedula" className="mb-1.5 block">
            <Hash className="size-3.5" /> Cédula de identidad
            <RequiredMark />
          </Label>
          <Input
            id="cedula"
            value={formData.cedula}
            onChange={(e) => update("cedula", e.target.value)}
            placeholder="V-12345678"
            disabled={fieldsDisabled}
            aria-invalid={!!errors.cedula}
          />
          <FieldError message={errors.cedula} />
        </div>

        <div>
          <Label htmlFor="genero" className="mb-1.5 block">
            <User className="size-3.5" /> Género
            <RequiredMark />
          </Label>
          <Select
            value={formData.genero}
            onValueChange={(v) => update("genero", v)}
            disabled={fieldsDisabled}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.genero}>
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.genero} />
        </div>

        <div>
          <Label htmlFor="nombres" className="mb-1.5 block">
            <User className="size-3.5" /> Nombres
            <RequiredMark />
          </Label>
          <Input
            id="nombres"
            value={formData.nombres}
            onChange={(e) => update("nombres", e.target.value)}
            placeholder="Nombres"
            disabled={fieldsDisabled}
            aria-invalid={!!errors.nombres}
          />
          <FieldError message={errors.nombres} />
        </div>

        <div>
          <Label htmlFor="apellidos" className="mb-1.5 block">
            <User className="size-3.5" /> Apellidos
            <RequiredMark />
          </Label>
          <Input
            id="apellidos"
            value={formData.apellidos}
            onChange={(e) => update("apellidos", e.target.value)}
            placeholder="Apellidos"
            disabled={fieldsDisabled}
            aria-invalid={!!errors.apellidos}
          />
          <FieldError message={errors.apellidos} />
        </div>

        <div>
          <Label htmlFor="fechaNacimiento" className="mb-1.5 block">
            <Calendar className="size-3.5" /> Fecha de nacimiento
            <RequiredMark />
          </Label>
          <Input
            id="fechaNacimiento"
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => update("fechaNacimiento", e.target.value)}
            disabled={fieldsDisabled}
            aria-invalid={!!errors.fechaNacimiento}
          />
          <FieldError message={errors.fechaNacimiento} />
        </div>

        <div>
          <Label className="mb-1.5 block">
            <Trophy className="size-3.5" /> Edad calculada
          </Label>
          <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm">
            {calculatedAge !== null ? (
              <span className="font-semibold text-gray-800">
                {calculatedAge} años
              </span>
            ) : (
              <span className="text-gray-400">
                Se calculará al ingresar la fecha
              </span>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="mb-1.5 block">
            <Mail className="size-3.5" /> Correo electrónico
            <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="correo@ejemplo.com"
            disabled={fieldsDisabled}
            aria-invalid={!!errors.email}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <Label htmlFor="telefono" className="mb-1.5 block">
            <Phone className="size-3.5" /> Teléfono
            <RequiredMark />
          </Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => update("telefono", e.target.value)}
            placeholder="0412-1234567"
            disabled={fieldsDisabled}
            aria-invalid={!!errors.telefono}
          />
          <FieldError message={errors.telefono} />
        </div>
      </div>

      {fieldsDisabled && (
        <p className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-500">
          <Lock className="size-3.5" />
          Los campos están bloqueados. Pulsa “Editar perfil” para modificarlos.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Step 2: Datos Geográficos y Contacto
// ============================================================

interface Step2Props {
  formData: RegFormData;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
}

function renderStep2({ formData, errors, update }: Step2Props) {
  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="estado" className="mb-1.5 block">
            <MapPin className="size-3.5" /> Estado
            <RequiredMark />
          </Label>
          <Select
            value={formData.estado}
            onValueChange={(v) => update("estado", v)}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.estado}>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto">
              {ESTADOS_VENEZUELA.map((e) => (
                <SelectItem key={e.iso} value={e.nombre}>
                  {e.nombre}
                  <span className="ml-1 text-xs text-gray-400">
                    — {e.capital}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.estado} />
        </div>

        <div>
          <Label htmlFor="ciudad" className="mb-1.5 block">
            <Building2 className="size-3.5" /> Ciudad
            <RequiredMark />
          </Label>
          <Input
            id="ciudad"
            value={formData.ciudad}
            onChange={(e) => update("ciudad", e.target.value)}
            placeholder="Ej. Maracay"
            aria-invalid={!!errors.ciudad}
          />
          <FieldError message={errors.ciudad} />
        </div>
      </div>

      <Separator />

      {/* Emergency contact */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Heart className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Contacto de emergencia
            </h3>
            <p className="text-xs text-gray-500">
              Persona a notificar en caso de incidente durante el evento.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="emergName" className="mb-1.5 block">
              <User className="size-3.5" /> Nombre completo
              <RequiredMark />
            </Label>
            <Input
              id="emergName"
              value={formData.emergName}
              onChange={(e) => update("emergName", e.target.value)}
              placeholder="Nombre y apellido del contacto"
              aria-invalid={!!errors.emergName}
            />
            <FieldError message={errors.emergName} />
          </div>

          <div>
            <Label htmlFor="emergPhone" className="mb-1.5 block">
              <Phone className="size-3.5" /> Teléfono
              <RequiredMark />
            </Label>
            <Input
              id="emergPhone"
              value={formData.emergPhone}
              onChange={(e) => update("emergPhone", e.target.value)}
              placeholder="0414-1234567"
              aria-invalid={!!errors.emergPhone}
            />
            <FieldError message={errors.emergPhone} />
          </div>

          <div>
            <Label htmlFor="emergRelation" className="mb-1.5 block">
              <Users className="size-3.5" /> Parentesco
              <RequiredMark />
            </Label>
            <Select
              value={formData.emergRelation}
              onValueChange={(v) => update("emergRelation", v)}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.emergRelation}
              >
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {PARENTESCOS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.emergRelation} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Club y Categoría
// ============================================================

interface Step3Props {
  formData: RegFormData;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  categories: RegCategory[];
  eligibleCategories: RegCategory[];
  calculatedAge: number | null;
}

function renderStep3({
  formData,
  errors,
  update,
  categories,
  eligibleCategories,
  calculatedAge,
}: Step3Props) {
  const showClubOtro = formData.club === CLUB_OPCIONES_ESPECIALES[0];

  return (
    <div className="space-y-6">
      {/* Club */}
      <div>
        <Label htmlFor="club" className="mb-1.5 block">
          <Users className="size-3.5" /> Club o Team
          <RequiredMark />
        </Label>
        <Select
          value={formData.club}
          onValueChange={(v) => update("club", v)}
        >
          <SelectTrigger className="w-full" aria-invalid={!!errors.club}>
            <SelectValue placeholder="Selecciona tu club o team" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
              Opciones especiales
            </SelectLabel>
            {CLUB_OPCIONES_ESPECIALES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
              Ciclismo
            </SelectLabel>
            {CLUBES_VENEZUELA.filter((c) => c.tipo === "ciclismo").map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
              Atletismo
            </SelectLabel>
            {CLUBES_VENEZUELA.filter((c) => c.tipo === "atletismo").map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
              Multi-deporte
            </SelectLabel>
            {CLUBES_VENEZUELA.filter((c) => c.tipo === "multi").map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.club} />

        {showClubOtro && (
          <div className="mt-3">
            <Label htmlFor="clubOtro" className="mb-1.5 block">
              <Pencil className="size-3.5" /> Especifica el nombre del club
              <RequiredMark />
            </Label>
            <Input
              id="clubOtro"
              value={formData.clubOtro}
              onChange={(e) => update("clubOtro", e.target.value)}
              placeholder="Nombre del club o team"
              aria-invalid={!!errors.clubOtro}
            />
            <FieldError message={errors.clubOtro} />
          </div>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Trophy className="size-4 text-red-600" /> Categorías disponibles
            </h3>
            <p className="text-xs text-gray-500">
              {calculatedAge !== null
                ? `Tu edad: ${calculatedAge} años — categorías sugeridas resaltadas.`
                : "Selecciona la categoría que corresponda."}
            </p>
          </div>
          {categories.length > 0 && (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
              {categories.length} total
            </Badge>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
            <AlertCircle className="mx-auto size-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              No hay categorías definidas para este evento.
            </p>
            <p className="text-xs text-gray-400">
              Contacta al organizador para más información.
            </p>
          </div>
        ) : (
          <RadioGroup
            value={formData.categoryId}
            onValueChange={(v) => update("categoryId", v)}
            className="max-h-96 space-y-2 overflow-y-auto pr-1"
          >
            {categories.map((c) => {
              const isEligible = eligibleCategories.some((e) => e.id === c.id);
              const isSelected = formData.categoryId === c.id;
              return (
                <label
                  key={c.id}
                  htmlFor={`cat-${c.id}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-red-500 bg-red-50/60 ring-2 ring-red-100"
                      : isEligible
                      ? "border-gray-200 bg-white hover:border-red-300"
                      : "border-gray-100 bg-gray-50/60 opacity-70 hover:border-gray-200"
                  }`}
                >
                  <RadioGroupItem
                    value={c.id}
                    id={`cat-${c.id}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {c.name}
                      </span>
                      {isEligible && (
                        <Badge className="bg-green-100 text-[10px] text-green-700 hover:bg-green-100">
                          Sugerida
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {c.gender || "Mixto"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {c.minAge}
                        {c.maxAge && c.maxAge < 100 ? `–${c.maxAge}` : "+"} años
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      ${c.price.toFixed(2)}
                    </p>
                    <p className="text-[10px] uppercase text-gray-400">USD</p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        )}
        <FieldError message={errors.categoryId} />
      </div>
    </div>
  );
}

// ============================================================
// Step 4: Kit y Pago
// ============================================================

interface Step4Props {
  formData: RegFormData;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  event: RegEvent;
  showShirtSection: boolean;
  bcvRate: number | null;
  bcvSource: string | null;
  rateLoading: boolean;
  totalUSD: number;
  totalBs: number | null;
  selectedPaymentMethod: MetodoPago | null;
  waiverAccepted: boolean;
  setWaiverAccepted: (v: boolean) => void;
}

function renderStep4({
  formData,
  errors,
  update,
  event,
  showShirtSection,
  bcvRate,
  bcvSource,
  rateLoading,
  totalUSD,
  totalBs,
  selectedPaymentMethod,
  waiverAccepted,
  setWaiverAccepted,
}: Step4Props) {
  return (
    <div className="space-y-6">
      {/* Shirt */}
      {showShirtSection && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Shirt className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Talla de franela
              </h3>
              <p className="text-xs text-gray-500">
                {event.hasShirtOption === "INCLUDED"
                  ? "Incluida en el kit del evento."
                  : event.hasShirtOption === "OPTIONAL"
                  ? `Opcional — costo adicional $${(event.shirtPrice ?? 0).toFixed(2)} USD.`
                  : "Selecciona tu talla."}
              </p>
            </div>
          </div>

          <RadioGroup
            value={formData.shirtSize}
            onValueChange={(v) => update("shirtSize", v)}
            className="grid grid-cols-3 gap-2 sm:grid-cols-6"
          >
            {TALLAS_FRANELA.map((t) => {
              const isSelected = formData.shirtSize === t.value;
              return (
                <label
                  key={t.value}
                  htmlFor={`shirt-${t.value}`}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center transition-all ${
                    isSelected
                      ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem
                    value={t.value}
                    id={`shirt-${t.value}`}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-gray-900">
                    {t.value}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {t.label.split("—")[1]?.trim()}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
          <FieldError message={errors.shirtSize} />
        </div>
      )}

      <Separator />

      {/* Payment methods */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <CreditCard className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Método de pago
            </h3>
            <p className="text-xs text-gray-500">
              Elige cómo vas a pagar la inscripción.
            </p>
          </div>
        </div>

        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(v) => update("paymentMethod", v)}
          className="grid gap-3 sm:grid-cols-2"
        >
          {METODOS_PAGO.map((m) => {
            const Icon = PAYMENT_ICONS[m.id] || CreditCard;
            const isSelected = formData.paymentMethod === m.id;
            return (
              <label
                key={m.id}
                htmlFor={`pay-${m.id}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-red-500 bg-red-50/60 ring-2 ring-red-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <RadioGroupItem
                  value={m.id}
                  id={`pay-${m.id}`}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-red-600" />
                    <span className="font-semibold text-gray-900">
                      {m.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-auto border-gray-200 bg-gray-50 text-[10px] text-gray-600"
                    >
                      {m.moneda}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {m.descripcion}
                  </p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
        <FieldError message={errors.paymentMethod} />
      </div>

      {/* Reference + proof (only when a method is selected) */}
      {selectedPaymentMethod && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4"
        >
          {selectedPaymentMethod.requiereReferencia && (
            <div>
              <Label htmlFor="paymentRef" className="mb-1.5 block">
                <Hash className="size-3.5" /> Número de referencia
                <RequiredMark />
              </Label>
              <Input
                id="paymentRef"
                value={formData.paymentRef}
                onChange={(e) => update("paymentRef", e.target.value)}
                placeholder="Ej. 0012345"
                aria-invalid={!!errors.paymentRef}
              />
              <FieldError message={errors.paymentRef} />
            </div>
          )}

          {selectedPaymentMethod.requiereComprobante && (
            <div>
              <Label className="mb-1.5 block">
                <FileCheckIcon /> Comprobante de pago
                <RequiredMark />
              </Label>
              <FileUpload
                value={formData.paymentProof}
                onChange={(b64) => update("paymentProof", b64)}
                accept="image/*,.pdf"
                maxSize={5}
                label="Arrastra o haz clic para subir el comprobante"
                hint="Captura o PDF del comprobante (máx 5MB)"
              />
              <FieldError message={errors.paymentProof} />
            </div>
          )}

          {!selectedPaymentMethod.requiereReferencia &&
            !selectedPaymentMethod.requiereComprobante && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Info className="size-3.5" />
                Este método no requiere referencia ni comprobante adicional.
              </p>
            )}
        </motion.div>
      )}

      <Separator />

      {/* BCV conversion */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-amber-700" />
          <h3 className="text-sm font-bold text-amber-900">
            Conversión BCV (USD → Bs)
          </h3>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-700">
              Total USD
            </p>
            <p className="text-lg font-bold text-gray-900">
              ${totalUSD.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-700">
              Tasa BCV
            </p>
            {rateLoading ? (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <Loader2 className="size-3.5 animate-spin" /> Cargando…
              </p>
            ) : bcvRate !== null ? (
              <p className="text-lg font-bold text-gray-900">
                Bs.{" "}
                {bcvRate.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">No disponible</p>
            )}
            {bcvSource && (
              <p className="text-[10px] text-amber-700/70">{bcvSource}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-700">
              Total Bs
            </p>
            {totalBs !== null ? (
              <p className="text-lg font-bold text-gray-900">
                Bs.{" "}
                {totalBs.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Waiver */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="waiver"
            checked={waiverAccepted}
            onCheckedChange={(v) => setWaiverAccepted(v === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor="waiver"
              className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-gray-800"
            >
              <ShieldCheck className="size-4 text-red-600" />
              Acepto la liberación de responsabilidad
              <RequiredMark />
            </Label>
            <p className="mt-1 text-xs text-gray-500">
              Declaro que participo voluntariamente, asumo los riesgos asociados
              al evento y eximo a los organizadores de toda responsabilidad
              derivada de mi participación.
            </p>
          </div>
        </div>
        <FieldError message={errors.waiverAccepted} />
      </div>
    </div>
  );
}

// Small helper component used inside Step 4 for the file-check label
function FileCheckIcon() {
  return (
    <span className="inline-flex size-3.5 items-center justify-center">
      <Check className="size-3" />
    </span>
  );
}

export default RegistrationWizard;
