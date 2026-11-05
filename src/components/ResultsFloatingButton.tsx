"use client";

import { useState } from "react";
import { BarChart3, X, ExternalLink, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RESULTS_URL = "https://vbr-results.vercel.app";

export function ResultsFloatingButton() {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-[5.5rem] z-50 flex flex-col items-end gap-3">
      {/* Tooltip Card */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-[#111827] rounded-xl shadow-2xl border border-white/10 p-4 max-w-[280px]"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                  <Trophy className="size-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    VBRWorks<span className="text-white/30 font-light text-xs">®</span>
                  </p>
                  <p className="text-[11px] text-green-400 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    Plataforma activa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTooltip(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-3">
              Consulta clasificaciones, tiempos oficiales y estadísticas detalladas de todos los eventos.
            </p>
            <a
              href={RESULTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
            >
              <BarChart3 className="size-4" />
              Consultar Resultados
              <ExternalLink className="size-3" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.5 }}
        onClick={() => setTooltip(!tooltip)}
        className="relative w-14 h-14 bg-gradient-to-br from-[#111827] to-[#0B0D17] hover:from-[#1a1d2e] hover:to-[#111827] border border-white/10 hover:border-red-500/30 rounded-full flex items-center justify-center shadow-lg shadow-black/20 transition-all duration-300 group"
        aria-label="Ver Plataforma de Resultados"
      >
        <BarChart3 className="size-6 text-red-400 group-hover:text-red-300 transition-colors" />

        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />

        {/* Notification badge */}
        {!tooltip && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B0D17] flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
