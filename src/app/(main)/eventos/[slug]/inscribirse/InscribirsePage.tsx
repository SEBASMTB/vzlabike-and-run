"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  Heart,
  Shield,
  Shirt,
  Trophy,
  Calendar,
  MapPin,
  Sparkles,
  AlertCircle,
  Upload,
  X,
  ChevronLeft,
  Droplets,
  Hash,
} from "lucide-react";
import { LiabilityWaiver } from "@/components/LiabilityWaiver";

// ============================================================
// Types
// ============================================================

interface CategoryData {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  gender: string;
  distanceKm: number | null;
  price: number;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  sportType: string;
  date: string;
  location: string;
  distance: string;
  description: string;
  imageUrl: string;
  bannerImage: string;
  price: number;
  priceBs: number;
  hasShirtOption: string; // 'INCLUDED' | 'OPTIONAL' | 'NONE'
  shirtPrice: number | null;
  requiresFederationLicense: boolean;
  maxParticipants: number;
  categoryList: CategoryData[];
  categories: string; // legacy JSON
  status: string;
  kitInfo: string;
  rules: string;
}

interface InscribirsePageProps {
  event: EventData;
  registrationCount: number;
}

interface RunnerSearchResult {
  found: boolean;
  runner?: {
    id: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string; // DD/MM/YYYY
    genero: string;
    email: string | null;
    telefono: string | null;
    pais: string | null;
    estado: string | null;
    ciudad: string | null;
    direccion: string | null;
    team: string | null;
    tallaFranela: string | null;
    licenciaFederativa: string | null;
    grupoSanguineo: string | null;
    contactoEmergenciaNombre: string | null;
    contactoEmergenciaTelefono: string | null;
    contactoEmergenciaParentesco: string | null;
    alergiasCondiciones: string | null;
  };
}

interface EligibilityResult {
  eventId: string;
  eventTitle: string;
  edadCalculada: number;
  categories: CategoryData[];
}

// ============================================================
// Zod Schemas
// ============================================================

const formSchema = z.object({
  // Identificación
  cedula: z.string().min(5, "Cédula requerida (mínimo 5 caracteres)"),

  // Datos personales
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  fechaNacimiento: z.string().min(1, "Fecha de nacimiento requerida"),
  genero: z.string().min(1, "Género requerido"),

  // Contacto
  email: z.string().min(1, "Correo electrónico requerido").email("Correo inválido"),
  telefono: z.string().min(7, "Teléfono requerido (mínimo 7 dígitos)"),
  ciudad: z.string().min(2, "Ciudad requerida"),

  // Datos deportivos
  team: z.string().optional(),
  tallaFranela: z.string().optional(),
  licenciaFederativa: z.string().optional(),

  // Ficha médica
  grupoSanguineo: z.string().min(1, "Grupo sanguíneo requerido"),
  contactoEmergenciaNombre: z.string().min(2, "Nombre del contacto requerido"),
  contactoEmergenciaParentesco: z.string().min(1, "Parentesco requerido"),
  contactoEmergenciaTelefono: z.string().min(7, "Teléfono de emergencia requerido"),
  alergiasCondiciones: z.string().optional(),

  // Inscripción
  categoryId: z.string().min(1, "Categoría requerida"),

  // Franela
  wantShirt: z.boolean().optional(),
  shirtSize: z.string().optional(),

  // Pago
  paymentMethod: z.string().min(1, "Método de pago requerido"),
  paymentRef: z.string().min(1, "Número de referencia requerido"),
  paymentProofUrl: z.string().optional(),

  // Legal
  waiverAccepted: z.boolean().refine((v) => v === true, "Debes aceptar la responsabilidad"),
});

type FormData = z.infer<typeof formSchema>;

// ============================================================
// Constants
// ============================================================

