"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_VENEZUELA, TALLAS_FRANELA, PARENTESCOS } from "@/lib/venezuela-data";
import {
  Loader2,
  User,
  HeartPulse,
  Phone,
  CalendarDays,
  LogOut,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Save,
  Link2,
  Hash,
  MapPin,
  LayoutDashboard,
  ChevronsLeft,
  Shirt,
  Dumbbell,
  Ticket,
} from "lucide-react";

// ============================================================
// Tipos (espejo de /api/auth/me y /api/auth/mis-inscripciones)
// ============================================================

interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: string;
}

interface RunnerProfile {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  ciudad: string | null;
  direccion: string | null;
  team: string | null;
  tallaFranela: string | null;
  grupoSanguineo: string | null;
  alergiasCondiciones: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
}

interface MyRegistration {
  id: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  category: string;
  bibNumber: number | null;
  bibBoxLabel: string;
  chipCode: string | null;
  shirtSize: string | null;
  registrationType: string;
  recipientName: string;
  totalAmount: number;
  totalAmountBs: number;
  paymentMethod: string;
  paymentRef: string;
  rejectReason: string;
  event: {
    title: string;
    slug: string;
    date: string;
    location: string;
    distance: string;
    sportType: string;
    imageUrl: string;
  } | null;
}

type SectionId = "personal" | "medica" | "emergencia" | "inscripciones";

const SECTIONS: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Información Personal", icon: User },
  { id: "medica", label: "Información Médica", icon: HeartPulse },
  { id: "emergencia", label: "Contacto de Emergencia", icon: Phone },
  { id: "inscripciones", label: "Mis Inscripciones", icon: Ticket },
];

// ============================================================
// Helpers
// ============================================================

