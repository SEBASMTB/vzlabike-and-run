"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import {
  Monitor,
  Users,
  Wifi,
  Zap,
  Trophy,
  Medal,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Activity,
  Radio,
  MapPin,
  ChevronRight,
  Play,
  Timer,
  BarChart3,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RESULTS_URL = "https://vbr-results.vercel.app";

// ============================================================
// Animated Counter Hook
// ============================================================
function useAnimatedCounter(target: number, duration = 2000) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!mounted || hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mounted, target, duration]);

  return { count, ref, mounted };
}

// ============================================================
// Stat Card Component
// ============================================================
function StatCard({ icon, value, label, color, delay }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative bg-gradient-to-br ${color} rounded-2xl p-5 text-white overflow-hidden group`}
    >
      {/* Decorative glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
          <Activity className="size-4 text-white/60 animate-pulse" />
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-white/80 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// Live Pulse Dot
// ============================================================
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

export function PlatformSection() {
  return (
    <section id="resultados" className="relative py-20 md:py-28 bg-[#0B0D17] text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <LiveDot />
            <span className="text-xs font-medium text-white/80">Plataforma en Línea</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">VBRWorks</span>
            <span className="text-white/40 font-light ml-2">®</span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            La plataforma de cronometraje y resultados más avanzada de Venezuela.
            Resultados en tiempo real, estadísticas y clasificaciones instantáneas.
          </p>
        </motion.div>

        {/* Main Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mb-16"
        >
          {/* Glow behind */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-blue-500/20 rounded-3xl blur-2xl scale-95" />

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#111827]/90 backdrop-blur-xl shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0F1219] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white/5 rounded-lg px-4 py-1.5 text-xs text-white/40 flex items-center gap-2 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  vbr-results.vercel.app
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                  <ExternalLink className="size-3 text-white/30" />
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 md:p-8 bg-[#0B0D17]">
              {/* Dashboard header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="size-4 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white/90">Panel de Resultados en Vivo</h3>
                  </div>
                  <p className="text-xs text-white/40">Desafío a La Culata 2026 — MTB</p>
                </div>
                <div className="flex items-center gap-2">
                  <LiveDot />
                  <span className="text-xs font-medium text-green-400">EN VIVO</span>
                </div>
              </div>

              {/* Stat cards row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="size-4 text-blue-400" />
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Participantes</span>
                  </div>
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3" /> +89 este minuto
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="size-4 text-green-400" />
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Lecturas</span>
                  </div>
                  <p className="text-2xl font-bold text-white">99.9<span className="text-sm text-white/60">%</span></p>
                  <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3" /> Precisión total
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="size-4 text-orange-400" />
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Controles</span>
                  </div>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                    <Radio className="size-3" /> Todos activos
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4 text-purple-400" />
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Tiempo</span>
                  </div>
                  <p className="text-2xl font-bold text-white">02:34<span className="text-sm text-white/60">:17</span></p>
                  <p className="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
                    <Timer className="size-3" /> Cronómetro activo
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white/3 rounded-xl border border-white/5 overflow-hidden">
                {/* Table header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-red-400" />
                    <span className="text-xs font-semibold text-white/70">Clasificación General</span>
                  </div>
                  <span className="text-[10px] text-white/30">Máster A Varones (30-39)</span>
                </div>

                {/* Column headers */}
                <div className="flex items-center text-[10px] text-white/30 uppercase tracking-wider px-4 py-2 border-b border-white/5 bg-white/2">
                  <span className="w-10 text-center">#</span>
                  <span className="w-8"></span>
                  <span className="flex-1">Atleta</span>
                  <span className="w-10 text-center hidden sm:block">Cat.</span>
                  <span className="w-16 text-right">Tiempo</span>
                  <span className="w-14 text-right">Pace</span>
                  <span className="w-8 text-right">Diff</span>
                </div>

                {/* Athlete rows */}
                {[
                  { pos: 1, name: "Carlos Rodríguez", bib: "042", cat: "M-A", time: "32:15", pace: "4:35", diff: "—", color: "text-yellow-400", bg: "bg-yellow-400/5" },
                  { pos: 2, name: "Miguel Torres", bib: "108", cat: "M-A", time: "33:42", pace: "4:48", diff: "+1:27", color: "text-gray-300", bg: "" },
                  { pos: 3, name: "José Martínez", bib: "073", cat: "M-A", time: "34:08", pace: "4:54", diff: "+1:53", color: "text-amber-600", bg: "" },
                  { pos: 4, name: "Antonio Fuentes", bib: "215", cat: "M-A", time: "35:22", pace: "5:03", diff: "+3:07", color: "text-white/50", bg: "" },
                  { pos: 5, name: "Roberto Sánchez", bib: "189", cat: "M-A", time: "36:01", pace: "5:08", diff: "+3:46", color: "text-white/50", bg: "" },
                ].map((row) => (
                  <div
                    key={row.pos}
                    className={`flex items-center px-4 py-2.5 text-sm border-b border-white/3 last:border-0 hover:bg-white/5 transition-colors ${row.bg}`}
                  >
                    <span className={`w-10 text-center font-bold text-sm ${row.color}`}>
                      {row.pos}
                    </span>
                    <span className="w-8 text-[10px] font-mono text-white/30 text-center">
                      {row.bib}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-white/90 font-medium text-sm">{row.name}</span>
                    </div>
                    <span className="w-10 text-center hidden sm:block">
                      <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/40">
                        {row.cat}
                      </span>
                    </span>
                    <span className="w-16 text-right font-mono text-white/80 font-semibold text-sm">
                      {row.time}
                    </span>
                    <span className="w-14 text-right font-mono text-white/40 text-xs">
                      {row.pace}
                    </span>
                    <span className={`w-8 text-right text-xs ${row.pos === 1 ? "text-yellow-400" : "text-white/30"}`}>
                      {row.diff}
                    </span>
                  </div>
                ))}

                {/* More results indicator */}
                <div className="flex items-center justify-center py-2 border-t border-white/5">
                  <span className="text-[10px] text-white/30">
                    Mostrando 5 de 127 resultados
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { icon: <Radio className="size-5" />, label: "Cronometraje Profesional", desc: "Sistema RFID de alta precisión", color: "from-green-500/20 to-emerald-500/20 border-green-500/20" },
            { icon: <Zap className="size-5" />, label: "Resultados en Vivo", desc: "Publicación instantánea al cruce", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/20" },
            { icon: <BarChart3 className="size-5" />, label: "Estadísticas Detalladas", desc: "Tiempos parciales, pace y más", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/20" },
            { icon: <Smartphone className="size-5" />, label: "Acceso Móvil", desc: "Consulta desde cualquier dispositivo", color: "from-purple-500/20 to-violet-500/20 border-purple-500/20" },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`bg-gradient-to-br ${f.color} rounded-2xl p-5 border backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="text-white/80 mb-3 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white/90 mb-1">{f.label}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={RESULTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 text-base"
          >
            <Play className="size-4" />
            Ver Plataforma de Resultados
          </a>
          <a
            href="/resultados"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-300 text-sm"
          >
            Abrir en pantalla completa
            <ExternalLink className="size-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