type PaymentMethod = "binance" | "zelle" | "pagomovil" | "transferencia";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: React.ElementType;
  description: string;
  wallet: string;
  instructions: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "binance",
    label: "Binance",
    icon: Wallet,
    description: "Pago con criptomonedas vía Binance",
    wallet: "ID Binance: 816555002",
    instructions: "Abre Binance, selecciona Enviar/Pagar por ID (816555002) y envía el monto exacto en USDT. Guarda el hash de la transacción como referencia.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
  },
  {
    id: "zelle",
    label: "Zelle",
    icon: CreditCard,
    description: "Pago rápido desde EE.UU.",
    wallet: "venezuelabikeandrun@gmail.com — A nombre de: KARLA QUINTERO",
    instructions: "Envía el pago vía Zelle al correo indicado a nombre de KARLA QUINTERO. Recibirás confirmación en minutos.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-300",
  },
  {
    id: "pagomovil",
    label: "Pago Móvil",
    icon: Smartphone,
    description: "Pago Móvil Venezuela",
    wallet: "Teléfono: 0412-016-2685 / CI: V-9479255",
    instructions: "Realiza el Pago Móvil al teléfono 0412-016-2685 con CI V-9479255. Guarda el número de referencia de 6 dígitos.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
  },
  {
    id: "transferencia",
    label: "Transferencia Bancaria",
    icon: Building2,
    description: "Transferencia bancaria nacional",
    wallet: "Escríbenos por WhatsApp para los datos bancarios",
    instructions: "Escríbenos al WhatsApp para recibir los datos de la cuenta bancaria y realizar tu transferencia. Envía foto del comprobante.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const GENDERS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];
const PARENTESCOS = [
  "Padre/Madre",
  "Hijo/Hija",
  "Esposo/Esposa",
  "Hermano/Hermana",
  "Tío/Tía",
  "Primo/Prima",
  "Amigo/Amiga",
  "Otro",
];

const STEPS = [
  { label: "Identificación", icon: Search, shortLabel: "Cédula" },
  { label: "Datos Personales", icon: User, shortLabel: "Personal" },
  { label: "Categoría", icon: Trophy, shortLabel: "Categoría" },
  { label: "Kit + Ficha Médica", icon: Heart, shortLabel: "Médica" },
  { label: "Pago", icon: CreditCard, shortLabel: "Pago" },
];

// ============================================================
// Helpers
// ============================================================

/** Parse DD/MM/YYYY to Date */
function parseDateDDMMYYYY(str: string): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

/** Parse any date format to Date */
function parseAnyDate(str: string): Date | null {
  if (!str) return null;
  // Try DD/MM/YYYY first
  const ddmmyyyy = parseDateDDMMYYYY(str);
  if (ddmmyyyy) return ddmmyyyy;
  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }
  // Native parse
  const native = new Date(str);
  return isNaN(native.getTime()) ? null : native;
}