function fechaToInput(fecha: string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fechaDisplay(fecha: string | null): string {
  const iso = fechaToInput(fecha);
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ============================================================
// Página Mi Perfil
// ============================================================

export default function MiPerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [runner, setRunner] = useState<RunnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("personal");
  const [menuOpen, setMenuOpen] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.replace("/iniciar-sesion?redirect=/mi-perfil");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setRunner(data.runner);
    } catch {
      router.replace("/iniciar-sesion?redirect=/mi-perfil");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleLogout = async () => {
    await fetch("/api/auth/cerrar-sesion", { method: "POST" }).catch(() => {});
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-red-500" />
            <p className="text-white/50 text-sm">Cargando tu perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.nombre || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (
    <nav className={menuOpen ? "block" : "hidden md:block"}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3 md:sticky md:top-24">
        {/* Tarjeta de usuario */}
        <div className="flex items-center gap-3 p-3 mb-2">
          <div className="size-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{user.nombre || "Atleta VBR"}</p>
            <p className="text-white/50 text-xs truncate">{user.email}</p>
            {runner ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
                <BadgeCheck className="size-3" />
                Cédula verificada · {runner.cedula}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                <AlertCircle className="size-3" />
                Sin cédula vinculada
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  active
                    ? "bg-red-500/15 text-red-400"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
          <div className="border-t border-white/10 mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="size-4 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Encabezado */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Mi Perfil
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Tu ficha de atleta, historial e inscripciones VBR
              </p>
            </div>
            {/* Botón menú móvil */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden border-white/15 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <LayoutDashboard className="size-4 mr-1.5" />
              Menú
              <ChevronsLeft className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            {/* Menú lateral */}
            <div>
              {nav}
            </div>

            {/* Contenido */}
            <div>
              {!runner && (
                <VinculacionBanner onLinked={loadSession} />
              )}
              {section === "personal" && (
                <PersonalSection runner={runner} onSaved={loadSession} />
              )}
              {section === "medica" && (
                <MedicalSection runner={runner} onSaved={loadSession} />
              )}
              {section === "emergencia" && (
                <EmergencySection runner={runner} onSaved={loadSession} />
              )}
              {section === "inscripciones" && <InscripcionesSection />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

// ============================================================
// Banner de vinculación por cédula (cuenta sin Runner)
// ============================================================

function VinculacionBanner({ onLinked }: { onLinked: () => void }) {
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const vincular = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No pudimos vincular la cédula");
        setSaving(false);
        return;
      }
      onLinked();
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <Link2 className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-amber-300 font-semibold text-sm">
            Vincula tu cédula para desplegar tu historial
          </h3>
          <p className="text-white/60 text-xs mt-1">
            Si ya participaste en eventos VBR, tu ficha está en nuestro histórico.
            Ingresa tu cédula y vincularemos tus inscripciones, dorsales y datos
            personales al instante.
          </p>
          {error && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="V-12345678"
              inputMode="numeric"
              className="bg-black/40 border-white/15 text-white placeholder:text-white/30 max-w-[220px]"
            />
            <Button
              size="sm"
              onClick={vincular}
              disabled={saving || cedula.trim().length < 5}
              className="gradient-primary text-white border-0"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Vincular"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tarjeta base para las secciones de ficha
// ============================================================

function FichaCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="size-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <Icon className="size-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <p className="text-white/45 text-xs">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

// ============================================================
// Sección: Información Personal
// ============================================================

function PersonalSection({
  runner,
  onSaved,
}: {
  runner: RunnerProfile | null;
  onSaved: () => void;
}) {
  const [nombres, setNombres] = useState(runner?.nombres || "");
  const [apellidos, setApellidos] = useState(runner?.apellidos || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    fechaToInput(runner?.fechaNacimiento || null)
  );
  const [genero, setGenero] = useState(runner?.genero || "");
  const [telefono, setTelefono] = useState(runner?.telefono || "");
  const [estado, setEstado] = useState(runner?.estado || "");
  const [ciudad, setCiudad] = useState(runner?.ciudad || "");
  const [team, setTeam] = useState(runner?.team || "");
  const [tallaFranela, setTallaFranela] = useState(runner?.tallaFranela || "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres,
          apellidos,
          fechaNacimiento,
          genero,
          telefono,
          estado,
          ciudad,
          team,
          tallaFranela,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No pudimos guardar");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      onSaved();
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  };

  return (
    <FichaCard
      title="Información Personal"
      description="Datos de identificación y contacto de tu ficha de atleta"
      icon={User}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cédula (solo lectura) */}
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm flex items-center gap-1.5">
            <Hash className="size-3.5" /> Cédula
          </Label>
          <div className="flex items-center h-10 px-3 rounded-md bg-black/40 border border-white/10 text-white/80 text-sm">
            {runner ? (
              <span className="flex items-center gap-2">
                {runner.cedula}
                <BadgeCheck className="size-4 text-emerald-400" />
              </span>
            ) : (
              <span className="text-white/35">
                Vincula tu cédula desde el aviso de arriba
              </span>
            )}
          </div>
        </div>

        {/* Email de la cuenta (solo lectura) */}
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Correo de la cuenta</Label>
          <div className="flex items-center h-10 px-3 rounded-md bg-black/40 border border-white/10 text-white/80 text-sm truncate">
            <SessionEmail />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Nombres</Label>
          <Input
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Juan"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Apellidos</Label>
          <Input
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            placeholder="Pérez"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> Fecha de nacimiento
          </Label>
          <Input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="bg-black/40 border-white/15 text-white [color-scheme:dark]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Sexo</Label>
          <Select value={genero} onValueChange={setGenero}>
            <SelectTrigger className="bg-black/40 border-white/15 text-white">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/15">
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Femenino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Teléfono / WhatsApp</Label>
          <Input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="0412-1234567"
            inputMode="tel"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm flex items-center gap-1.5">
            <MapPin className="size-3.5" /> Estado
          </Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="bg-black/40 border-white/15 text-white">
              <SelectValue placeholder="Selecciona tu estado" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/15 max-h-64">
              {ESTADOS_VENEZUELA.map((e) => (
                <SelectItem key={e.iso} value={e.nombre}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Ciudad</Label>
          <Input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Tu ciudad"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm flex items-center gap-1.5">
            <Dumbbell className="size-3.5" /> Club / Equipo
          </Label>
          <Input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="Ej: Team VBR Cycling (o vacío si es independiente)"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm flex items-center gap-1.5">
            <Shirt className="size-3.5" /> Talla de franela
          </Label>
          <Select value={tallaFranela} onValueChange={setTallaFranela}>
            <SelectTrigger className="bg-black/40 border-white/15 text-white">
              <SelectValue placeholder="Selecciona tu talla" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/15">
              {TALLAS_FRANELA.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-4 flex items-center gap-1.5">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <Button
          onClick={guardar}
          disabled={saving}
          className="gradient-primary text-white border-0"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4 mr-1.5" />
              Guardar cambios
            </>
          )}
        </Button>
        {saved && (
          <span className="text-emerald-400 text-sm flex items-center gap-1.5">
            <CheckCircle2 className="size-4" /> Datos guardados
          </span>
        )}
      </div>
    </FichaCard>
  );
}

/** Lee el email de la cuenta desde /api/auth/me (cacheado en window) */
function SessionEmail() {
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEmail(d?.user?.email || ""))
      .catch(() => {});
  }, []);
  return <span className="truncate">{email || "—"}</span>;
}

// ============================================================
// Sección: Información Médica
// ============================================================

function MedicalSection({
  runner,
  onSaved,
}: {
  runner: RunnerProfile | null;
  onSaved: () => void;
}) {
  const [grupoSanguineo, setGrupoSanguineo] = useState(
    runner?.grupoSanguineo || ""
  );
  const [alergias, setAlergias] = useState(
    runner?.alergiasCondiciones || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoSanguineo, alergiasCondiciones: alergias }),
      });
      if (!res.ok) {
        setError("No pudimos guardar");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      onSaved();
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  };

  return (
    <FichaCard
      title="Información Médica"
      description="Datos críticos para la logística de seguridad en tus eventos"
      icon={HeartPulse}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Tipo de sangre</Label>
          <Select value={grupoSanguineo} onValueChange={setGrupoSanguineo}>
            <SelectTrigger className="bg-black/40 border-white/15 text-white">
              <SelectValue placeholder="Selecciona tu tipo" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/15">
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Desconozco"].map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-white/70 text-sm">
            Alergias y condiciones médicas
          </Label>
          <textarea
            value={alergias}
            onChange={(e) => setAlergias(e.target.value)}
            placeholder="Ej: Penicilina, asma, hipertensión… (vacío si no tienes)"
            rows={4}
            className="w-full rounded-md bg-black/40 border border-white/15 text-white placeholder:text-white/30 text-sm px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          />
          <p className="text-white/35 text-xs">
            Esta información solo la ve el equipo médico/organizador ante una
            emergencia en pista. Nunca se muestra públicamente.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-4 flex items-center gap-1.5">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <Button
          onClick={guardar}
          disabled={saving}
          className="gradient-primary text-white border-0"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4 mr-1.5" />
              Guardar cambios
            </>
          )}
        </Button>
        {saved && (
          <span className="text-emerald-400 text-sm flex items-center gap-1.5">
            <CheckCircle2 className="size-4" /> Datos guardados
          </span>
        )}
      </div>
    </FichaCard>
  );
}

// ============================================================
// Sección: Contacto de Emergencia
// ============================================================

function EmergencySection({
  runner,
  onSaved,
}: {
  runner: RunnerProfile | null;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(
    runner?.contactoEmergenciaNombre || ""
  );
  const [telefono, setTelefono] = useState(
    runner?.contactoEmergenciaTelefono || ""
  );
  const [parentesco, setParentesco] = useState(
    runner?.contactoEmergenciaParentesco || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactoEmergenciaNombre: nombre,
          contactoEmergenciaTelefono: telefono,
          contactoEmergenciaParentesco: parentesco,
        }),
      });
      if (!res.ok) {
        setError("No pudimos guardar");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      onSaved();
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  };

  return (
    <FichaCard
      title="Contacto de Emergencia"
      description="Persona a contactar ante cualquier incidencia durante un evento"
      icon={Phone}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Nombre completo</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María Pérez"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70 text-sm">Teléfono</Label>
          <Input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="0414-7654321"
            inputMode="tel"
            className="bg-black/40 border-white/15 text-white placeholder:text-white/30"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-white/70 text-sm">Parentesco</Label>
          <Select value={parentesco} onValueChange={setParentesco}>
            <SelectTrigger className="bg-black/40 border-white/15 text-white">
              <SelectValue placeholder="Selecciona el parentesco" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/15 max-h-64">
              {PARENTESCOS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-4 flex items-center gap-1.5">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <Button
          onClick={guardar}
          disabled={saving}
          className="gradient-primary text-white border-0"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4 mr-1.5" />
              Guardar cambios
            </>
          )}
        </Button>
        {saved && (
          <span className="text-emerald-400 text-sm flex items-center gap-1.5">
            <CheckCircle2 className="size-4" /> Datos guardados
          </span>
        )}
      </div>
    </FichaCard>
  );
}

