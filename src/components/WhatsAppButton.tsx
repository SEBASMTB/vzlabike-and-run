"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_NUMBER = "584120162685";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola VzlaBike and Run, me gustaría obtener información sobre sus eventos y servicios."
);

export function WhatsAppButton() {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-[260px]"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">VzlaBike and Run</p>
                  <p className="text-[11px] text-green-600">En línea</p>
                </div>
              </div>
              <button
                onClick={() => setTooltip(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              ¿Necesitas información? Escríbenos por WhatsApp y te responderemos lo antes posible.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full text-center bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Chatear ahora
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        onClick={() => setTooltip(!tooltip)}
        className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors group"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="size-6 text-white" />

        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />

        {/* Notification dot */}
        {!tooltip && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] text-white font-bold flex items-center justify-center">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
}
