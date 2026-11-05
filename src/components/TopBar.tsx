"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, Phone, Mail } from "lucide-react";

/**
 * Professional top info bar with live Venezuela clock and date.
 * Hydration-safe: renders static placeholder on server, then
 * activates the live clock after first client-side mount.
 */

const TZ = "America/Caracas";

function formatVenezuelaTime(date: Date) {
  return date.toLocaleTimeString("es-VE", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatVenezuelaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("es-VE", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);

  const dayName = parts.find((p) => p.type === "weekday")?.value ?? "";
  const dayNum = parts.find((p) => p.type === "day")?.value ?? "";
  const monthName = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized}, ${dayNum} de ${monthName} de ${year}`;
}

export function TopBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    // Only runs on the client after hydration
    function tick() {
      const now = new Date();
      setTime(formatVenezuelaTime(now));
      setDate(formatVenezuelaDate(now));
    }

    tick(); // set immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0d0d0d] to-[#1a1a1a] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-8 md:h-9">
          {/* Left: Date and Time */}
          <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
            {/* Date */}
            <div className="hidden sm:flex items-center gap-1.5 text-white/50">
              <Calendar className="size-3 shrink-0" />
              <span className="text-[11px] md:text-xs truncate">
                {date || "\u00A0"}
              </span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center justify-center">
                <Clock className="size-3 text-red-400" />
                {time && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[11px] md:text-xs font-mono font-medium text-white/70 tracking-wide min-w-[5.5ch]">
                {time || "--:--:--"}
              </span>
              <span className="text-[10px] text-white/30 hidden md:inline">
                VET
              </span>
            </div>
          </div>

          {/* Right: Contact info */}
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="mailto:info@vzlabikeandrun.com"
              className="hidden lg:flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <Mail className="size-3" />
              <span className="text-[11px]">info@vzlabikeandrun.com</span>
            </a>
            <a
              href="tel:+584120162685"
              className="hidden md:flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <Phone className="size-3" />
              <span className="text-[11px]">+58 412-016-2685</span>
            </a>
            <div className="hidden lg:flex items-center gap-1 text-white/40">
              <MapPin className="size-3" />
              <span className="text-[11px]">Caracas, Venezuela</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
