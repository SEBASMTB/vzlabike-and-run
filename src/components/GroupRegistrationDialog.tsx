"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LiabilityWaiver } from "./LiabilityWaiver";
import { calculateAge, parseEventCategories, assignCategoryFromList, getMTBCategoryOptions } from "@/lib/categories";
import type { EventCardProps } from "./EventCard";
import {
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  Copy,
  FileText,
  Phone,
  Mail,
  Trash2,
  Search,
  Sparkles,
  User,
  Shield,
  Trophy,
  Heart,
  Clock,
} from "lucide-react";

// ─── Types & Constants ───────────────────────────────────────────────────────

type PaymentMethod = "binance" | "zelle" | "pagomovil" | "transferencia";

const paymentMethods: {
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
    instructions:
      "Abre Binance, selecciona Enviar/Pagar por ID (816555002) y envía el monto exacto en USDT. Guarda el hash de la transacción como referencia.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
  },
  {
    id: "zelle",
    label: "Zelle",
    icon: CreditCard,
    description: "Pago rápido desde EE.UU.",
    wallet: "venezuelabikeandrun@gmail.com - A nombre de: KARLA QUINTERO",
    instructions:
      "Envía el pago vía Zelle al correo indicado a nombre de KARLA QUINTERO. Recibirás confirmación en minutos.",
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
    instructions:
      "Realiza el Pago Móvil al teléfono 0412-016-2685 con CI V-9479255. Guarda el número de referencia de 6 dígitos.",
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
    instructions:
      "Escríbenos al WhatsApp para recibir los datos de la cuenta bancaria y realizar tu transferencia. Envía foto del comprobante.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
];

const MAX_PARTICIPANTS = 10;
const MIN_PARTICIPANTS = 2;

interface Participant {
  id: string; // unique client-side ID
  firstName: string;
  lastName: string;
  idNumber: string;
  gender: string;
  dateOfBirth: string;
  shirtSize: string;
  category: string;
  profile: string; // "competitivo" or "recreativo" (empty until selected, for MTB)
  autoFilled: boolean;
  lookingUp: boolean;
}

