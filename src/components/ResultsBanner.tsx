"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ExternalLink, X } from "lucide-react";

const RESULTS_URL = "https://vbr-results.vercel.app";

export function ResultsBanner() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden z-50 transition-shadow duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        {/* Dark gradient background */}
        <div className="bg-gradient-to-r from-[#0B0D17] via-[#111827] to-[#0B0D17] border-b border-white/10">
          {/* Subtle scanning line animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-red-500/5 to-transparent"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3 py-2.5 sm:py-3 relative">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-green-400 tracking-wide uppercase hidden sm:inline">
                En Vivo
              </span>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-white/10" />

            {/* Message */}
            <p className="text-xs sm:text-sm text-white/70 flex items-center gap-2">
              <BarChart3 className="size-3.5 text-red-400" />
              <span>
                Plataforma de Resultados{" "}
                <span className="text-white font-semibold">VBRWorks</span>
                <span className="text-white/30 font-light">®</span>{" "}
                activa
              </span>
            </p>

            {/* Separator */}
            <div className="w-px h-4 bg-white/10 hidden sm:block" />

            {/* Stats */}
            <p className="hidden md:flex items-center gap-1.5 text-xs text-white/40">
              <span className="text-green-400 font-semibold">99.9%</span> lecturas
            </p>

            {/* CTA Button */}
            <a
              href={RESULTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 text-xs font-semibold rounded-full px-3 sm:px-4 py-1 transition-all duration-300"
            >
              <span className="hidden sm:inline">Ver Resultados</span>
              <span className="sm:hidden">Ver</span>
              <ExternalLink className="size-3" />
            </a>

            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-white/50 transition-colors"
              aria-label="Cerrar banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
