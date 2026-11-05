"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  BarChart3,
  Radio,
  Zap,
  Trophy,
  Users,
  Clock,
  Monitor,
  Smartphone,
  ChevronRight,
  Activity,
} from "lucide-react";

const RESULTS_URL = "https://vbr-results.vercel.app";

const features = [
  { icon: <Radio className="size-5" />, label: "Cronometraje RFID" },
  { icon: <Zap className="size-5" />, label: "Resultados en Vivo" },
  { icon: <BarChart3 className="size-5" />, label: "Estadísticas" },
  { icon: <Users className="size-5" />, label: "Clasificaciones" },
];

export default function ResultadosPage() {
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Auto-hide intro after iframe loads
    if (!loading) {
      const timer = setTimeout(() => setShowIntro(false), 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D17]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0D17]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <a
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Volver a VzlaBike and Run</span>
            <span className="sm:hidden">Volver</span>
          </a>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Monitor className="size-4 text-red-400" />
              <span className="text-white font-semibold text-sm tracking-wide">
                VBRWorks<span className="text-white/40 font-light">®</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <Activity className="size-3 text-green-400 animate-pulse" />
              <span className="text-[10px] font-medium text-green-400">EN LÍNEA</span>
            </div>
          </div>

          <a
            href={RESULTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Abrir en nueva pestaña</span>
          </a>
        </div>
      </div>

      {/* Intro banner — shows while loading, fades out after */}
      {showIntro && (
        <div className={`relative transition-all duration-700 ${loading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="bg-gradient-to-br from-[#111827] to-[#0B0D17] border-b border-white/5">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
                  <Trophy className="size-4 text-red-400" />
                  <span className="text-xs font-medium text-red-300">Plataforma de Resultados</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                  Consulta tus <span className="text-gradient">Resultados</span>
                </h1>
                <p className="text-sm text-white/50 max-w-lg mx-auto mb-8 leading-relaxed">
                  Accede a clasificaciones, tiempos parciales, estadísticas detalladas
                  y resultados en tiempo real de todos nuestros eventos.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {features.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white/60 text-xs"
                    >
                      <span className="text-white/40">{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>

                {/* Loading spinner */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  <p className="text-xs text-white/30">Cargando plataforma...</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={RESULTS_URL}
        className="flex-1 w-full border-0 bg-white"
        style={{ minHeight: "calc(100vh - 56px)" }}
        onLoad={() => setLoading(false)}
        title="Plataforma de Resultados VBRWorks"
      />
    </div>
  );
}
