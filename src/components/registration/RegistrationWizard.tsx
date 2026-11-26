"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  SelectGroup,
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
import {
  accountLabel,
  accountLines,
  parsePaymentAccounts,
  type PaymentAccount,
} from "@/lib/payment-accounts";
import { useToast } from "@/hooks/use-toast";
import { formatEventDateLong } from "@/lib/date-utils";
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
  Lock,
  Smartphone,
  Wallet,
  Banknote,
  Hash,
  Building2,
  ShieldCheck,
  Heart,
  PartyPopper,
  Calendar,
  Trophy,
  Phone,
  Mail,
  Printer,
  UserCheck,
  KeyRound,
  Landmark,
  Coins,
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
  /** JSON string de cuentas de destino de pago (Pago Móvil, Zelle, Binance…) */
  paymentAccounts?: string | PaymentAccount[];
}

interface RegCategory {
  id: string;
  name: string;
  gender: string;
  minAge: number;
  maxAge: number;
  price: number;
}

/** Perfil del atleta devuelto por /api/runners/lookup */
interface RunnerProfile {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  ciudad: string | null;
  team: string | null;
  tallaFranela: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
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
  categories: RegCategory[];
  /**
   * Perfil del atleta con sesión iniciada (de /api/auth/me). Si viene,
   * el formulario nace auto-completado con la ficha vinculada por cédula:
   * el corredor entra al wizard con sus datos ya cargados, sin rellenar
   * nada. Puede vaciar el formulario con "Inscribir a un tercero".
   */
  sessionRunner?: RunnerProfile | null;
}

// ============================================================
// Constants
// ============================================================

/** Flujo Hipereventos: 3 pasos claros y secuenciales */
const STEPS: { id: number; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 1, label: "Datos del Corredor", shortLabel: "Datos", icon: User },
  { id: 2, label: "Categoría y Talla", shortLabel: "Categoría", icon: Trophy },
  { id: 3, label: "Pago", shortLabel: "Pago", icon: CreditCard },
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
  binance: Coins,
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

/** Comprobante completo que muestra la pantalla de éxito */
interface ReceiptData {
  registrationId?: string;
  categoryName: string;
  categoryPrice: number;
  shirtSize: string;
  shirtExtraUSD: number;
  totalUSD: number;
  totalBs: number | null;
  bcvRate: number | null;
  paymentMethodLabel: string;
  paymentRef: string;
  email: string;
  telefono: string;
  fechaNacimiento: string; // DD/MM/YYYY
  edad: number | null;
  genero: string;
  estado: string;
  ciudad: string;
  club: string;
  emergName: string;
  emergPhone: string;
  emergRelation: string;
}

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

/** ISO / cualquier fecha → YYYY-MM-DD sin corrimientos de zona horaria */
function isoToInputDate(iso: string): string {
  if (!iso) return "";
  // Slice directo evita el off-by-one de new Date("...") en UTC-4
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = parseAnyDate(iso);
  return d ? toInputDate(d) : "";
}

/** team del Runner → valores del Select de club del wizard */
function mapClubToForm(team: string): { club: string; clubOtro: string } {
  if (!team) return { club: "", clubOtro: "" };
  if (CLUB_OPCIONES_ESPECIALES.some((c) => c === team))
    return { club: team, clubOtro: "" };
  if (CLUBES_VENEZUELA.some((c) => c.nombre === team)) return { club: team, clubOtro: "" };
  return { club: CLUB_OPCIONES_ESPECIALES[0], clubOtro: team };
}

