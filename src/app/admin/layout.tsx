"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

const LOGIN_PATH = "/admin/login";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const isLoginPage = pathname === LOGIN_PATH;

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

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
          setIsAuthenticated(true);
        } else {
          window.location.href = LOGIN_PATH;
        }
      })
      .catch(() => {
        window.location.href = LOGIN_PATH;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoginPage, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-12 w-12 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-white/60 text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
// cache bust Mon May 11 12:09:52 UTC 2026