// ============================================================
// Sección: Mis Inscripciones
// ============================================================

function InscripcionesSection() {
  const [data, setData] = useState<{
    pendientes: MyRegistration[];
    aprobadas: MyRegistration[];
    rechazadas: MyRegistration[];
    linked: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/mis-inscripciones")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-10 flex items-center justify-center">
        <Loader2 className="size-7 animate-spin text-red-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-white/60 text-sm">
        No pudimos cargar tus inscripciones. Recarga la página.
      </div>
    );
  }

  const total =
    data.pendientes.length + data.aprobadas.length + data.rechazadas.length;

  if (!data.linked) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
        <Ticket className="size-10 text-white/20 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">
          Aún no hay historial vinculado
        </h3>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          Vincula tu cédula en la sección Información Personal y tus
          inscripciones aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
        <Ticket className="size-10 text-white/20 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">
          Todavía no te has inscrito en ningún evento
        </h3>
        <p className="text-white/50 text-sm max-w-sm mx-auto mb-5">
          Cuando te inscribas, verás aquí el estado de tu pago, tu dorsal y tu
          caja de retiro de kit.
        </p>
        <Link href="/eventos">
          <Button className="gradient-primary text-white border-0">
            Ver próximos eventos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GrupoInscripciones
        titulo="Pendientes de pago"
        descripcion="Tu cupo se reserva al aprobarse el pago (1–3 días hábiles)"
        registros={data.pendientes}
        icon={Clock}
        colorClases={{
          icon: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          badge: "bg-amber-500/15 text-amber-300",
        }}
      />
      <GrupoInscripciones
        titulo="Aprobadas"
        descripcion="¡Listo! Tu dorsal y caja de retiro ya están asignados"
        registros={data.aprobadas}
        icon={CheckCircle2}
        colorClases={{
          icon: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          badge: "bg-emerald-500/15 text-emerald-300",
        }}
      />
      <GrupoInscripciones
        titulo="Rechazadas"
        descripcion="Revisa el motivo y corrige el pago para volver a enviar"
        registros={data.rechazadas}
        icon={Ban}
        colorClases={{
          icon: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          badge: "bg-red-500/15 text-red-300",
        }}
      />
    </div>
  );
}