const responsibleSchema = z.object({
  email: z.email("Ingresa un email válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
});

type ResponsibleInfo = z.infer<typeof responsibleSchema>;

const emergencySchema = z.object({
  emergencyContact: z.string().min(2, "Ingresa un nombre de contacto"),
  emergencyPhone: z.string().min(7, "Ingresa un teléfono válido"),
});

type EmergencyInfo = z.infer<typeof emergencySchema>;

const groupSteps = [
  { label: "Responsable", icon: Shield },
  { label: "Participantes", icon: Users },
  { label: "Emergencia", icon: FileText },
  { label: "Pago", icon: CreditCard },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface GroupRegistrationDialogProps {
  event: EventCardProps | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData?: {
    organizer?: string;
  };
}

function createEmptyParticipant(): Participant {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    idNumber: "",
    gender: "",
    dateOfBirth: "",
    shirtSize: "",
    category: "",
    profile: "",
    autoFilled: false,
    lookingUp: false,
  };
}

export function GroupRegistrationDialog({
  event,
  open,
  onOpenChange,
  eventData,
}: GroupRegistrationDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null
  );
  const [paymentRef, setPaymentRef] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([
    createEmptyParticipant(),
    createEmptyParticipant(),
  ]);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    count: number;
    payLabel: string;
    registrations: Array<{ bibNumber: number; firstName: string; lastName: string }>;
  } | null>(null);
  const { toast } = useToast();

  const responsibleForm = useForm<ResponsibleInfo>({
    resolver: zodResolver(responsibleSchema),
    defaultValues: { email: "", phone: "" },
  });

  const emergencyForm = useForm<EmergencyInfo>({
    resolver: zodResolver(emergencySchema),
    defaultValues: { emergencyContact: "", emergencyPhone: "" },
  });

  // ─── Reset ──────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setCurrentStep(0);
    setSelectedPayment(null);
    setPaymentRef("");
    setWaiverAccepted(false);
    responsibleForm.reset();
    emergencyForm.reset();
    setParticipants([createEmptyParticipant(), createEmptyParticipant()]);
    setRegistrationSuccess(null);
  }, [responsibleForm, emergencyForm]);

  const handleClose = useCallback(
    (val: boolean) => {
      if (!val) resetAll();
      onOpenChange(val);
    },
    [resetAll, onOpenChange]
  );

  // ─── Lookup cédula ─────────────────────────────────────────────────────
  const handleLookup = useCallback(
    async (participantId: string) => {
      const participant = participants.find((p) => p.id === participantId);
      if (!participant || !participant.idNumber.trim()) return;

      const cedula = participant.idNumber.trim().toUpperCase();
      if (cedula.length < 5) return;

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, lookingUp: true } : p
        )
      );

      try {
        const res = await fetch(
          `/api/registrations/lookup?id=${encodeURIComponent(cedula)}`
        );
        const data = await res.json();

        if (data.found) {
          // Obtener categorías del evento y calcular categoría
          let category = "";
          if (data.dateOfBirth && data.gender) {
            const age = calculateAge(
              data.dateOfBirth,
              event?.date || "",
              event?.ageCalcMode || "calendar_year"
            );
            const sportType = event?.sportType || "running";
            const eventCats = parseEventCategories(event?.categories, sportType);
            const assigned = assignCategoryFromList(age, eventCats, data.gender);
            category = assigned ? `${assigned.value} - ${assigned.label}` : "";
          }

          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? {
                    ...p,
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    gender: data.gender || "",
                    dateOfBirth: data.dateOfBirth || "",
                    shirtSize: data.shirtSize || "",
                    category,
                    autoFilled: true,
                    lookingUp: false,
                  }
                : p
            )
          );
        } else {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId ? { ...p, lookingUp: false } : p
            )
          );
        }
      } catch {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, lookingUp: false } : p
          )
        );
      }
    },
    [participants, event?.date, event?.ageCalcMode, event?.sportType, event?.categories]
  );

  // ─── Update participant field ──────────────────────────────────────────
  const updateParticipant = useCallback(
    (participantId: string, field: keyof Participant, value: string) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== participantId) return p;

          const updated = { ...p, [field]: value };

          // Recalculate category when DOB, gender, or profile changes
          if (field === "dateOfBirth" || field === "gender" || field === "profile") {
            if (updated.dateOfBirth && updated.gender) {
              const age = calculateAge(updated.dateOfBirth, event?.date || "", event?.ageCalcMode || "calendar_year");
              const sportType = event?.sportType || "running";
              const eventCats = parseEventCategories(event?.categories, sportType);

              if (sportType === "mtb") {
                const mtbOpts = getMTBCategoryOptions(age, eventCats, updated.gender);
                updated.category = `${mtbOpts.suggested.value} - ${mtbOpts.suggested.label}`;
              } else {
                const assigned = assignCategoryFromList(age, eventCats, updated.gender);
                updated.category = assigned ? `${assigned.value} - ${assigned.label}` : "";
              }
            } else {
              updated.category = "";
            }
          }

          return updated;
        })
      );
    },
    [event?.date, event?.ageCalcMode, event?.sportType, event?.categories]
  );

  // ─── Add / Remove participant ──────────────────────────────────────────
  const addParticipant = useCallback(() => {
    if (participants.length >= MAX_PARTICIPANTS) {
      toast({
        title: "Máximo alcanzado",
        description: `No puedes agregar más de ${MAX_PARTICIPANTS} participantes.`,
        variant: "destructive",
      });
      return;
    }
    setParticipants((prev) => [...prev, createEmptyParticipant()]);
  }, [participants.length, toast]);

  const removeParticipant = useCallback(
    (participantId: string) => {
      if (participants.length <= MIN_PARTICIPANTS) {
        toast({
          title: "Mínimo requerido",
          description: `El grupo debe tener al menos ${MIN_PARTICIPANTS} participantes.`,
          variant: "destructive",
        });
        return;
      }
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    },
    [participants.length, toast]
  );

  // ─── Validation helpers ────────────────────────────────────────────────
  const validateParticipants = useCallback((): boolean => {
    for (const p of participants) {
      if (!p.firstName.trim()) {
        toast({
          title: "Datos incompletos",
          description: `El participante con cédula ${p.idNumber || "sin cédula"} necesita un nombre.`,
          variant: "destructive",
        });
        return false;
      }
      if (!p.lastName.trim()) {
        toast({
          title: "Datos incompletos",
          description: `El participante ${p.firstName} necesita un apellido.`,
          variant: "destructive",
        });
        return false;
      }
      if (!p.idNumber.trim()) {
        toast({
          title: "Datos incompletos",
          description: `El participante ${p.firstName} ${p.lastName} necesita una cédula.`,
          variant: "destructive",
        });
        return false;
      }
      if (!p.dateOfBirth) {
        toast({
          title: "Datos incompletos",
          description: `El participante ${p.firstName} ${p.lastName} necesita fecha de nacimiento.`,
          variant: "destructive",
        });
        return false;
      }
      if (!p.gender) {
        toast({
          title: "Datos incompletos",
          description: `El participante ${p.firstName} ${p.lastName} necesita género seleccionado.`,
          variant: "destructive",
        });
        return false;
      }
      if (!p.category) {
        const isMTB = event?.sportType === "mtb";
        if (isMTB && !p.profile) {
          toast({
            title: "Modalidad no seleccionada",
            description: `${p.firstName} ${p.lastName} necesita seleccionar Competitivo o Recreativo.`,
            variant: "destructive",
          });
          return false;
        }
        toast({
          title: "Sin categoría",
          description: `No se pudo asignar categoría para ${p.firstName} ${p.lastName}. Verifica fecha de nacimiento y género.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Check for duplicate cédulas
    const idNumbers = participants.map((p) => p.idNumber.toUpperCase().trim());
    const seen = new Set<string>();
    for (const id of idNumbers) {
      if (seen.has(id)) {
        toast({
          title: "Cédula duplicada",
          description: `La cédula ${id} aparece más de una vez en el grupo.`,
          variant: "destructive",
        });
        return false;
      }
      seen.add(id);
    }

    return true;
  }, [participants, toast]);

  // ─── Navigation ────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      responsibleForm.trigger().then((valid) => {
        if (valid) setCurrentStep(1);
      });
    } else if (currentStep === 1) {
      if (validateParticipants()) setCurrentStep(2);
    } else if (currentStep === 2) {
      emergencyForm.trigger().then((valid) => {
        if (valid && waiverAccepted) setCurrentStep(3);
        else if (!waiverAccepted) {
          toast({
            title: "Debes aceptar la liberación de responsabilidad",
            description:
              "Lee la declaración y marca la casilla de aceptación para continuar.",
            variant: "destructive",
          });
        }
      });
    }
  }, [currentStep, responsibleForm, emergencyForm, waiverAccepted, validateParticipants, toast]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  // ─── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!event?.slug || !selectedPayment) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${event.slug}/register-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: participants.map((p) => ({
            firstName: p.firstName,
            lastName: p.lastName,
            idNumber: p.idNumber.toUpperCase().trim(),
            gender: p.gender,
            dateOfBirth: p.dateOfBirth,
            shirtSize: p.shirtSize,
            category: p.category,
            mtbProfile: event?.sportType === "mtb" ? p.profile : undefined,
          })),
          email: responsibleForm.getValues().email,
          phone: responsibleForm.getValues().phone,
          emergencyContact: emergencyForm.getValues().emergencyContact,
          emergencyPhone: emergencyForm.getValues().emergencyPhone,
          paymentMethod: selectedPayment,
          paymentRef: paymentRef,
          waiverAccepted: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const payLabel = paymentMethods.find((p) => p.id === selectedPayment)
          ?.label || "pago";
        setRegistrationSuccess({
          count: data.count,
          payLabel,
          registrations: data.registrations || [],
        });
      } else {
        toast({
          title: "Error en la inscripción grupal",
          description: data.error || "Ocurrió un error al procesar la inscripción.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    event,
    selectedPayment,
    participants,
    responsibleForm,
    emergencyForm,
    paymentRef,
    toast,
    handleClose,
  ]);

  // ─── Helpers ───────────────────────────────────────────────────────────
  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copiado", description: "Se copió al portapapeles." });
      });
    },
    [toast]
  );

  const currentPayment = paymentMethods.find((p) => p.id === selectedPayment);
  const totalPrice = (event?.price ?? 0) * participants.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-red-500" />
            Inscripción Grupal - {event?.title}
          </DialogTitle>
          <DialogDescription>
            {event?.distance} • {event?.location} •{" "}
            <Badge variant="secondary" className="ml-1">
              {participants.length} participante{participants.length !== 1 ? "s" : ""}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Success Screen */}
        {registrationSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-5"
          >
            {/* Big animated check icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200"
            >
              <CheckCircle2 className="size-14 text-white" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-extrabold text-foreground">
                Pre-inscripcion Grupal en Proceso
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {event?.title} - {registrationSuccess.count} participantes
              </p>
            </motion.div>

            {/* Bib Numbers */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4 space-y-2"
            >
              <p className="text-sm font-medium text-green-700">Dorsales asignados:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {registrationSuccess.registrations.map(
                  (r: { bibNumber: number; firstName: string; lastName: string }, i: number) => (
                    <div key={i} className="bg-white border border-green-200 rounded-lg px-3 py-2">
                      <span className="text-2xl font-black text-green-700">#{r.bibNumber}</span>
                      <p className="text-[10px] text-green-600">{r.firstName} {r.lastName}</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>

            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {/* Step 1: Payment */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-amber-800">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Confirma tu pago
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Completa el pago total con <strong>{registrationSuccess.payLabel}</strong> y envia tu comprobante por WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Confirmation email */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-blue-800" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">
                      Recibiran un correo de confirmacion
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Se enviara un correo electronico con los detalles de la pre-inscripcion grupal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment confirmation email */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-emerald-800" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Confirmacion de pago
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Una vez confirmado el pago, en un lapso de <strong>24 a 48 horas</strong> recibiran otro correo con la confirmacion definitiva de la inscripcion de todos los participantes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <Button
              size="lg"
              className="gradient-primary text-white border-0 w-full text-base font-bold py-6 shadow-lg"
              onClick={() => handleClose(false)}
            >
              Entendido
            </Button>
          </motion.div>
        )}

        {!registrationSuccess && (
        <>
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {groupSteps.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <div key={step.label} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 cursor-pointer ${
                    i <= currentStep
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    if (i < currentStep) setCurrentStep(i);
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      i < currentStep
                        ? "bg-green-500 text-white"
                        : i === currentStep
                        ? "gradient-primary text-white"
                        : "bg-gray-200 text-muted-foreground"
                    }`}
                  >
                    {i < currentStep ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <StepIcon className="size-4" />
                    )}
                  </div>
                  <span className="text-xs hidden sm:inline">{step.label}</span>
                </div>
                {i < groupSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      i < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Responsable Info */}
          {currentStep === 0 && (
            <motion.div
              key="group-step-responsible"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-red-800">
                      Datos del Responsable del Grupo
                    </h4>
                    <p className="text-xs text-red-700 mt-1">
                      Este email y teléfono se usarán para contactar al grupo
                      sobre el evento, cambios y notificaciones. Todos los
                      participantes compartirán estos datos de contacto.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group-email" className="flex items-center gap-2">
                    <Mail className="size-4" /> Email del Responsable *
                  </Label>
                  <Input
                    id="group-email"
                    type="email"
                    placeholder="responsable@email.com"
                    {...responsibleForm.register("email")}
                  />
                  {responsibleForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {responsibleForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-phone" className="flex items-center gap-2">
                    <Phone className="size-4" /> Teléfono del Responsable *
                  </Label>
                  <Input
                    id="group-phone"
                    type="tel"
                    placeholder="+58 412-016-2685"
                    {...responsibleForm.register("phone")}
                  />
                  {responsibleForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {responsibleForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{event?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event?.distance} • {event?.location}
                    </p>
                  </div>
                  <Badge className="gradient-primary text-white border-0">
                    ${event?.price} USD c/u
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Participants */}
          {currentStep === 1 && (
            <motion.div
              key="group-step-participants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Participantes ({participants.length}/{MAX_PARTICIPANTS})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParticipant}
                  disabled={participants.length >= MAX_PARTICIPANTS}
                  className="gap-1"
                >
                  <UserPlus className="size-4" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl p-4 bg-card space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-red-500" />
                        <span className="text-sm font-semibold">
                          Participante {index + 1}
                        </span>
                        {participant.category && (
                          <Badge variant="secondary" className="text-xs">
                            {(participant.category || "").includes(" - ") ? participant.category.split(" - ").pop() : participant.category || "Sin categoría"}
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.id)}
                        disabled={participants.length <= MIN_PARTICIPANTS}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Cédula (first field with auto-lookup) */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-xs">
                        Cédula de Identidad *
                        {participant.lookingUp && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                        {participant.autoFilled && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600 font-normal">
                            <Sparkles className="size-3" /> Auto
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder="V-12345678"
                          value={participant.idNumber}
                          onChange={(e) =>
                            updateParticipant(
                              participant.id,
                              "idNumber",
                              e.target.value
                            )
                          }
                          onBlur={() => handleLookup(participant.id)}
                          className={
                            participant.autoFilled
                              ? "border-green-400 bg-green-50/50 pr-9"
                              : "pr-9"
                          }
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      {participant.autoFilled && (
                        <p className="text-[10px] text-green-600">
                          Datos cargados. Verifica y corrige si es necesario.
                        </p>
                      )}
                    </div>

                    {/* Name + Lastname */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre *</Label>
                        <Input
                          placeholder="Juan"
                          value={participant.firstName}
                          onChange={(e) =>
                            updateParticipant(
                              participant.id,
                              "firstName",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Apellido *</Label>
                        <Input
                          placeholder="Pérez"
                          value={participant.lastName}
                          onChange={(e) =>
                            updateParticipant(
                              participant.id,
                              "lastName",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* DOB + Gender */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha de Nacimiento *</Label>
                        <Input
                          type="date"
                          value={participant.dateOfBirth}
                          onChange={(e) =>
                            updateParticipant(
                              participant.id,
                              "dateOfBirth",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Género *</Label>
                        <Select
                          value={participant.gender}
                          onValueChange={(val) =>
                            updateParticipant(participant.id, "gender", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Shirt Size - only if event has shirt */}
                    {event?.hasShirt !== false && (
                    <div className="space-y-1">
                      <Label className="text-xs">Talla de Camiseta</Label>
                      <Select
                        value={participant.shirtSize}
                        onValueChange={(val) =>
                          updateParticipant(participant.id, "shirtSize", val)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar talla" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    )}

                    {/* MTB Profile Selector (only for MTB events) */}
                    {event?.sportType === "mtb" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Modalidad *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateParticipant(participant.id, "profile", "competitivo")}
                            className={`p-2 rounded-lg border-2 text-center transition-all text-xs ${
                              participant.profile === "competitivo"
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Trophy className="size-4 mx-auto mb-0.5" />
                            <span className="font-bold">Competitivo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateParticipant(participant.id, "profile", "recreativo")}
                            className={`p-2 rounded-lg border-2 text-center transition-all text-xs ${
                              participant.profile === "recreativo"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Heart className="size-4 mx-auto mb-0.5" />
                            <span className="font-bold">Recreativo</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Category (auto-assigned, read-only or selectable for recreativo) */}
                    {participant.category ? (
                      <div className="bg-muted/50 rounded-md p-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {(participant.category || "").includes(" - ") ? participant.category.split(" - ").pop() : participant.category || "Sin categoría"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {event?.sportType === "mtb" ? `Categoría ${participant.profile || ""}` : "Categoría asignada automáticamente según edad y género"}
                        </span>
                      </div>
                    ) : event?.sportType === "mtb" && participant.dateOfBirth && participant.gender && !participant.profile ? (
                      <div className="bg-amber-50 rounded-md p-2 border border-amber-200">
                        <p className="text-[10px] text-amber-700">
                          Selecciona modalidad para ver las categorías disponibles.
                        </p>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Emergency Contact + Liability Waiver */}
          {currentStep === 2 && (
            <motion.div
              key="group-step-emergency"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Phone className="size-4 text-red-500" />
                  Contacto de Emergencia (aplica para todos)
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-emergency-name">
                    Nombre del Contacto *
                  </Label>
                  <Input
                    id="group-emergency-name"
                    placeholder="María Pérez"
                    {...emergencyForm.register("emergencyContact")}
                  />
                  {emergencyForm.formState.errors.emergencyContact && (
                    <p className="text-sm text-destructive">
                      {emergencyForm.formState.errors.emergencyContact.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-emergency-phone">
                    Teléfono de Emergencia *
                  </Label>
                  <Input
                    id="group-emergency-phone"
                    type="tel"
                    placeholder="+58 414-016-2685"
                    {...emergencyForm.register("emergencyPhone")}
                  />
                  {emergencyForm.formState.errors.emergencyPhone && (
                    <p className="text-sm text-destructive">
                      {emergencyForm.formState.errors.emergencyPhone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t" />

              {/* Participants summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2">
                  Participantes del grupo:
                </p>
                <div className="space-y-1">
                  {participants.map((p, i) => (
                    <p key={p.id} className="text-xs text-muted-foreground">
                      {i + 1}. {p.firstName} {p.lastName} ({p.idNumber}) —{" "}
                      {(p.category || "").includes(" - ") ? p.category.split(" - ").pop() : p.category || "Sin categoría"}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t" />

              <LiabilityWaiver
                eventTitle={event?.title || ""}
                eventDate={event?.date || ""}
                organizer={eventData?.organizer || "VzlaBike and Run®"}
                accepted={waiverAccepted}
                onAccept={setWaiverAccepted}
              />
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <motion.div
              key="group-step-payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Total to pay */}
              <div className="gradient-primary rounded-lg p-4 text-white text-center">
                <p className="text-sm opacity-90">Monto total a pagar</p>
                <p className="text-3xl font-bold">${totalPrice.toFixed(0)} USD</p>
                <p className="text-sm opacity-80">
                  {participants.length} participante
                  {participants.length !== 1 ? "s" : ""} × ${event?.price} USD
                </p>
              </div>

              {/* Payment method selection */}
              <p className="text-sm font-medium text-foreground">
                Selecciona tu método de pago:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPayment(pm.id)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedPayment === pm.id
                          ? `${pm.bg} ${pm.border} ${pm.color} shadow-md`
                          : "bg-white border-gray-200 hover:border-gray-300 text-foreground"
                      }`}
                    >
                      {selectedPayment === pm.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="size-4 text-white" />
                        </div>
                      )}
                      <Icon className="size-8" />
                      <span className="text-xs font-bold">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment details */}
              {currentPayment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${currentPayment.bg} border ${currentPayment.border} rounded-lg p-4`}
                >
                  <h4
                    className={`font-semibold text-sm mb-2 ${currentPayment.color}`}
                  >
                    Datos para pagar con {currentPayment.label}
                  </h4>
                  <div className="flex items-center gap-2 bg-white rounded-md p-3 mb-2">
                    <code className="text-xs flex-1 break-all text-foreground">
                      {currentPayment.wallet}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPayment.wallet)}
                      className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Copy className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentPayment.instructions}
                  </p>
                </motion.div>
              )}

              {/* Payment reference */}
              <div className="space-y-2">
                <Label htmlFor="group-payment-ref">
                  Número de referencia / Comprobante
                </Label>
                <Input
                  id="group-payment-ref"
                  placeholder="Ej: 000012345678"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el número de referencia de tu pago para agilizar la
                  confirmación.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-red-800">
                  Resumen de Inscripción Grupal
                </h4>
                <div className="space-y-1 text-sm text-red-700">
                  <p>
                    <strong>Evento:</strong> {event?.title}
                  </p>
                  <p>
                    <strong>Participantes:</strong> {participants.length}
                  </p>
                  <p>
                    <strong>Responsable:</strong>{" "}
                    {responsibleForm.getValues().email}
                  </p>
                  <p>
                    <strong>Pago:</strong> ${totalPrice.toFixed(0)} USD via{" "}
                    {currentPayment?.label}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="size-4 mr-2" />
            Anterior
          </Button>
          {currentStep < 3 ? (
            <Button
              className="gradient-primary text-white border-0"
              onClick={handleNext}
            >
              Siguiente
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="gradient-primary text-white border-0"
              onClick={handleSubmit}
              disabled={submitting || !selectedPayment}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Confirmar Inscripción ({participants.length})
                </>
              )}
            </Button>
          )}
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
