"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * AdminGuard — protege las páginas del panel administrativo.
 * Se monta en cada página admin (menos /admin/login) y verifica
 * la sesión llamando a /api/admin/verify. Si no está autenticado,
 * redirige inmediatamente a /admin/login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No proteger la página de login
    if (pathname === "/admin/login") {
      setVerified(true);
      setChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/verify");
        if (res.ok) {
          setVerified(true);
        } else {
          // No autenticado — redirigir al login
          router.replace("/admin/login");
          return;
        }
      } catch {
        // Error de red — redirigir al login por seguridad
        router.replace("/admin/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Mientras verifica, no mostrar nada del admin
  if (checking) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    );
  }

  // Si no está verificado, no mostrar nada (la redirección ya ocurrió)
  if (!verified) {
    return null;
  }

  return <>{children}</>;
}