function GrupoInscripciones({
  titulo,
  descripcion,
  registros,
  icon: Icon,
  colorClases,
}: {
  titulo: string;
  descripcion: string;
  registros: MyRegistration[];
  icon: typeof Clock;
  colorClases: {
    icon: string;
    bg: string;
    border: string;
    badge: string;
  };
}) {
  if (registros.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <Icon className={`size-5 ${colorClases.icon}`} />
        <h3 className="text-white font-semibold">{titulo}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClases.badge}`}
        >
          {registros.length}
        </span>
      </div>
      <p className="text-white/40 text-xs mb-3">{descripcion}</p>

      <div className="space-y-3">
        {registros.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border ${colorClases.border} ${colorClases.bg} p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-sm md:text-base">
                  {r.event?.title || "Evento"}
                </h4>
                <p className="text-white/50 text-xs mt-0.5">
                  {r.event?.distance ? `${r.event.distance} · ` : ""}
                  {r.event?.location}
                  {r.registrationType === "other" && r.recipientName
                    ? ` · Inscripción para: ${r.recipientName}`
                    : ""}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Inscripción #{r.id.slice(-8).toUpperCase()} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.category && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {r.category}
                    </span>
                  )}
                  {r.shirtSize && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Talla {r.shirtSize}
                    </span>
                  )}
                  {r.paymentMethod && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {r.paymentMethod}
                    </span>
                  )}
                </div>
                {r.status === "REJECTED" && r.rejectReason && (
                  <p className="text-red-300 text-xs mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                    <strong>Motivo del rechazo:</strong> {r.rejectReason}
                  </p>
                )}
              </div>

              {r.status === "APPROVED" && r.bibNumber != null && (
                <div className="text-center shrink-0 bg-black/50 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide">
                    Dorsal
                  </p>
                  <p className="text-2xl font-black text-white leading-none mt-1">
                    {r.bibNumber}
                  </p>
                  {r.bibBoxLabel && (
                    <p className="text-[11px] text-red-400 font-medium mt-1.5">
                      {r.bibBoxLabel}
                    </p>
                  )}
                </div>
              )}
            </div>

            {r.event?.slug && (
              <Link
                href={`/eventos/${r.event.slug}`}
                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium mt-3"
              >
                Ver evento →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