/** Perfil guardado del atleta → campos del formulario (editable siempre) */
function runnerLookupToForm(runner: RunnerProfile): Partial<RegFormData> {
  const clubMap = mapClubToForm(runner.team || "");
  return {
    nombres: runner.nombres || "",
    apellidos: runner.apellidos || "",
    fechaNacimiento: isoToInputDate(runner.fechaNacimiento || ""),
    email: runner.email || "",
    telefono: runner.telefono || "",
    genero:
      runner.genero === "F" ? "F" : runner.genero === "M" ? "M" : "",
    estado: ESTADOS_VENEZUELA.some((e) => e.nombre === runner.estado)
      ? runner.estado || ""
      : "",
    ciudad: runner.ciudad || "",
    emergName: runner.contactoEmergenciaNombre || "",
    emergPhone: runner.contactoEmergenciaTelefono || "",
    emergRelation: PARENTESCOS.some(
      (p) => p === runner.contactoEmergenciaParentesco
    )
      ? runner.contactoEmergenciaParentesco || ""
      : "",
    club: clubMap.club,
    clubOtro: clubMap.clubOtro,
    shirtSize:
      runner.tallaFranela &&
      TALLAS_FRANELA.some((t) => t.value === runner.tallaFranela)
        ? runner.tallaFranela
        : "",
  };
}

// ============================================================
// Component
// ============================================================