/** Format Date as YYYY-MM-DD for input[type=date] */
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format Date as DD/MM/YYYY for display */
function toDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${day}/${m}/${y}`;
}

/** Format Date as DD/MM/YYYY for API */
function toAPIDate(d: Date): string {
  return toDisplayDate(d);
}

// ============================================================
// Component
// ============================================================

export function InscribirsePage({ event, registrationCount }: InscribirsePageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [runnerFound, setRunnerFound] = useState<boolean | null>(null); // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [runnerData, setRunnerData] = useState<RunnerSearchResult["runner"] | null>(null);
  const [eligibleCategories, setEligibleCategories] = useState<CategoryData[]>([]);
  const [autoCategoryId, setAutoCategoryId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string>("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [wantShirt, setWantShirt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{
    registrationId: string;
    transactionId: string;
    categoryName: string;
  } | null>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cedula: "",
      nombres: "",
      apellidos: "",
      fechaNacimiento: "",
      genero: "",
      email: "",
      telefono: "",
      ciudad: "",
      team: "",
      tallaFranela: "",
      licenciaFederativa: "",
      grupoSanguineo: "",
      contactoEmergenciaNombre: "",
      contactoEmergenciaParentesco: "",
      contactoEmergenciaTelefono: "",
      alergiasCondiciones: "",
      categoryId: "",
      wantShirt: false,
      shirtSize: "",
      paymentMethod: "",
      paymentRef: "",
      paymentProofUrl: "",
      waiverAccepted: false,
    },
    mode: "onBlur",
  });

  // ─── Computed values ─────────────────────────────────────

  const selectedCategory = eligibleCategories.find((c) => c.id === form.watch("categoryId"));
  const basePrice = selectedCategory?.price ?? event.price;

  const showShirtSection = event.hasShirtOption !== "NONE";
  const shirtIsRequired = event.hasShirtOption === "INCLUDED";
  const shirtIsOptional = event.hasShirtOption === "OPTIONAL";
  const includeShirt = shirtIsRequired || (shirtIsOptional && wantShirt);
  const shirtExtraPrice = includeShirt && event.shirtPrice ? event.shirtPrice : 0;
  const totalPrice = basePrice + shirtExtraPrice;

  const spotsLeft = event.maxParticipants - registrationCount;

  // ─── Step 1: Search runner by cedula ─────────────────────

  const searchRunner = useCallback(async (cedula: string) => {
    const cleaned = cedula.trim().replace(/[\s.\-]/g, "");
    if (cleaned.length < 5) {
      toast({ title: "Cédula muy corta", description: "Ingresa al menos 5 caracteres", variant: "destructive" });
      return;
    }

    setSearching(true);
    setRunnerFound(null);
    setRunnerData(null);

    try {
      const res = await fetch(`/api/runners/search?cedula=${encodeURIComponent(cleaned)}`);
      if (!res.ok) throw new Error("Error en la búsqueda");

      const data: RunnerSearchResult = await res.json();

      if (data.found && data.runner) {
        setRunnerFound(true);
        setRunnerData(data.runner);

        // Auto-completar campos del formulario
        const birthDate = parseDateDDMMYYYY(data.runner.fechaNacimiento);
        form.setValue("nombres", data.runner.nombres || "");
        form.setValue("apellidos", data.runner.apellidos || "");
        form.setValue("fechaNacimiento", birthDate ? toInputDate(birthDate) : "");
        form.setValue("genero", data.runner.genero || "");
        form.setValue("email", data.runner.email || "");
        form.setValue("telefono", data.runner.telefono || "");
        form.setValue("ciudad", data.runner.ciudad || "");
        form.setValue("team", data.runner.team || "");
        form.setValue("tallaFranela", data.runner.tallaFranela || "");
        form.setValue("licenciaFederativa", data.runner.licenciaFederativa || "");
        form.setValue("grupoSanguineo", data.runner.grupoSanguineo || "");
        form.setValue("contactoEmergenciaNombre", data.runner.contactoEmergenciaNombre || "");
        form.setValue("contactoEmergenciaTelefono", data.runner.contactoEmergenciaTelefono || "");
        form.setValue("contactoEmergenciaParentesco", data.runner.contactoEmergenciaParentesco || "");
        form.setValue("alergiasCondiciones", data.runner.alergiasCondiciones || "");

        toast({
          title: `¡Bienvenido, ${data.runner.nombres}!`,
          description: "Tus datos han sido cargados. Puedes actualizarlos si lo deseas.",
        });
      } else {
        setRunnerFound(false);
        // Limpiar campos pero mantener cédula
        form.setValue("nombres", "");
        form.setValue("apellidos", "");
        form.setValue("fechaNacimiento", "");
        form.setValue("genero", "");
        form.setValue("email", "");
        form.setValue("telefono", "");
        form.setValue("ciudad", "");
        form.setValue("team", "");
        form.setValue("tallaFranela", "");
        form.setValue("licenciaFederativa", "");
        form.setValue("grupoSanguineo", "");
        form.setValue("contactoEmergenciaNombre", "");
        form.setValue("contactoEmergenciaTelefono", "");
        form.setValue("contactoEmergenciaParentesco", "");
        form.setValue("alergiasCondiciones", "");

        toast({
          title: "Atleta nuevo detectado",
          description: "Completa tus datos para registrarte en el evento.",
        });
      }
    } catch {
      toast({ title: "Error de búsqueda", description: "No se pudo verificar la cédula. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [form, toast]);

  // ─── Check eligibility when DOB + gender are set ─────────

  const checkEligibility = useCallback(async (dob: string, gender: string) => {
    if (!dob || !gender) return;

    const birthDate = parseAnyDate(dob);
    if (!birthDate) return;

    setCheckingEligibility(true);
    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          fechaNacimiento: toAPIDate(birthDate),
          genero: gender,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast({ title: "Error de elegibilidad", description: errData.error || "No se pudieron verificar las categorías", variant: "destructive" });
        setEligibleCategories([]);
        setAutoCategoryId(null);
        setCategoryMessage("");
        setCalculatedAge(null);
        return;
      }

      const data: EligibilityResult = await res.json();
      setEligibleCategories(data.categories);
      setCalculatedAge(data.edadCalculada);

      if (data.categories.length === 0) {
        setAutoCategoryId(null);
        setCategoryMessage("No hay categorías disponibles para tu edad y género. Contacta al organizador.");
        form.setValue("categoryId", "");
      } else if (data.categories.length === 1) {
        // Auto-seleccionar la única categoría
        const cat = data.categories[0];
        setAutoCategoryId(cat.id);
        form.setValue("categoryId", cat.id);
        setCategoryMessage(`Categoría asignada automáticamente: ${cat.name} (Edad de competencia: ${data.edadCalculada} años)`);
      } else {
        setAutoCategoryId(null);
        form.setValue("categoryId", "");
        setCategoryMessage(`Se encontraron ${data.categories.length} categorías elegibles para tu edad de competencia (${data.edadCalculada} años). Selecciona una:`);
      }
    } catch {
      toast({ title: "Error de conexión", description: "No se pudieron verificar las categorías", variant: "destructive" });
      setEligibleCategories([]);
    } finally {
      setCheckingEligibility(false);
    }
  }, [event.id, form, toast]);

  // Auto-check eligibility when DOB or gender changes
  const watchedDOB = form.watch("fechaNacimiento");
  const watchedGender = form.watch("genero");

  useEffect(() => {
    if (watchedDOB && watchedGender && watchedDOB.length >= 8) {
      checkEligibility(watchedDOB, watchedGender);
    }
  }, [watchedDOB, watchedGender, checkEligibility]);

  // ─── File upload handler ─────────────────────────────────

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Solo se permiten imágenes (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 5 MB", variant: "destructive" });
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
    form.setValue("paymentProofUrl", file.name); // placeholder, actual upload would go to S3
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
    form.setValue("paymentProofUrl", "");
  };

  // ─── Step navigation ─────────────────────────────────────

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 0: // Cédula
        return runnerFound !== null;
      case 1: { // Datos personales
        const fields = ["nombres", "apellidos", "fechaNacimiento", "genero", "email", "telefono", "ciudad"] as const;
        return fields.every((f) => form.getValues(f) && !form.formState.errors[f]);
      }
      case 2: // Categoría
        return !!form.getValues("categoryId");
      case 3: { // Médica
        const medFields = ["grupoSanguineo", "contactoEmergenciaNombre", "contactoEmergenciaTelefono", "contactoEmergenciaParentesco"] as const;
        const shirtValid = includeShirt ? !!form.getValues("shirtSize") : true;
        const fedValid = event.requiresFederationLicense ? !!form.getValues("licenciaFederativa") : true;
        return medFields.every((f) => form.getValues(f) && !form.formState.errors[f]) && shirtValid && fedValid;
      }
      case 4: // Pago
        return !!selectedPayment && !!form.getValues("paymentRef") && waiverAccepted;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && canAdvance()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  // ─── Submit registration ─────────────────────────────────

  const onSubmit = async () => {
    const data = form.getValues();

    // Final validation
    if (!data.categoryId || !data.paymentRef || !selectedPayment || !waiverAccepted) {
      toast({ title: "Datos incompletos", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const birthDate = parseAnyDate(data.fechaNacimiento);
      if (!birthDate) throw new Error("Fecha inválida");

      const payload = {
        eventId: event.id,
        categoryId: data.categoryId,
        // Runner data
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fechaNacimiento: toAPIDate(birthDate),
        genero: data.genero,
        email: data.email,
        telefono: data.telefono,
        pais: "Venezuela",
        ciudad: data.ciudad,
        team: data.team || undefined,
        tallaFranela: data.shirtSize || data.tallaFranela || undefined,
        licenciaFederativa: data.licenciaFederativa || undefined,
        grupoSanguineo: data.grupoSanguineo,
        contactoEmergenciaNombre: data.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: data.contactoEmergenciaTelefono,
        contactoEmergenciaParentesco: data.contactoEmergenciaParentesco,
        alergiasCondiciones: data.alergiasCondiciones || undefined,
        // Registration data
        shirtSize: includeShirt ? data.shirtSize : undefined,
        hasShirt: includeShirt,
        federationLicenseNumber: data.licenciaFederativa || undefined,
        paymentMethod: selectedPayment,
        paymentRef: data.paymentRef,
        paymentProofUrl: proofPreview || undefined,
        totalAmount: totalPrice,
        waiverAccepted: true,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast({ title: "Ya estás inscrito", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Error de inscripción", description: result.error || "Error desconocido", variant: "destructive" });
        }
        return;
      }

      // Éxito
      setRegistrationResult({
        registrationId: result.registrationId,
        transactionId: result.transactionId,
        categoryName: selectedCategory?.name || "",
      });

      toast({ title: "¡Inscripción exitosa!", description: "Tu registro ha sido procesado. Estado: PENDIENTE de aprobación." });
    } catch (err) {
      toast({ title: "Error", description: "No se pudo procesar la inscripción. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Confirmation screen ─────────────────────────────────

  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="border-emerald-200 shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-emerald-800">¡Inscripción Registrada!</h2>
                <p className="text-emerald-600 mt-2">Tu solicitud está pendiente de aprobación</p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Evento:</span>
                  <span className="font-semibold text-emerald-900">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Atleta:</span>
                  <span className="font-semibold text-emerald-900">{form.getValues("nombres")} {form.getValues("apellidos")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Cédula:</span>
                  <span className="font-semibold text-emerald-900">{form.getValues("cedula")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Categoría:</span>
                  <span className="font-semibold text-emerald-900">{registrationResult.categoryName}</span>
                </div>
                <Separator className="bg-emerald-200" />
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Total pagado:</span>
                  <span className="font-bold text-emerald-900 text-lg">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">ID Transacción:</span>
                  <span className="font-mono text-xs text-emerald-800">{registrationResult.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Estado:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">PENDIENTE</Badge>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Recibirás confirmación por correo electrónico una vez aprobada tu inscripción.
              </p>

              <div className="flex gap-3 justify-center">
                <Link href="/#eventos">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Ver Eventos
                  </Button>
                </Link>
                <Link href={`/eventos/${event.slug}`}>
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Trophy className="w-4 h-4" /> Ir al Evento
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Main form render ────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/eventos/${event.slug}`}
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Volver al evento
          </Link>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-blue-200 text-sm">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleDateString("es-VE", { dateStyle: "long" })}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-200"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center leading-tight ${isActive ? "text-blue-700 font-semibold" : "text-gray-400"}`}>
                    {step.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && renderStepCedula()}
            {currentStep === 1 && renderStepPersonal()}
            {currentStep === 2 && renderStepCategory()}
            {currentStep === 3 && renderStepMedical()}
            {currentStep === 4 && renderStepPayment()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canAdvance()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={submitting || !canAdvance()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Inscribirme
                </>
              )}
            </Button>
          )}
        </div>
      </div>

    </div>
  );

  // ─── Step 0: Cédula Verification ─────────────────────────

  function renderStepCedula() {
    return (
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Search className="w-5 h-5" />
            Verificación de Identidad
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Ingresa tu Cédula de Identidad, DNI o Pasaporte para verificar si ya estás registrado
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="cedula" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-500" />
                Cédula / DNI / Pasaporte <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cedula"
                placeholder="Ej: V12345678"
                className="mt-1.5 text-lg font-mono"
                {...form.register("cedula")}
                onBlur={(e) => {
                  form.register("cedula").onBlur(e);
                  const val = e.target.value;
                  if (val.trim().length >= 5) searchRunner(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = form.getValues("cedula");
                    if (val.trim().length >= 5) searchRunner(val);
                  }
                }}
              />
              {form.formState.errors.cedula && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.cedula.message}</p>
              )}
            </div>
            <Button
              onClick={() => searchRunner(form.getValues("cedula"))}
              disabled={searching || form.getValues("cedula").trim().length < 5}
              className="mt-7 gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>

          {/* Result indicator */}
          {runnerFound === true && runnerData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800">¡Bienvenido de vuelta, {runnerData.nombres}!</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Tus datos han sido cargados automáticamente. Podrás editarlos en el siguiente paso si necesitas actualizar algo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {runnerFound === false && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Atleta nuevo detectado</p>
                  <p className="text-sm text-amber-600 mt-1">
                    No encontramos registros previos con esta cédula. Completa tus datos en el siguiente paso para registrarte.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Step 1: Personal Data ──────────────────────────────

  function renderStepPersonal() {
    return (
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="w-5 h-5" />
            Datos Personales
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            {runnerFound ? "Revisa y actualiza tus datos si es necesario" : "Completa tus datos de registro"}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Row: Nombres + Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombres">Nombres <span className="text-red-500">*</span></Label>
              <Input id="nombres" placeholder="Ej: Carlos Alberto" className="mt-1.5" {...form.register("nombres")} />
              {form.formState.errors.nombres && <p className="text-xs text-red-500 mt-1">{form.formState.errors.nombres.message}</p>}
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos <span className="text-red-500">*</span></Label>
              <Input id="apellidos" placeholder="Ej: Pérez González" className="mt-1.5" {...form.register("apellidos")} />
              {form.formState.errors.apellidos && <p className="text-xs text-red-500 mt-1">{form.formState.errors.apellidos.message}</p>}
            </div>
          </div>

          {/* Row: Fecha Nacimiento + Género */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
              <Input
                id="fechaNacimiento"
                type="date"
                className="mt-1.5"
                {...form.register("fechaNacimiento")}
              />
              {form.formState.errors.fechaNacimiento && <p className="text-xs text-red-500 mt-1">{form.formState.errors.fechaNacimiento.message}</p>}
              {calculatedAge !== null && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Edad de competencia: <strong>{calculatedAge} años</strong>
                </p>
              )}
            </div>
            <div>
              <Label>Género <span className="text-red-500">*</span></Label>
              <Select
                value={form.watch("genero")}
                onValueChange={(v) => form.setValue("genero", v, { shouldValidate: true })}
              >
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.genero && <p className="text-xs text-red-500 mt-1">{form.formState.errors.genero.message}</p>}
            </div>
          </div>

          <Separator />

          {/* Row: Email + Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Correo Electrónico <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com" className="mt-1.5" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
              <Input id="telefono" placeholder="Ej: 0414-1234567" className="mt-1.5" {...form.register("telefono")} />
              {form.formState.errors.telefono && <p className="text-xs text-red-500 mt-1">{form.formState.errors.telefono.message}</p>}
            </div>
          </div>

          {/* Row: Ciudad + Equipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ciudad">Ciudad <span className="text-red-500">*</span></Label>
              <Input id="ciudad" placeholder="Ej: Caracas" className="mt-1.5" {...form.register("ciudad")} />
              {form.formState.errors.ciudad && <p className="text-xs text-red-500 mt-1">{form.formState.errors.ciudad.message}</p>}
            </div>
            <div>
              <Label htmlFor="team">Equipo / Club</Label>
              <Input id="team" placeholder="Opcional" className="mt-1.5" {...form.register("team")} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Step 2: Category Selection ──────────────────────────

  function renderStepCategory() {
    return (
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Trophy className="w-5 h-5" />
            Categoría de Competencia
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Selecciona tu categoría según tu edad de competencia y género
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {checkingEligibility ? (
            <div className="flex items-center justify-center py-8 gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verificando categorías elegibles...</span>
            </div>
          ) : eligibleCategories.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Sin categorías disponibles</p>
                <p className="text-sm text-amber-600 mt-1">
                  {categoryMessage || "No hay categorías para tu edad y género. Contacta al organizador."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Category message */}
              {categoryMessage && (
                <div className={`rounded-xl p-4 flex items-start gap-3 ${
                  autoCategoryId
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-blue-50 border border-blue-200"
                }`}>
                  {autoCategoryId ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Trophy className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  )}
                  <p className={`text-sm ${autoCategoryId ? "text-emerald-700" : "text-blue-700"}`}>
                    {categoryMessage}
                  </p>
                </div>
              )}

              {/* Category selector */}
              <div>
                <Label>Categoría <span className="text-red-500">*</span></Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(v) => form.setValue("categoryId", v, { shouldValidate: true })}
                  disabled={!!autoCategoryId}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecciona categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {cat.gender === "M" ? "Varones" : cat.gender === "F" ? "Damas" : "Mixto"} · {cat.minAge}-{cat.maxAge} años
                          </Badge>
                          {cat.price > 0 && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              ${cat.price.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              {/* Category details card */}
              {selectedCategory && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">{selectedCategory.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-600">Edad:</span>{" "}
                      <span className="font-medium text-blue-800">{selectedCategory.minAge}-{selectedCategory.maxAge} años</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Género:</span>{" "}
                      <span className="font-medium text-blue-800">
                        {selectedCategory.gender === "M" ? "Varones" : selectedCategory.gender === "F" ? "Damas" : "Mixto"}
                      </span>
                    </div>
                    {selectedCategory.distanceKm && (
                      <div>
                        <span className="text-blue-600">Distancia:</span>{" "}
                        <span className="font-medium text-blue-800">{selectedCategory.distanceKm} km</span>
                      </div>
                    )}
                    <div>
                      <span className="text-blue-600">Precio base:</span>{" "}
                      <span className="font-medium text-emerald-700">${selectedCategory.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Step 3: Kit + Medical Info ──────────────────────────

  function renderStepMedical() {
    return (
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Heart className="w-5 h-5" />
            Kit del Evento + Ficha Médica Internacional
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Estándar World Athletics / Major Marathons — Información requerida para tu seguridad
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* ── Shirt / Kit Section ──────────────────────────── */}
          {showShirtSection && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-blue-600" />
                Franela Oficial
              </h3>

              {shirtIsRequired && (
                <>
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                    La franela oficial está <strong>incluida</strong> en tu inscripción.
                  </p>
                  <div>
                    <Label>Talla <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.watch("shirtSize")}
                      onValueChange={(v) => form.setValue("shirtSize", v, { shouldValidate: true })}
                    >
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona tu talla..." /></SelectTrigger>
                      <SelectContent>
                        {SHIRT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {shirtIsOptional && (
                <>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="wantShirt"
                      checked={wantShirt}
                      onCheckedChange={(checked) => {
                        setWantShirt(!!checked);
                        form.setValue("wantShirt", !!checked);
                        if (!checked) {
                          form.setValue("shirtSize", "");
                        }
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor="wantShirt" className="text-sm leading-relaxed cursor-pointer">
                      ¿Deseas incluir la franela oficial por <strong className="text-emerald-600">+${(event.shirtPrice ?? 0).toFixed(2)}</strong>?
                    </Label>
                  </div>

                  {wantShirt && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-7">
                      <Label>Talla <span className="text-red-500">*</span></Label>
                      <Select
                        value={form.watch("shirtSize")}
                        onValueChange={(v) => form.setValue("shirtSize", v, { shouldValidate: true })}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona tu talla..." /></SelectTrigger>
                        <SelectContent>
                          {SHIRT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Federation License ──────────────────────────── */}
          {event.requiresFederationLicense && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Licencia Federativa
              </h3>
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Este evento requiere licencia federativa vigente.
              </p>
              <div>
                <Label htmlFor="licenciaFederativa">N° de Licencia Federativa <span className="text-red-500">*</span></Label>
                <Input
                  id="licenciaFederativa"
                  placeholder="Ej: FEVETRI-2025-12345"
                  className="mt-1.5"
                  {...form.register("licenciaFederativa")}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* ── Medical Info ───────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-red-500" />
              Ficha Médica Internacional
            </h3>
            <p className="text-xs text-gray-500">
              Información crítica en caso de emergencia durante el evento. Estándar World Athletics / Major Marathons.
            </p>

            {/* Grupo Sanguíneo */}
            <div>
              <Label>Grupo Sanguíneo <span className="text-red-500">*</span></Label>
              <Select
                value={form.watch("grupoSanguineo")}
                onValueChange={(v) => form.setValue("grupoSanguineo", v, { shouldValidate: true })}
              >
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.grupoSanguineo && <p className="text-xs text-red-500 mt-1">{form.formState.errors.grupoSanguineo.message}</p>}
            </div>

            {/* Contacto de Emergencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactoEmergenciaNombre">Nombre del Contacto <span className="text-red-500">*</span></Label>
                <Input
                  id="contactoEmergenciaNombre"
                  placeholder="Ej: María Pérez"
                  className="mt-1.5"
                  {...form.register("contactoEmergenciaNombre")}
                />
                {form.formState.errors.contactoEmergenciaNombre && <p className="text-xs text-red-500 mt-1">{form.formState.errors.contactoEmergenciaNombre.message}</p>}
              </div>
              <div>
                <Label>Parentesco <span className="text-red-500">*</span></Label>
                <Select
                  value={form.watch("contactoEmergenciaParentesco")}
                  onValueChange={(v) => form.setValue("contactoEmergenciaParentesco", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {PARENTESCOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.contactoEmergenciaParentesco && <p className="text-xs text-red-500 mt-1">{form.formState.errors.contactoEmergenciaParentesco.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactoEmergenciaTelefono">Teléfono de Emergencia <span className="text-red-500">*</span></Label>
                <Input
                  id="contactoEmergenciaTelefono"
                  placeholder="Ej: 0414-9876543"
                  className="mt-1.5"
                  {...form.register("contactoEmergenciaTelefono")}
                />
                {form.formState.errors.contactoEmergenciaTelefono && <p className="text-xs text-red-500 mt-1">{form.formState.errors.contactoEmergenciaTelefono.message}</p>}
              </div>
              <div>
                <Label htmlFor="alergiasCondiciones">Alergias / Condiciones Médicas</Label>
                <Textarea
                  id="alergiasCondiciones"
                  placeholder="Ej: Asma, alergia a penicilina... (opcional)"
                  className="mt-1.5"
                  rows={2}
                  {...form.register("alergiasCondiciones")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Step 4: Payment ────────────────────────────────────

  function renderStepPayment() {
    return (
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CreditCard className="w-5 h-5" />
            Pago y Confirmación
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Realiza el pago y sube tu comprobante para completar la inscripción
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* ── Price breakdown ─────────────────────────────── */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Desglose del Precio
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Inscripción ({selectedCategory?.name || "Categoría"})</span>
                <span className="font-medium text-emerald-800">${basePrice.toFixed(2)}</span>
              </div>
              {includeShirt && event.shirtPrice && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Franela oficial ({form.watch("shirtSize") || "—"})</span>
                  <span className="font-medium text-emerald-800">+${event.shirtPrice.toFixed(2)}</span>
                </div>
              )}
              <Separator className="bg-emerald-200 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-emerald-800">Total</span>
                <span className="font-bold text-emerald-900 text-lg">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Payment methods ─────────────────────────────── */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Método de Pago</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isSelected = selectedPayment === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setSelectedPayment(pm.id);
                      form.setValue("paymentMethod", pm.id);
                    }}
                    className={`rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? `${pm.bg} ${pm.border} ring-2 ring-offset-1 ring-current ${pm.color}`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? pm.color : "text-gray-500"}`} />
                      <span className={`font-semibold text-sm ${isSelected ? pm.color : "text-gray-700"}`}>
                        {pm.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{pm.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Wallet info for selected payment */}
            {selectedPayment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                {(() => {
                  const pm = PAYMENT_METHODS.find((p) => p.id === selectedPayment)!;
                  const Icon = pm.icon;
                  return (
                    <div className={`${pm.bg} border ${pm.border} rounded-xl p-4 space-y-2`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${pm.color}`} />
                        <span className={`font-semibold text-sm ${pm.color}`}>{pm.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{pm.wallet}</p>
                      <p className="text-xs text-gray-600">{pm.instructions}</p>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>

          <Separator />

          {/* ── Payment reference ───────────────────────────── */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" />
              Comprobante de Pago
            </h4>

            <div>
              <Label htmlFor="paymentRef">Número de Referencia <span className="text-red-500">*</span></Label>
              <Input
                id="paymentRef"
                placeholder="Ej: 123456 (Pago Móvil) o Hash de transacción"
                className="mt-1.5 font-mono"
                {...form.register("paymentRef")}
              />
              {form.formState.errors.paymentRef && <p className="text-xs text-red-500 mt-1">{form.formState.errors.paymentRef.message}</p>}
            </div>

            {/* Proof upload */}
            <div>
              <Label>Capture / Comprobante de Pago</Label>
              {proofPreview ? (
                <div className="mt-2 relative inline-block">
                  <img
                    src={proofPreview}
                    alt="Comprobante"
                    className="max-h-40 rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeProof}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 p-6 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Subir imagen del comprobante (JPG, PNG — máx 5 MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                </label>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Waiver ──────────────────────────────────────── */}
          <div className="space-y-2">
            <LiabilityWaiver
              eventTitle={event.title}
              eventDate={new Date(event.date).toLocaleDateString("es-VE", { dateStyle: "long" })}
              organizer={event.title}
              accepted={waiverAccepted}
              onAccept={(accepted) => {
                setWaiverAccepted(accepted);
                form.setValue("waiverAccepted", accepted);
              }}
            />
          </div>

          {/* ── Summary before submit ───────────────────────── */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-blue-800 text-sm">Resumen de Inscripción</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Evento:</strong> {event.title}</p>
              <p><strong>Atleta:</strong> {form.watch("nombres")} {form.watch("apellidos")} ({form.watch("cedula")})</p>
              <p><strong>Categoría:</strong> {selectedCategory?.name || "—"}</p>
              {includeShirt && <p><strong>Franela:</strong> {form.watch("shirtSize") || "—"}</p>}
              <p><strong>Método de pago:</strong> {PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label || "—"}</p>
              <p className="font-bold text-sm pt-1">Total: ${totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}
