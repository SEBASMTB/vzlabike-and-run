"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  Loader2,
  UserPlus,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  BadgeCheck,
  IdCard,
  Info,
} from "lucide-react";

function RegistrarseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/mi-perfil";

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Vista previa: ¿la cédula existe en el histórico de corredores VBR?
  const [runnerPreview, setRunnerPreview] = useState<{
    nombres: string;
    apellidos: string;
  } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPreview = useRef<string>("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, al perfil
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) router.replace(redirect);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Cédula: búsqueda con debounce en la tabla Runner (histórico VBR) */
  const handleCedulaChange = (value: string) => {
    setCedula(value);
    setRunnerPreview(null);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    const digits = value.replace(/\D/g, "");
    if (digits.length < 4) return;
    previewTimer.current = setTimeout(async () => {
      const key = value.trim().toUpperCase();
      if (key === lastPreview.current) return;
      lastPreview.current = key;
      try {
        const res = await fetch(
          `/api/runners/lookup?cedula=${encodeURIComponent(value.trim())}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.found && data.runner) {
          setRunnerPreview({
            nombres: data.runner.nombres,
            apellidos: data.runner.apellidos,
          });
        }
      } catch {
        // La vista previa es una mejora: si falla continúa el registro
      }
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registrarse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, cedula, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No pudimos crear tu cuenta");
        setLoading(false);
        return;
      }
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
            <UserPlus className="size-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Crear Cuenta
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Regístrate con tu cédula y tu historial VBR se despliega solo
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-white/80 text-sm">
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  required
                  placeholder="Juan"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-white/80 text-sm">
                  Apellido
                </Label>
                <Input
                  id="apellido"
                  placeholder="Pérez"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cedula" className="text-white/80 text-sm">
                Cédula *
              </Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  id="cedula"
                  required
                  inputMode="numeric"
                  placeholder="V-12345678"
                  value={cedula}
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  className="pl-9 bg-black/40 border-white/15 text-white placeholder:text-white/30"
                />
              </div>
              {runnerPreview && (
                <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 mt-2">
                  <BadgeCheck className="size-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>¡Historial encontrado!</strong> Tu ficha{" "}
                    {runnerPreview.nombres} {runnerPreview.apellidos} se vinculará
                    automáticamente: inscripciones, dorsales y datos personales se
                    desplegarán al instante en Mi Perfil.
                  </span>
                </div>
              )}
              {!runnerPreview && cedula.replace(/\D/g, "").length >= 4 && (
                <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/60 mt-2">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>
                    Tu cuenta se creará sin historial. Cuando el organizador cargue
                    tus datos (o completes tu ficha en Mi Perfil) se vinculará
                    automáticamente.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-sm">
                Correo electrónico *
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/80 text-sm">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-black/40 border-white/15 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-white/80 text-sm">
                  Confirmar *
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repite la clave"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
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
                  Crear mi cuenta
                  <UserPlus className="size-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-white/60">
              ¿Ya tienes cuenta?{" "}
              <Link
                href={`/iniciar-sesion${
                  redirect !== "/mi-perfil" ? `?redirect=${encodeURIComponent(redirect)}` : ""
                }`}
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          Usamos tu cédula solo para vincular tu historial deportivo
        </p>
      </div>
    </main>
  );
}

export default function RegistrarsePage() {
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
        <RegistrarseForm />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
