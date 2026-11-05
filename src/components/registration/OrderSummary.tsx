"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  User,
  Trophy,
  Shirt,
  DollarSign,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface OrderSummaryProps {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  sportType: string;
  participantName: string;
  categoryName: string | null;
  shirtSize: string | null;
  subtotalUSD: number;
  shirtExtraUSD: number;
  totalUSD: number;
  bcvRate: number | null;
  bcvRateSource: string | null;
  totalBs: number | null;
  paymentMethodLabel: string | null;
  currentStep: number;
  totalSteps: number;
}

interface SummaryRowProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
}

function SummaryRow({ icon: Icon, label, value, hint }: SummaryRowProps) {
  const isEmpty = value === null || value === undefined || value === "" || value === "—";
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
          isEmpty ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600"
        }`}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p
          className={`truncate text-sm font-semibold ${
            isEmpty ? "text-gray-400" : "text-gray-800"
          }`}
        >
          {isEmpty ? "Sin seleccionar" : value}
        </p>
        {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}

export function OrderSummary({
  eventName,
  eventDate,
  eventLocation,
  sportType,
  participantName,
  categoryName,
  shirtSize,
  subtotalUSD,
  shirtExtraUSD,
  totalUSD,
  bcvRate,
  bcvRateSource,
  totalBs,
  paymentMethodLabel,
  currentStep,
  totalSteps,
}: OrderSummaryProps) {
  const formattedDate = useMemo(() => {
    if (!eventDate) return "—";
    try {
      return new Date(eventDate).toLocaleDateString("es-VE", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return eventDate;
    }
  }, [eventDate]);

  const formattedSubtotal = useMemo(
    () => `$${subtotalUSD.toFixed(2)} USD`,
    [subtotalUSD]
  );
  const formattedShirt = useMemo(
    () => (shirtExtraUSD > 0 ? `+$${shirtExtraUSD.toFixed(2)} USD` : "—"),
    [shirtExtraUSD]
  );
  const formattedTotalUSD = useMemo(
    () => `$${totalUSD.toFixed(2)} USD`,
    [totalUSD]
  );
  const formattedTotalBs = useMemo(() => {
    if (totalBs === null || totalBs === undefined) return null;
    return `Bs. ${totalBs.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [totalBs]);

  const formattedRate = useMemo(() => {
    if (bcvRate === null || bcvRate === undefined) return null;
    return `1 USD = Bs. ${bcvRate.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [bcvRate]);

  return (
    <div className="lg:sticky lg:top-6">
      <Card className="overflow-hidden border-gray-200 bg-white p-0 shadow-lg">
        {/* Header */}
        <div className="gradient-primary px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <Wallet className="size-4" />
              Resumen
            </h3>
            <Badge className="border-white/30 bg-white/20 text-white">
              Paso {currentStep} de {totalSteps}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-white/80">
            Tu inscripción se actualiza en tiempo real
          </p>
        </div>

        {/* Event title */}
        <div className="bg-gray-50 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
            Evento
          </p>
          <h4 className="mt-1 text-base font-bold leading-snug text-gray-900">
            {eventName}
          </h4>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {eventLocation || "Por confirmar"}
            </span>
          </div>
          {sportType && (
            <Badge
              variant="outline"
              className="mt-2 border-red-200 bg-red-50 text-[10px] text-red-700"
            >
              {sportType.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-3">
          <SummaryRow
            icon={User}
            label="Participante"
            value={participantName || null}
          />
          <SummaryRow
            icon={Trophy}
            label="Categoría"
            value={categoryName || null}
          />
          <SummaryRow
            icon={Shirt}
            label="Talla de franela"
            value={shirtSize || null}
          />
        </div>

        <Separator className="bg-gray-200" />

        {/* Pricing */}
        <div className="space-y-2 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <DollarSign className="size-3.5" /> Subtotal
            </span>
            <span className="font-medium text-gray-700">
              {formattedSubtotal}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Shirt className="size-3.5" /> Franela
            </span>
            <span
              className={`font-medium ${
                shirtExtraUSD > 0 ? "text-gray-700" : "text-gray-300"
              }`}
            >
              {formattedShirt}
            </span>
          </div>

          {/* BCV rate */}
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
              <TrendingUp className="size-3.5" />
              Tasa BCV
            </div>
            <p className="mt-0.5 text-xs text-amber-800">
              {formattedRate ?? "Cargando tasa…"}
            </p>
            {bcvRateSource && (
              <p className="text-[10px] text-amber-600/80">{bcvRateSource}</p>
            )}
          </div>

          <Separator className="my-2 bg-gray-200" />

          {/* Total USD */}
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold text-gray-600">
              Total USD
            </span>
            <span className="text-lg font-extrabold text-red-600">
              {formattedTotalUSD}
            </span>
          </div>

          {/* Total Bs */}
          <AnimatePresence mode="wait">
            {formattedTotalBs && (
              <motion.div
                key={formattedTotalBs}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-end justify-between rounded-md bg-gray-900 px-3 py-2"
              >
                <span className="text-xs font-medium text-gray-300">
                  Total Bolívares
                </span>
                <span className="text-base font-bold text-white">
                  {formattedTotalBs}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="bg-gray-200" />

        {/* Payment method */}
        <div className="px-5 py-3">
          <SummaryRow
            icon={Wallet}
            label="Método de pago"
            value={paymentMethodLabel || null}
          />
        </div>

        {/* Footer note */}
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
            <Info className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
            <p>
              Los precios y la conversión a bolívares se calculan con la tasa
              oficial del BCV. El estado de la inscripción quedará{" "}
              <span className="font-semibold text-amber-700">PENDIENTE</span>{" "}
              hasta que el organizador valide tu comprobante de pago.
            </p>
          </div>
        </div>

        {/* Completed badge if all set */}
        {currentStep === totalSteps &&
          participantName &&
          categoryName &&
          paymentMethodLabel && (
            <div className="flex items-center justify-center gap-1.5 border-t border-green-100 bg-green-50 py-2 text-[11px] font-medium text-green-700">
              <CheckCircle2 className="size-3.5" />
              Listo para finalizar
            </div>
          )}
      </Card>
    </div>
  );
}

export default OrderSummary;
