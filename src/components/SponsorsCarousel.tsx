"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface SponsorLogo {
  logo: string;
  name: string;
  url: string;
}

interface SponsorsCarouselProps {
  sponsorsLogos: string; // JSON array of SponsorLogo
}

export function SponsorsCarousel({ sponsorsLogos }: SponsorsCarouselProps) {
  const sponsors: SponsorLogo[] = useMemo(() => {
    try {
      return JSON.parse(sponsorsLogos || "[]");
    } catch {
      return [];
    }
  }, [sponsorsLogos]);

  if (sponsors.length === 0) return null;

  // Duplicate the list for seamless infinite scroll
  const doubled = [...sponsors, ...sponsors];

  return (
    <div className="w-full overflow-hidden py-6">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Patrocinadores
        </h3>
      </div>
      <motion.div
        className="flex gap-8 items-center"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: sponsors.length * 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {doubled.map((sponsor, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 flex items-center justify-center"
          >
            {sponsor.url ? (
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name || "Patrocinador"}
                  className="h-16 w-auto object-contain max-w-[160px]"
                  title={sponsor.name}
                />
              </a>
            ) : (
              <img
                src={sponsor.logo}
                alt={sponsor.name || "Patrocinador"}
                className="h-16 w-auto object-contain max-w-[160px]"
                title={sponsor.name}
              />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
