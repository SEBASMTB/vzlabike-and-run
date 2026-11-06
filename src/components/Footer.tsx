"use client";

import { usePathname, useRouter } from "next/navigation";
import { MapPin, Phone, Mail, ArrowUp } from "lucide-react";

const quickLinks = [
  { label: "Inicio", href: "/", anchor: "#inicio" },
  { label: "Nosotros", href: "/", anchor: "#nosotros" },
  { label: "Servicios", href: "/", anchor: "#servicios" },
  { label: "Eventos", href: "/", anchor: "#eventos" },
  { label: "Tienda", href: "/tienda" },
  { label: "Resultados", href: "https://vbr-results.vercel.app" },
  { label: "Contacto", href: "/", anchor: "#contacto" },
];

const serviceLinks = [
  { label: "Cronometraje", href: "/", anchor: "#servicios" },
  { label: "Inscripciones", href: "/", anchor: "#eventos" },
  { label: "Resultados en Vivo", href: "https://vbr-results.vercel.app" },
  { label: "VBRWorks®", href: "https://vbr-results.vercel.app" },
  { label: "Fotografía", href: "/", anchor: "#servicios" },
  { label: "Timing Tags", href: "/", anchor: "#servicios" },
];

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  const handleLinkClick = (href: string, anchor?: string) => {
    // External links: open in new tab
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    // Direct page route (e.g., /tienda, /resultados)
    if (!anchor) {
      router.push(href);
      return;
    }

    // Anchor link
    if (isHomePage) {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(href + anchor);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="gradient-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <span className="font-bold text-base">
                  VzlaBike<span className="text-red-400"> and Run</span>
                  <sup className="text-[8px]">®</sup>
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Empresa líder en cronometraje deportivo y organización de eventos
              en Venezuela. Más de 25 años de experiencia garantizando
              resultados de primer nivel.
            </p>
            <div className="flex gap-3">
              {["IG", "FB", "TW", "YT", "TK"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/70 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-red-400 uppercase tracking-wider">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.anchor || link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(link.href, link.anchor);
                    }}
                    className="text-white/60 hover:text-red-400 text-sm transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-red-400 uppercase tracking-wider">
              Servicios
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.anchor || link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(link.href, link.anchor);
                    }}
                    className="text-white/60 hover:text-red-400 text-sm transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-red-400 uppercase tracking-wider">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="size-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-white/60 text-sm">
                  Caracas, Venezuela
                </span>
              </li>
              <li>
                <a
                  href="tel:+584120162685"
                  className="flex items-start gap-2 text-white/60 hover:text-red-400 text-sm transition-colors"
                >
                  <Phone className="size-4 text-red-400 shrink-0 mt-0.5" />
                  +58 412-016-2685
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@vzlabikeandrun.com"
                  className="flex items-start gap-2 text-white/60 hover:text-red-400 text-sm transition-colors"
                >
                  <Mail className="size-4 text-red-400 shrink-0 mt-0.5" />
                  info@vzlabikeandrun.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm text-center sm:text-left">
            © 2024 VzlaBike and Run®. Todos los derechos reservados.
          </p>
          <button
            onClick={scrollToTop}
            className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            aria-label="Volver arriba"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
