"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Phone, ChevronRight, User as UserIcon, LogIn, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Inicio", href: "/", anchor: "#inicio" },
  { label: "Nosotros", href: "/", anchor: "#nosotros" },
  { label: "Servicios", href: "/", anchor: "#servicios" },
  { label: "Eventos", href: "/eventos" },
  { label: "Tienda", href: "/tienda" },
  { label: "Resultados", href: "https://vbr-results.vercel.app" },
  { label: "Contacto", href: "/", anchor: "#contacto" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Sesión de la comunidad ────────────────────────────────
  const [session, setSession] = useState<{ nombre: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setSession({ nombre: data.user.nombre || data.user.email });
        }
      })
      .catch(() => {});
  }, []);

  /** redirect para volver a la página actual tras iniciar sesión */
  const loginHref = `/iniciar-sesion${
    pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""
  }`;
  const registerHref = `/registrarse${
    pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""
  }`;

  const cerrarSesion = async () => {
    await fetch("/api/auth/cerrar-sesion", { method: "POST" }).catch(() => {});
    setSession(null);
    setMobileOpen(false);
    router.push("/");
  };

  const isHomePage = pathname === "/";

  /**
   * Navigate to a link from ANY page.
   * - External links: open in new tab
   * - Page routes (like /tienda): navigate directly
   * - Anchor links on home page: smooth scroll
   * - Anchor links on other pages: navigate to "/" first, then scroll to section
   */
  const handleNavClick = (href: string, anchor?: string) => {
    setMobileOpen(false);

    // External links: open in new tab
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    // Direct page route (e.g., /tienda)
    if (!anchor) {
      router.push(href);
      return;
    }

    // Anchor link
    if (isHomePage) {
      const el = document.querySelector(anchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(href + anchor);
    }
  };

  /**
   * Check if a nav link is currently active.
   * Home anchors are active only on home page.
   * Page routes are active when pathname matches.
   */
  const isActive = (link: typeof navLinks[0]) => {
    if (!link.anchor) {
      // Direct page route
      return pathname === link.href;
    }
    // Anchor link: only "active" on home page
    return isHomePage;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (isHomePage) {
                  const el = document.querySelector("#inicio");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                } else {
                  router.push("/");
                }
              }}
              className="flex items-center"
            >
              <img
                src="/LOGOVBR.png"
                alt="VzlaBike and Run"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link);
                return (
                  <a
                    key={link.label}
                    href={link.anchor || link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href, link.anchor);
                    }}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      active
                        ? "text-red-400"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href="tel:+584120162685"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                <Phone className="size-4" />
                <span className="hidden md:inline">+58 412-016-2685</span>
              </a>

              {/* ── Acceso de la comunidad ── */}
              {session ? (
                // Con sesión: Mi Perfil + Cerrar sesión
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => router.push("/mi-perfil")}
                  >
                    <UserCircle className="size-4" />
                    <span className="hidden lg:inline max-w-[110px] truncate">
                      {session.nombre}
                    </span>
                    <span className="lg:hidden">Mi Perfil</span>
                  </Button>
                  <button
                    onClick={cerrarSesion}
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    className="hidden md:inline-flex items-center justify-center size-9 rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              ) : (
                // Sin sesión: Iniciar Sesión + Registrarse
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => router.push(loginHref)}
                  >
                    <LogIn className="size-4" />
                    <span className="hidden sm:inline">Iniciar Sesión</span>
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0 hover:opacity-90"
                    onClick={() => router.push(registerHref)}
                  >
                    <UserIcon className="size-4" />
                    <span className="hidden sm:inline">Registrarse</span>
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                className="hidden md:inline-flex gradient-primary text-white border-0 hover:opacity-90"
                onClick={() => {
                  if (isHomePage) {
                    const el = document.querySelector("#contacto");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    router.push("/#contacto");
                  }
                }}
              >
                Solicitar Presupuesto
                <ChevronRight className="size-4" />
              </Button>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute top-16 right-0 left-0 bg-white shadow-xl border-b">
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => {
                  const active = isActive(link);
                  return (
                    <a
                      key={link.label}
                      href={link.anchor || link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href, link.anchor);
                      }}
                      className={cn(
                        "px-4 py-3 font-medium rounded-md transition-colors cursor-pointer",
                        active
                          ? "text-red-600 bg-red-50"
                          : "text-foreground hover:bg-red-50 hover:text-red-600"
                      )}
                    >
                      {link.label}
                    </a>
                  );
                })}
                <div className="border-t mt-2 pt-3 space-y-2">
                  {session ? (
                    <>
                      <Button
                        className="w-full gradient-primary text-white border-0"
                        onClick={() => {
                          setMobileOpen(false);
                          router.push("/mi-perfil");
                        }}
                      >
                        <UserCircle className="size-4" />
                        Mi Perfil
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={cerrarSesion}
                      >
                        <LogOut className="size-4" />
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full gradient-primary text-white border-0"
                        onClick={() => {
                          setMobileOpen(false);
                          router.push(registerHref);
                        }}
                      >
                        <UserIcon className="size-4" />
                        Registrarse
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setMobileOpen(false);
                          router.push(loginHref);
                        }}
                      >
                        <LogIn className="size-4" />
                        Iniciar Sesión
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
