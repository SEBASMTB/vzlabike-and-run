"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Loader2, LogIn, Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react";

function IniciarSesionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/mi-perfil";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, la página de login no aporta nada: al perfil
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) router.replace(redirect);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/iniciar-sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No pudimos iniciar sesión");
        setLoading(false);
        return;
      }
      // Volver exactamente a donde el usuario iba (ej. la inscripción del evento)
      router.push(redirect);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 pt-24 pb-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl gradient-primary mb-4">
            <LogIn className="size-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Iniciar Sesión
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Accede a tu historial, ficha personal e inscripciones
          </p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-sm">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-black/40 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-sm">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-black/40 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white border-0 h-11 text-base"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <LogIn className="size-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-white/60">
              ¿No tienes cuenta?{" "}
              <Link
                href={`/registrarse${
                  redirect !== "/mi-perfil" ? `?redirect=${encodeURIComponent(redirect)}` : ""
                }`}
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          Tus datos están protegidos: solo tú puedes ver tu ficha e historial
        </p>
      </div>
    </main>
  );
}

export default function IniciarSesionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center pt-24">
            <Loader2 className="size-8 animate-spin text-red-500" />
          </main>
        }
      >
        <IniciarSesionForm />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
