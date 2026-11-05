"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  LogOut,
  Menu,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Eventos",
    href: "/admin/eventos",
    icon: CalendarDays,
  },
  {
    label: "Inscripciones",
    href: "/admin/inscripciones",
    icon: ClipboardList,
  },
  {
    label: "Tienda",
    href: "/admin/tienda",
    icon: ShoppingBag,
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingCart,
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Fallback: clear cookie manually
      document.cookie = "admin_token=; path=/; max-age=0";
    }
    // Clear session storage auth flag
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/login");
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" onClick={onNavigate}>
          <img
            src="/LOGOVBR.png"
            alt="VzlaBike and Run"
            className="h-10 w-auto brightness-0 invert"
          />
        </Link>
        <p className="text-white/50 text-xs mt-2 font-medium tracking-wider uppercase">
          Panel Admin
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <link.icon className="size-5 shrink-0" />
              <span>{link.label}</span>
              {isActive && (
                <ChevronRight className="size-4 ml-auto opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 w-full"
        >
          <LogOut className="size-5 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    // Check session storage first (fast, prevents flicker)
    const sessionAuth = sessionStorage.getItem("admin_authenticated");
    if (sessionAuth === "true") {
      setVerified(true);
      setChecking(false);
      return;
    }

    // Verify via API
    fetch("/api/admin/verify", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem("admin_authenticated", "true");
          setVerified(true);
        } else {
          // API says not authenticated - show PIN prompt
          setShowPinPrompt(true);
        }
      })
      .catch(() => {
        // API error - show PIN prompt as fallback
        setShowPinPrompt(true);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pin }),
      });

      if (res.ok) {
        sessionStorage.setItem("admin_authenticated", "true");
        setVerified(true);
        setShowPinPrompt(false);
      } else {
        setPinError("Clave incorrecta");
      }
    } catch {
      setPinError("Error de conexión");
    }
  };

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // PIN / Password prompt (shown when API says not authenticated)
  if (showPinPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <ShieldAlert className="size-16 text-white/80 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Acceso Restringido</h1>
            <p className="text-white/60 mt-2">
              Ingresa la clave de administrador para continuar
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Clave de Administrador
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Ingresa la clave"
                    className="pl-10 h-12 text-lg"
                    autoFocus
                    required
                  />
                </div>
              </div>
              {pinError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                  {pinError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 gradient-primary text-white border-0 text-base font-semibold hover:opacity-90"
              >
                Ingresar al Panel
              </Button>
            </form>
          </div>
          <p className="text-center text-white/30 text-xs mt-6">
            VzlaBike and Run — Acceso exclusivo
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 gradient-dark fixed inset-y-0 left-0 z-40">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="gradient-dark border-0 p-0 w-72 sm:max-w-xs [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de navegación</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 lg:pl-64">
          {/* Top Bar (Mobile) */}
          <header className="lg:hidden sticky top-0 z-30 bg-white border-b shadow-sm">
            <div className="flex items-center gap-3 px-4 h-14">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
              <img src="/LOGOVBR.png" alt="VzlaBike" className="h-7 w-auto" />
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