export function RegistrationWizard({
  event,
  categories,
  sessionRunner,
}: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [waiverAccepted, setWaiverAccepted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegFormData | "waiverAccepted", string>>>({});
  const [successData, setSuccessData] = useState<ReceiptData | null>(null);

  // Datos guardados del atleta (tabla Runner): se cargan al escribir la cédula
  const [lookupInfo, setLookupInfo] = useState<{ nombre: string } | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookupCedula = useRef<string>("");

  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [bcvSource, setBcvSource] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState<RegFormData>({
    ...EMPTY_FORM,
  });

  const { toast } = useToast();

  // ─── Prellenado con la sesión (Mi Perfil → Runner vinculado) ───
  // Si el usuario llegó con sesión y su cuenta tiene Runner vinculado por
  // cédula, el formulario abre con su ficha completa y el aviso verde de
  // "datos cargados" — la misma experiencia del lookup, pero instantánea.
  useEffect(() => {
    if (!sessionRunner || !sessionRunner.cedula) return;
    setFormData((d) => ({
      ...d,
      ...runnerLookupToForm(sessionRunner),
    }));
    setLookupInfo({
      nombre: `${sessionRunner.nombres} ${sessionRunner.apellidos}`.trim(),
    });
    lastLookupCedula.current = sessionRunner.cedula.toUpperCase();
    // Intencional: solo al montar el wizard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuentas de destino de pago configuradas por el organizador (Paso 3)
  const paymentAccounts = useMemo<PaymentAccount[]>(
    () => parsePaymentAccounts(event.paymentAccounts),
    [event.paymentAccounts]
  );

  // Fetch BCV rate on mount — se obtiene UNA sola vez: el monto y la tasa
  // quedan congelados para toda la inscripción (Paso 3 los muestra fijos).
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
    // Reset perfil y estado de búsqueda al cambiar el tipo de inscripción
    setFormData({ ...EMPTY_FORM, registrationType: val });
    setErrors({});
    setLookupInfo(null);
    lastLookupCedula.current = "";
  };

  /** Cédula: guarda el valor y busca el perfil guardado del atleta (debounce) */
  const handleCedulaChange = (value: string) => {
    update("cedula", value);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 4) {
      setLookupInfo(null);
      return;
    }
    lookupTimer.current = setTimeout(async () => {
      const key = trimmed.toUpperCase();
      if (key === lastLookupCedula.current) return;
      lastLookupCedula.current = key;
      try {
        const res = await fetch(
          `/api/runners/lookup?cedula=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.found && data.runner) {
          setFormData((d) => ({ ...d, ...runnerLookupToForm(data.runner) }));
          setLookupInfo({
            nombre: `${data.runner.nombres} ${data.runner.apellidos}`.trim(),
          });
        } else {
          setLookupInfo(null);
        }
      } catch {
        // La búsqueda es una mejora: si falla continúa el flujo manual
      }
    }, 600);
  };

  // ─── Computed ──────────────────────────────────────────────

  const calculatedAge = useMemo(() => {
    if (!formData.fechaNacimiento) return null;
    const d = parseAnyDate(formData.fechaNacimiento);
    if (!d) return null;
    return calcAge(d);
  }, [formData.fechaNacimiento]);

  // Diagnóstico EN VIVO de la fecha de nacimiento: se muestra al instante
  // bajo el campo (sin esperar al botón "Siguiente") para que el atleta
  // nunca vea una edad absurda (p. ej. "-1 años") sin explicación. Esto
  // ocurre cuando el año se escribe mal (p. ej. "27" → 2027 en el input).
  const birthDateIssue = useMemo(() => {
    if (!formData.fechaNacimiento) return null;
    const d = parseAnyDate(formData.fechaNacimiento);
    if (!d) return "Fecha inválida — selecciona día, mes y año";
    const age = calcAge(d);
    if (age < 0) return "La fecha no puede ser futura — verifica el año";
    if (age < 5) return "Edad mínima para inscribirse: 5 años";
    if (age > 100) return "Verifica el año — la edad supera 100 años";
    return null;
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

  // Cuentas que coinciden con el método seleccionado (o todas si aún no elige)
  const visibleAccounts = useMemo(() => {
    if (!selectedPaymentMethod) return paymentAccounts;
    const matches = paymentAccounts.filter(
      (a) => a.method === selectedPaymentMethod.id
    );
    return matches.length > 0 ? matches : paymentAccounts;
  }, [paymentAccounts, selectedPaymentMethod]);

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

  // ─── Categoría: asignación automática y bloqueada ────────────────
  // Al cambiar la fecha de nacimiento o el género, el sistema recalcula y
  // reasigna solo la categoría que corresponde. El atleta NO la elige.
  useEffect(() => {
    if (!calculatedAge || !formData.genero) return;
    if (eligibleCategories.length === 0) return;
    // Preferir género exacto y el rango de edad más estrecho que contenga la edad
    const exactGender = eligibleCategories.filter(
      (c) => c.gender === formData.genero
    );
    const pool = exactGender.length > 0 ? exactGender : eligibleCategories;
    const best = [...pool].sort(
      (a, b) => a.maxAge - a.minAge - (b.maxAge - b.minAge)
    )[0];
    if (best && best.id !== formData.categoryId) {
      update("categoryId", best.id);
    }
  }, [calculatedAge, formData.genero, formData.categoryId, eligibleCategories, update]);

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
      // Datos del corredor: identidad + contacto + ubicación + emergencia
      if (!formData.cedula.trim()) newErrors.cedula = "Cédula requerida";
      else if (formData.cedula.trim().length < 5) newErrors.cedula = "Mínimo 5 caracteres";
      if (!formData.nombres.trim()) newErrors.nombres = "Nombres requeridos";
      if (!formData.apellidos.trim()) newErrors.apellidos = "Apellidos requeridos";
      if (!formData.fechaNacimiento)
        newErrors.fechaNacimiento = "Fecha de nacimiento requerida";
      else if (birthDateIssue) newErrors.fechaNacimiento = birthDateIssue;
      if (!formData.genero) newErrors.genero = "Selecciona el género";
      if (!formData.email.trim()) newErrors.email = "Correo requerido";
      else if (!emailRegex.test(formData.email)) newErrors.email = "Correo inválido";
      if (!formData.telefono.trim()) newErrors.telefono = "Teléfono requerido";
      else if (digitsOnly(formData.telefono).length < 7)
        newErrors.telefono = "Mínimo 7 dígitos";
      if (!formData.estado) newErrors.estado = "Selecciona un estado";
      if (!formData.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
      if (!formData.emergName.trim()) newErrors.emergName = "Nombre del contacto requerido";
      if (!formData.emergPhone.trim()) newErrors.emergPhone = "Teléfono requerido";
      else if (digitsOnly(formData.emergPhone).length < 7)
        newErrors.emergPhone = "Mínimo 7 dígitos";
      if (!formData.emergRelation) newErrors.emergRelation = "Parentesco requerido";
    }

    if (step === 2) {
      if (!formData.club) newErrors.club = "Selecciona una opción";
      if (
        formData.club === CLUB_OPCIONES_ESPECIALES[0] &&
        !formData.clubOtro.trim()
      )
        newErrors.clubOtro = "Especifica el nombre del club";
      if (!formData.categoryId)
        newErrors.categoryId =
          "No se pudo asignar una categoría automáticamente — verifica tu fecha de nacimiento y género";
      if (showShirtSection && !formData.shirtSize)
        newErrors.shirtSize = "Selecciona una talla";
    }

    if (step === 3) {
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
    if (!validateStep(3)) {
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
        emergRelation: formData.emergRelation,
        estado: formData.estado,
        ciudad: formData.ciudad.trim(),
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
        categoryPrice: selectedCategory?.price ?? event.price,
        shirtSize: showShirtSection ? formData.shirtSize : "",
        shirtExtraUSD,
        totalUSD,
        totalBs,
        bcvRate,
        paymentMethodLabel: selectedPaymentMethod?.label || formData.paymentMethod,
        paymentRef: formData.paymentRef.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        fechaNacimiento: dobStr,
        edad: calculatedAge,
        genero: formData.genero,
        estado: formData.estado,
        ciudad: formData.ciudad.trim(),
        club: finalTeam || "",
        emergName: formData.emergName.trim(),
        emergPhone: formData.emergPhone.trim(),
        emergRelation: formData.emergRelation,
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
              {/* ── Datos del evento ── */}
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Datos del evento
                </p>
                <div className="space-y-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Evento</span>
                    <span className="text-right font-semibold text-gray-900">
                      {event.title}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Fecha</span>
                    <span className="text-right font-semibold text-gray-900">
                      {event.date ? formatEventDateLong(event.date) : "Por confirmar"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Lugar</span>
                    <span className="text-right font-semibold text-gray-900">
                      {event.location || "Por confirmar"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Datos del participante ── */}
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Datos del participante
                </p>
                <div className="space-y-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Nombre</span>
                    <span className="text-right font-semibold text-gray-900">
                      {participantName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Cédula</span>
                    <span className="font-semibold text-gray-900">
                      {formData.cedula}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">F. de nacimiento</span>
                    <span className="font-semibold text-gray-900">
                      {successData.fechaNacimiento}
                      {successData.edad !== null
                        ? ` (${successData.edad} años)`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Género</span>
                    <span className="font-semibold text-gray-900">
                      {successData.genero === "F"
                        ? "Femenino"
                        : successData.genero === "M"
                        ? "Masculino"
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Correo</span>
                    <span className="text-right font-semibold break-all text-gray-900">
                      {successData.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Teléfono</span>
                    <span className="font-semibold text-gray-900">
                      {successData.telefono || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Lugar de residencia</span>
                    <span className="text-right font-semibold text-gray-900">
                      {[successData.ciudad, successData.estado]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Club / Team</span>
                    <span className="text-right font-semibold text-gray-900">
                      {successData.club || "Independiente"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Contacto de emergencia</span>
                    <span className="text-right font-semibold text-gray-900">
                      {successData.emergName
                        ? `${successData.emergName} (${successData.emergPhone})${
                            successData.emergRelation
                              ? ` — ${successData.emergRelation}`
                              : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Inscripción ── */}
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Detalle de la inscripción
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Categoría</span>
                    <Badge className="bg-red-50 text-red-700 hover:bg-red-50">
                      {successData.categoryName || "—"}
                    </Badge>
                  </div>
                  {successData.shirtSize && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="shrink-0 text-gray-500">Talla de franela</span>
                      <Badge variant="secondary" className="text-xs">
                        <Shirt className="mr-1 size-3" /> {successData.shirtSize}
                        {event.hasShirtOption === "OPTIONAL" &&
                        successData.shirtExtraUSD > 0
                          ? ` (+$${successData.shirtExtraUSD.toFixed(2)})`
                          : event.hasShirtOption === "INCLUDED"
                          ? " (incluida)"
                          : ""}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <KeyRound className="size-4 shrink-0" />
                      Dorsal y caja de retiro
                    </span>
                    <span className="text-right text-xs font-medium leading-snug text-blue-700">
                      Se asignan automáticamente al aprobar tu pago
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Pago ── */}
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Resumen de pago
                </p>
                <div className="space-y-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">
                      Inscripción ({successData.categoryName || "categoría"})
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${successData.categoryPrice.toFixed(2)}
                    </span>
                  </div>
                  {successData.shirtSize && successData.shirtExtraUSD > 0 && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="shrink-0 text-gray-500">
                        Franela ({successData.shirtSize})
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${successData.shirtExtraUSD.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">Total USD</span>
                    <span className="font-bold text-red-600">
                      ${successData.totalUSD.toFixed(2)}
                    </span>
                  </div>
                  {successData.totalBs !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-700">Total Bs</span>
                      <span className="font-bold text-gray-900">
                        Bs.{" "}
                        {successData.totalBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  {successData.bcvRate !== null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Tasa BCV aplicada</span>
                      <span className="text-gray-500">
                        Bs. {successData.bcvRate.toLocaleString("es-VE", { maximumFractionDigits: 2 })} / USD
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-gray-500">Método de pago</span>
                    <span className="font-semibold text-gray-900">
                      {successData.paymentMethodLabel || "—"}
                    </span>
                  </div>
                  {successData.paymentRef && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="shrink-0 text-gray-500">Referencia</span>
                      <span className="font-semibold text-gray-900">
                        {successData.paymentRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Estado</span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      PENDIENTE
                    </Badge>
                  </div>
                  {successData.registrationId && (
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="text-gray-400">ID de inscripción</span>
                      <span className="font-mono text-gray-600">
                        {successData.registrationId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Recibirás confirmación por correo electrónico una vez aprobada tu
                inscripción.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" /> Imprimir comprobante
                </Button>
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
                {event.date ? formatEventDateLong(event.date) : "Por confirmar"}
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
                        lookupInfo,
                        calculatedAge,
                        birthDateIssue,
                        errors,
                        update,
                        handleCedulaChange,
                        handleRegistrationTypeChange,
                      })}
                    {currentStep === 2 &&
                      renderStep2({
                        formData,
                        errors,
                        update,
                        selectedCategory,
                        calculatedAge,
                        showShirtSection,
                        event,
                      })}
                    {currentStep === 3 &&
                      renderStep3({
                        formData,
                        errors,
                        update,
                        event,
                        bcvRate,
                        bcvSource,
                        rateLoading,
                        totalUSD,
                        totalBs,
                        selectedPaymentMethod,
                        visibleAccounts,
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
// Paso 1: Datos del Corredor (identidad + contacto + ubicación + emergencia)
// ============================================================

interface Step1Props {
  formData: RegFormData;
  lookupInfo: { nombre: string } | null;
  calculatedAge: number | null;
  birthDateIssue: string | null;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  handleCedulaChange: (value: string) => void;
  handleRegistrationTypeChange: (val: "self" | "other") => void;
}

function renderStep1({
  formData,
  lookupInfo,
  calculatedAge,
  birthDateIssue,
  errors,
  update,
  handleCedulaChange,
  handleRegistrationTypeChange,
}: Step1Props) {
  const selfMode = formData.registrationType === "self";

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

        {lookupInfo && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <UserCheck className="size-3.5" />
              ¡Bienvenido(a) de vuelta, {lookupInfo.nombre}!
            </p>
            <p className="mt-0.5 leading-relaxed">
              Cargamos automáticamente tus datos guardados de inscripciones
              anteriores. Si cambió tu teléfono, ciudad, club u otro dato,
              modifícalo aquí — se actualizará tu perfil.
            </p>
          </div>
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
            onChange={(e) => handleCedulaChange(e.target.value)}
            placeholder="V-12345678"
            autoComplete="off"
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
            max={toInputDate(new Date())}
            aria-invalid={!!errors.fechaNacimiento || !!birthDateIssue}
          />
          <FieldError message={errors.fechaNacimiento} />
        </div>

        <div>
          <Label className="mb-1.5 block">
            <Trophy className="size-3.5" /> Edad calculada
          </Label>
          <div
            className={`flex h-9 items-center rounded-md border px-3 text-sm ${
              birthDateIssue
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {calculatedAge !== null ? (
              <span
                className={`font-semibold ${
                  birthDateIssue ? "text-red-600" : "text-gray-800"
                }`}
              >
                {calculatedAge} años
              </span>
            ) : (
              <span className="text-gray-400">
                Se calculará al ingresar la fecha
              </span>
            )}
          </div>
          {birthDateIssue && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="size-3" /> {birthDateIssue}
            </p>
          )}
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
            aria-invalid={!!errors.telefono}
          />
          <FieldError message={errors.telefono} />
        </div>

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
// Paso 2: Categoría y Talla (club + categoría automática + franela)
// ============================================================

interface Step2Props {
  formData: RegFormData;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  selectedCategory: RegCategory | null;
  calculatedAge: number | null;
  showShirtSection: boolean;
  event: RegEvent;
}

function renderStep2({
  formData,
  errors,
  update,
  selectedCategory,
  calculatedAge,
  showShirtSection,
  event,
}: Step2Props) {
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
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
                Opciones especiales
              </SelectLabel>
              {CLUB_OPCIONES_ESPECIALES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
                Ciclismo
              </SelectLabel>
              {CLUBES_VENEZUELA.filter((c) => c.tipo === "ciclismo").map((c) => (
                <SelectItem key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
                Atletismo
              </SelectLabel>
              {CLUBES_VENEZUELA.filter((c) => c.tipo === "atletismo").map((c) => (
                <SelectItem key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold uppercase text-gray-400">
                Multi-deporte
              </SelectLabel>
              {CLUBES_VENEZUELA.filter((c) => c.tipo === "multi").map((c) => (
                <SelectItem key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
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

      {/* Categoría asignada automáticamente (no se elige) */}
      <div>
        <div className="mb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Trophy className="size-4 text-red-600" /> Tu categoría
          </h3>
          <p className="text-xs text-gray-500">
            Se asigna automáticamente según tu fecha de nacimiento y género —
            no necesitas elegirla.
          </p>
        </div>

        {calculatedAge === null ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <Info className="mx-auto size-6 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              Completa tu fecha de nacimiento y género en el Paso 1
            </p>
            <p className="text-xs text-gray-400">
              La categoría se calculará automáticamente con tu edad.
            </p>
          </div>
        ) : !selectedCategory ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <AlertCircle className="mx-auto size-6 text-red-500" />
            <p className="mt-2 text-sm font-semibold text-red-700">
              No hay categoría disponible para {calculatedAge} años
              {formData.genero === "F" ? " (Femenino)" : formData.genero === "M" ? " (Masculino)" : ""}
            </p>
            <p className="mt-1 text-xs text-red-500">
              Verifica tu fecha de nacimiento o contacta al organizador del evento.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-red-500 bg-red-50/60 p-4 ring-2 ring-red-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {selectedCategory.name}
                  </span>
                  <Badge className="bg-red-600 text-[10px] text-white hover:bg-red-600">
                    Asignada automáticamente
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {selectedCategory.gender === "M"
                      ? "Varones"
                      : selectedCategory.gender === "F"
                      ? "Damas"
                      : "Mixto"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {selectedCategory.minAge}
                    {selectedCategory.maxAge && selectedCategory.maxAge < 100
                      ? `–${selectedCategory.maxAge}`
                      : "+"}{' '}años
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                  <Lock className="size-3" />
                  Calculada con tu edad actual: {calculatedAge} años
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-red-600">
                  ${selectedCategory.price.toFixed(2)}
                </p>
                <p className="text-[10px] uppercase text-gray-400">USD</p>
              </div>
            </div>
          </div>
        )}
        <FieldError message={errors.categoryId} />
      </div>

      <Separator />

      {/* Talla de franela */}
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
    </div>
  );
}

// ============================================================
// Paso 3: Pago (cuentas del evento + método + referencia + comprobante + BCV)
// ============================================================

interface Step3Props {
  formData: RegFormData;
  errors: Partial<Record<keyof RegFormData | "waiverAccepted", string>>;
  update: <K extends keyof RegFormData>(field: K, value: RegFormData[K]) => void;
  event: RegEvent;
  bcvRate: number | null;
  bcvSource: string | null;
  rateLoading: boolean;
  totalUSD: number;
  totalBs: number | null;
  selectedPaymentMethod: MetodoPago | null;
  visibleAccounts: PaymentAccount[];
  waiverAccepted: boolean;
  setWaiverAccepted: (v: boolean) => void;
}

function renderStep3({
  formData,
  errors,
  update,
  event,
  bcvRate,
  bcvSource,
  rateLoading,
  totalUSD,
  totalBs,
  selectedPaymentMethod,
  visibleAccounts,
  waiverAccepted,
  setWaiverAccepted,
}: Step3Props) {
  return (
    <div className="space-y-6">
      {/* Monto congelado */}
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
              Monto total a pagar
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalUSD.toFixed(2)}
              {totalBs !== null && (
                <span className="ml-2 text-base font-semibold text-gray-600">
                  / Bs.{" "}
                  {totalBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            {rateLoading ? (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <Loader2 className="size-3.5 animate-spin" /> Cargando tasa BCV…
              </p>
            ) : bcvRate !== null ? (
              <>
                <p className="flex items-center gap-1 text-xs font-semibold text-red-700">
                  <Lock className="size-3" /> Tasa BCV bloqueada
                </p>
                <p className="text-sm font-bold text-gray-900">
                  Bs. {bcvRate.toLocaleString("es-VE", { maximumFractionDigits: 2 })} / USD
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Tasa BCV no disponible</p>
            )}
            {bcvSource && (
              <p className="text-[10px] text-gray-400">{bcvSource}</p>
            )}
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          El monto y la tasa quedan congelados con tu inscripción — aunque la
          tasa BCV cambie después, tu pago ya está fijado.
        </p>
      </div>

      {/* Cuentas de destino de pago del evento */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Landmark className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              ¿Dónde pagar?
            </h3>
            <p className="text-xs text-gray-500">
              {selectedPaymentMethod
                ? `Cuentas para ${selectedPaymentMethod.label}:`
                : "Estas son las cuentas del evento — elige tu método abajo y te mostramos la cuenta correspondiente."}
            </p>
          </div>
        </div>

        {visibleAccounts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleAccounts.map((acc, idx) => {
              const isHighlighted =
                selectedPaymentMethod && acc.method === selectedPaymentMethod.id;
              return (
                <div
                  key={`acc-${idx}`}
                  className={`rounded-xl border p-3 transition-all ${
                    isHighlighted
                      ? "border-red-400 bg-red-50/60 ring-2 ring-red-100"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {(() => {
                      const Icon = PAYMENT_ICONS[acc.method] || CreditCard;
                      return <Icon className="size-4 text-red-600" />;
                    })()}
                    <span className="text-sm font-bold text-gray-900">
                      {accountLabel(acc)}
                    </span>
                    {isHighlighted && (
                      <Badge className="ml-auto bg-red-600 text-[10px] text-white hover:bg-red-600">
                        Tu método
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-0.5">
                    {accountLines(acc).map((line, i) => (
                      <li
                        key={i}
                        className="break-all text-xs leading-relaxed text-gray-600"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p className="leading-relaxed">
              El organizador aún no ha cargado las cuentas de pago para este
              evento. Realiza tu pago por el canal habitual del evento y coloca
              tu referencia abajo.
            </p>
          </div>
        )}
      </div>

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
              <p className="mt-1.5 flex items-start gap-1 text-[11px] text-gray-400">
                <Info className="mt-0.5 size-3 shrink-0" />
                Cada inscripción necesita su propia referencia de pago — no
                reutilices una usada antes en este evento.
              </p>
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
                maxSize={3}
                label="Arrastra o haz clic para subir el comprobante"
                hint="Se comprime automáticamente en tu dispositivo (máx 3MB)"
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

// Small helper component used inside Step 3 for the file-check label
function FileCheckIcon() {
  return (
    <span className="inline-flex size-3.5 items-center justify-center">
      <Check className="size-3" />
    </span>
  );
}

export default RegistrationWizard;
