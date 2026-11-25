"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Mail,
  Phone,
  CreditCard,
  Hash,
  Calendar,
  MapPin,
  Tag,
  Info,
  FileSpreadsheet,
  ShieldCheck,
  Image as ImageIcon,
  X,
  Ban,
  Heart,
  Droplets,
  Trash2,
  Users,
  Landmark,
  Zap,
  KeyRound,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-accounts";

// ============================================================
// Types
// ============================================================

interface Registration {
  id: string;
  eventId: string;
  event: { id?: string; title: string; date?: string };
  runnerId: string;
  runner: {
    id: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string;
    genero: string;
    email: string | null;
    telefono: string | null;
    pais?: string;
    estado?: string;
    ciudad: string | null;
    team: string | null;
    tallaFranela?: string | null;
    licenciaFederativa?: string | null;
    grupoSanguineo: string | null;
    contactoEmergenciaNombre: string | null;
    contactoEmergenciaTelefono: string | null;
    contactoEmergenciaParentesco?: string | null;
    alergiasCondiciones?: string | null;
  } | null;
  category: { id: string; name: string } | null;
  categoryId: string;
  bibNumber: number | null;
  bibBoxLabel?: string | null;
  rejectReason?: string | null;
  chipCode: string | null;
  shirtSize: string | null;
  hasShirt: boolean;
  totalAmount: number;
  totalAmountBs?: number;
  bcvRate?: number;
  paymentMethod: string;
  paymentRef: string;
  paymentProofUrl: string | null;
  status: string;
  waiverAccepted: boolean;
  createdAt: string;
  // Legacy fields for fallback
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  gender: string;
  dateOfBirth: string;
  team: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface EventsData {
  id: string;
  title: string;
  slug?: string;
}

interface CategoryData {
  id: string;
  name: string;
}

interface PaymentRecordUI {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  method: string;
  reference: string;
  amount: number;
  currency: string;
  payerName: string;
  payerPhone: string;
  bankName: string;
  notes: string;
  status: string; // UNMATCHED | MATCHED | IGNORED
  matchedRegistrationId: string | null;
  matchedRegistration: {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    bibNumber: number | null;
    status: string;
  } | null;
  createdAt: string;
}

interface QuickResult {
  id: string;
  bibNumber: number | null;
  bibBoxLabel: string | null;
  bibWarning?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  pending: "Pendiente",
  confirmed: "Confirmado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const PAGE_SIZE = 10;

function formatDate(dateStr: string): string {
  // Soporta DD/MM/YYYY (fecha de nacimiento legacy) e ISO (createdAt)
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr || "");
  if (dmy) {
    return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || "—";
  return d.toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRunnerName(reg: Registration): string {
  if (reg.runner) {
    return `${reg.runner.nombres} ${reg.runner.apellidos}`;
  }
  return `${reg.firstName} ${reg.lastName}`;
}

function getRunnerCedula(reg: Registration): string {
  if (reg.runner) {
    return reg.runner.cedula;
  }
  return reg.idNumber;
}

function normalizeStatus(status: string): string {
  const s = status?.toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "APPROVED" || s === "CONFIRMED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  return status;
}

// ============================================================
// Main Component
// ============================================================

export default function AdminInscripcionesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"inscripciones" | "pagos">("inscripciones");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventsData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  // Pendientes por defecto: la bandeja de trabajo es revisar los nuevos pagos
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Acciones masivas ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");

  // ── Pagos sin Ficha (conciliación) ──
  const [payments, setPayments] = useState<PaymentRecordUI[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsFilter, setPaymentsFilter] = useState("UNMATCHED");
  const [payForm, setPayForm] = useState({
    eventId: "",
    method: "movil",
    reference: "",
    amount: "",
    currency: "Bs",
    payerName: "",
    payerPhone: "",
    bankName: "",
    notes: "",
  });
  const [paySaving, setPaySaving] = useState(false);
  const [approvingMatch, setApprovingMatch] = useState<string | null>(null);

  // ── Inscripción rápida en sitio / WhatsApp ──
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickResult, setQuickResult] = useState<QuickResult | null>(null);
  const [quickCats, setQuickCats] = useState<CategoryData[]>([]);
  const [quickForm, setQuickForm] = useState({
    eventId: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    gender: "",
    categoryId: "",
    shirtSize: "",
    phone: "",
    email: "",
    paymentMethod: "efectivo",
    paymentRef: "",
    totalAmount: "",
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?fresh=1");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // Silently handle
    }
  }, []);

  const fetchCategories = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(
        `/api/admin/events/${eventId}/categories`
      );
      if (res.ok) {
        const data = await res.json();
        const cats = Array.isArray(data)
          ? data.map((c: Record<string, unknown>) => ({
              id: String(c.id),
              name: String(c.name),
            }))
          : [];
        setCategories(cats);
      }
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());
      if (eventFilter !== "all") params.set("eventId", eventFilter);
      if (statusFilter !== "todos") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        const pag = data.pagination || data;
        setTotal(pag.total || 0);
        setTotalPages(pag.totalPages || 0);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, statusFilter, categoryFilter, search]);

  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams();
      if (paymentsFilter !== "todos") params.set("status", paymentsFilter);
      if (eventFilter !== "all") params.set("eventId", eventFilter);
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch {
      // Silently handle
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentsFilter, eventFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    if (tab === "pagos") {
      fetchPayments();
    }
  }, [tab, fetchPayments]);

  // Fetch categories when event filter changes
  useEffect(() => {
    if (eventFilter !== "all") {
      fetchCategories(eventFilter);
    } else {
      setCategories([]);
      setCategoryFilter("all");
    }
  }, [eventFilter, fetchCategories]);

  const handleStatusUpdate = async (id: string, newStatus: string, reason?: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === "REJECTED" ? { rejectReason: reason } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const bibMsg =
          newStatus === "APPROVED" && data?.bibNumber
            ? ` — Dorsal #${data.bibNumber} asignado (${data.bibBoxLabel || "caja"})`
            : "";
        toast({
          title: "Estado actualizado",
          description: `Inscripción ${statusLabels[newStatus] || newStatus}${bibMsg}`,
        });
        fetchRegistrations();
        if (data?.bibWarning) {
          toast({
            title: "Atención con el dorsal",
            description: data.bibWarning,
            variant: "destructive",
          });
        }
        return true;
      }
      toast({
        title: "Error",
        description: data?.error || "No se pudo actualizar el estado",
        variant: "destructive",
      });
      return false;
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
      return false;
    } finally {
      setUpdating(null);
    }
  };

  const openRejectDialog = (ids: string[]) => {
    setRejectTargetIds(ids);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      toast({
        title: "Motivo obligatorio",
        description: "Indica el motivo del rechazo.",
        variant: "destructive",
      });
      return;
    }
    setRejectDialogOpen(false);

    if (rejectTargetIds.length === 1) {
      const okDone = await handleStatusUpdate(rejectTargetIds[0], "REJECTED", reason);
      if (okDone && selectedReg?.id === rejectTargetIds[0]) {
        setDetailOpen(false);
        setSelectedReg(null);
      }
    } else {
      await runBulk("reject", reason);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Inscripción eliminada",
          description: "El registro fue eliminado permanentemente",
        });
        if (selectedReg?.id === id) {
          setDetailOpen(false);
          setSelectedReg(null);
        }
        fetchRegistrations();
      } else {
        const err = await res.json().catch(() => null);
        toast({
          title: "Error",
          description: err?.error || "No se pudo eliminar la inscripción",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inscripción",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDetail = (reg: Registration) => {
    setSelectedReg(reg);
    setDetailOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === "event") setEventFilter(value);
    if (key === "status") setStatusFilter(value);
    if (key === "category") setCategoryFilter(value);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // ── Selección masiva ──

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableIds = registrations
    .filter((r) => normalizeStatus(r.status) === "PENDING")
    .map((r) => r.id);

  const toggleSelectAll = () => {
    const allSelected =
      selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const runBulk = async (action: "approve" | "reject" | "delete", reason?: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/registrations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids, reason }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const summary =
          action === "approve"
            ? `${data.approved?.length ?? 0} aprobadas con dorsal asignado`
            : action === "reject"
            ? `${data.ok ?? 0} rechazadas`
            : `${data.ok ?? 0} eliminadas`;
        toast({
          title: "Acción masiva completada",
          description: summary + (data.fail ? ` — ${data.fail} fallaron` : ""),
        });
        setSelectedIds(new Set());
        fetchRegistrations();
      } else {
        toast({
          title: "Error",
          description: data?.error || "La acción masiva falló",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "La acción masiva falló",
        variant: "destructive",
      });
    } finally {
      setBulkWorking(false);
    }
  };

  // ── Exportaciones ──

  const handleChuckScoreExport = async () => {
    if (!eventFilter || eventFilter === "all") {
      toast({
        title: "Selecciona un evento",
        description: "Debes seleccionar un evento para exportar",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const res = await fetch(
        `/api/admin/export/chuckscore?eventId=${eventFilter}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al exportar");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ChuckScore_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: "Archivo ChuckScore descargado (solo aprobados, con caja)",
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Exportación general a Excel con TODOS los campos, respetando los
  // filtros activos del panel (evento, estado, categoría y búsqueda).
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params = new URLSearchParams();
      if (eventFilter !== "all") params.set("eventId", eventFilter);
      if (statusFilter !== "todos") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(
        `/api/admin/export/inscripciones?${params.toString()}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Error al exportar");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = ""; // usa el filename del Content-Disposition
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Archivo Excel descargado (${total} inscripciones)`,
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setExportingExcel(false);
    }
  };

  // ── Pagos sin Ficha ──

  const handleSavePayment = async () => {
    if (!payForm.reference.trim() && !payForm.payerName.trim()) {
      toast({
        title: "Falta información",
        description: "La referencia o el titular son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setPaySaving(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payForm,
          eventId: payForm.eventId || null,
          amount: parseFloat(payForm.amount) || 0,
        }),
      });
      if (res.ok) {
        toast({
          title: "Pago registrado",
          description: "Cuando llegue la inscripción con esa referencia se concilia automáticamente.",
        });
        setPayForm({
          eventId: eventFilter !== "all" ? eventFilter : "",
          method: "movil",
          reference: "",
          amount: "",
          currency: "Bs",
          payerName: "",
          payerPhone: "",
          bankName: "",
          notes: "",
        });
        fetchPayments();
      } else {
        const err = await res.json().catch(() => null);
        toast({
          title: "Error",
          description: err?.error || "No se pudo registrar el pago",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      });
    } finally {
      setPaySaving(false);
    }
  };

  const handleIgnorePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IGNORED" }),
      });
      if (res.ok) {
        fetchPayments();
      }
    } catch {
      // Silently handle
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Pago eliminado" });
        fetchPayments();
      }
    } catch {
      // Silently handle
    }
  };

  /** Aprobación de 1 clic para la inscripción conciliada */
  const handleApproveMatched = async (payment: PaymentRecordUI) => {
    if (!payment.matchedRegistrationId) return;
    setApprovingMatch(payment.id);
    const okDone = await handleStatusUpdate(
      payment.matchedRegistrationId,
      "APPROVED"
    );
    if (okDone) {
      fetchPayments();
    }
    setApprovingMatch(null);
  };

  // ── Inscripción rápida en sitio / WhatsApp ──

  const openQuickDialog = () => {
    setQuickResult(null);
    setQuickCats([]);
    setQuickForm({
      eventId: eventFilter !== "all" ? eventFilter : "",
      firstName: "",
      lastName: "",
      idNumber: "",
      gender: "",
      categoryId: "",
      shirtSize: "",
      phone: "",
      email: "",
      paymentMethod: "efectivo",
      paymentRef: "",
      totalAmount: "",
    });
    setQuickOpen(true);
  };

  // Al cambiar el evento en el dialog rápido, cargar sus categorías
  useEffect(() => {
    if (quickOpen && quickForm.eventId) {
      (async () => {
        try {
          const res = await fetch(
            `/api/admin/events/${quickForm.eventId}/categories`
          );
          if (res.ok) {
            const data = await res.json();
            setQuickCats(
              Array.isArray(data)
                ? data.map((c: Record<string, unknown>) => ({
                    id: String(c.id),
                    name: String(c.name),
                  }))
                : []
            );
          }
        } catch {
          setQuickCats([]);
        }
      })();
    } else {
      setQuickCats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickOpen, quickForm.eventId]);

  const handleQuickSubmit = async () => {
    if (!quickForm.eventId || !quickForm.firstName.trim() || !quickForm.lastName.trim() || !quickForm.idNumber.trim()) {
      toast({
        title: "Faltan datos",
        description: "Evento, nombre, apellido y cédula son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setQuickSaving(true);
    try {
      const res = await fetch("/api/admin/registrations/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quickForm,
          totalAmount: parseFloat(quickForm.totalAmount) || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setQuickResult({
          id: data.id,
          bibNumber: data.bibNumber ?? null,
          bibBoxLabel: data.bibBoxLabel ?? null,
          bibWarning: data.bibWarning,
        });
        toast({
          title: "Inscripción rápida creada",
          description:
            data.bibNumber != null
              ? `Aprobada con dorsal #${data.bibNumber} — ${data.bibBoxLabel || ""}`
              : "Aprobada (dorsal pendiente de asignación)",
        });
        fetchRegistrations();
      } else {
        toast({
          title: "Error",
          description: data?.error || "No se pudo crear la inscripción",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo crear la inscripción",
        variant: "destructive",
      });
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestión de Inscripciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa, aprueba y concilia las inscripciones de los participantes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0"
            onClick={openQuickDialog}
          >
            <Zap className="size-4" />
            Inscripción rápida en sitio
          </Button>
          {eventFilter !== "all" && (
            <Button
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                const ev = events.find((e) => e.id === eventFilter);
                if (ev?.slug) {
                  window.open(`/eventos/${ev.slug}/inscritos`, "_blank");
                }
              }}
            >
              <Users className="size-4" />
              Lista pública
            </Button>
          )}
          {eventFilter !== "all" && (
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={handleChuckScoreExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              ChuckScore (.xlsx)
            </Button>
          )}
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 shrink-0"
            onClick={handleExportExcel}
            disabled={exportingExcel}
          >
            {exportingExcel ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Exportar Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Tabs: Inscripciones | Pagos sin Ficha */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("inscripciones")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "inscripciones"
              ? "border-red-600 text-red-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="size-4" />
          Inscripciones
        </button>
        <button
          type="button"
          onClick={() => setTab("pagos")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "pagos"
              ? "border-red-600 text-red-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Landmark className="size-4" />
          Pagos sin Ficha
          {payments.filter((p) => p.status === "UNMATCHED").length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
              {payments.filter((p) => p.status === "UNMATCHED").length}
            </Badge>
          )}
        </button>
      </div>

      {tab === "inscripciones" ? (
        <>
      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cédula, nombre o dorsal..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Event Filter */}
          <Select
            value={eventFilter}
            onValueChange={(v) => handleFilterChange("event", v)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="size-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Todos los eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="APPROVED">Aprobados</SelectItem>
              <SelectItem value="REJECTED">Rechazados</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={categoryFilter}
              onValueChange={(v) => handleFilterChange("category", v)}
            >
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? "resultado" : "resultados"} encontrados
          </p>
          {statusFilter !== "todos" && (
            <button
              type="button"
              onClick={() => setStatusFilter("todos")}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Ver todos los estados
            </button>
          )}
        </div>
      </div>

      {/* Barra de acciones masivas */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
          <span className="text-sm font-semibold text-red-700">
            {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
          </span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              size="sm"
              disabled={bulkWorking}
              onClick={() => runBulk("approve")}
              className="bg-emerald-600 text-white hover:bg-emerald-700 border-0"
            >
              {bulkWorking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              Aprobar y asignar dorsales
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkWorking}
              className="border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => openRejectDialog(Array.from(selectedIds))}
            >
              <XCircle className="size-4" />
              Rechazar con motivo
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkWorking}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
              onClick={() => {
                setSelectedIds(new Set());
              }}
            >
              <X className="size-4" />
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar pendientes de la página"
                        checked={
                          selectableIds.length > 0 &&
                          selectableIds.every((id) => selectedIds.has(id))
                        }
                        onChange={toggleSelectAll}
                        disabled={selectableIds.length === 0}
                        className="size-4 accent-red-600"
                      />
                    </TableHead>
                    <TableHead className="text-xs w-12">Dorsal</TableHead>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">
                      Cédula
                    </TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">
                      Categoría
                    </TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">
                      Evento
                    </TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">
                      Pago
                    </TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No se encontraron inscripciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((reg) => {
                      const normStatus = normalizeStatus(reg.status);
                      const isSelected = selectedIds.has(reg.id);
                      return (
                        <TableRow
                          key={reg.id}
                          className={cn(isSelected && "bg-red-50/50")}
                        >
                          <TableCell>
                            {normStatus === "PENDING" ? (
                              <input
                                type="checkbox"
                                aria-label={`Seleccionar inscripción de ${getRunnerName(reg)}`}
                                checked={isSelected}
                                onChange={() => toggleSelect(reg.id)}
                                className="size-4 accent-red-600"
                              />
                            ) : null}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-bold text-muted-foreground">
                            {reg.bibNumber || "—"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {getRunnerName(reg)}
                              </p>
                              <p className="text-xs text-muted-foreground md:hidden">
                                {getRunnerCedula(reg)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {getRunnerCedula(reg)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary" className="text-xs">
                              {reg.category?.name || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                            {reg.event?.title || "—"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm">
                            <div className="flex flex-col">
                              <span>{reg.paymentMethod || "—"}</span>
                              {reg.paymentRef && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  ref {reg.paymentRef}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs whitespace-nowrap",
                                  statusColors[normStatus] ||
                                    statusColors[reg.status] ||
                                    ""
                                )}
                              >
                                {statusLabels[normStatus] ||
                                  statusLabels[reg.status] ||
                                  reg.status}
                              </Badge>
                              {reg.bibNumber && reg.bibBoxLabel ? (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  <KeyRound className="inline size-3 mr-0.5" />
                                  {reg.bibBoxLabel}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {normStatus === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-emerald-600"
                                    onClick={() =>
                                      handleStatusUpdate(reg.id, "APPROVED")
                                    }
                                    disabled={updating === reg.id}
                                    aria-label="Aprobar inscripción y asignar dorsal"
                                    title="Aprobar (asigna dorsal + caja)"
                                  >
                                    {updating === reg.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="size-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-red-600"
                                    onClick={() => openRejectDialog([reg.id])}
                                    disabled={updating === reg.id}
                                    aria-label="Rechazar inscripción con motivo"
                                    title="Rechazar (motivo obligatorio)"
                                  >
                                    <XCircle className="size-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-blue-600"
                                onClick={() => handleViewDetail(reg)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="size-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-red-600"
                                    disabled={deleting === reg.id}
                                    aria-label="Eliminar inscripción"
                                  >
                                    {deleting === reg.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      ¿Eliminar inscripción?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará permanentemente el registro
                                      de <strong>{getRunnerName(reg)}</strong>
                                      {reg.bibNumber
                                        ? ` (dorsal #${reg.bibNumber})`
                                        : ""}. Esta acción no se puede
                                      deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 text-white hover:bg-red-700"
                                      onClick={() => handleDelete(reg.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════ */
        /* BANDEJA: PAGOS SIN FICHA / CONCILIACIÓN BANCARIA        */
        /* ══════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Formulario rápido de registro de pago */}
          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Landmark className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Registrar pago detectado en el banco</h2>
                <p className="text-xs text-muted-foreground">
                  Anota en segundos transferencias o pagos móviles de personas que aún no llenan el
                  formulario — no consumen dorsales. Si luego llega una inscripción con esa referencia, se
                  concilia sola.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Evento</Label>
                <Select
                  value={payForm.eventId || "ninguno"}
                  onValueChange={(v) =>
                    setPayForm((f) => ({ ...f, eventId: v === "ninguno" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Sin evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin evento específico</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Método</Label>
                <Select
                  value={payForm.method}
                  onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Referencia *</Label>
                <Input
                  value={payForm.reference}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, reference: e.target.value }))
                  }
                  placeholder="Ej. 00881234"
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Moneda</Label>
                  <Select
                    value={payForm.currency}
                    onValueChange={(v) =>
                      setPayForm((f) => ({ ...f, currency: v }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bs">Bs</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Titular / teléfono</Label>
                <Input
                  value={payForm.payerName}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, payerName: e.target.value }))
                  }
                  placeholder="Nombre del que pagó"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={payForm.payerPhone}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, payerPhone: e.target.value }))
                  }
                  placeholder="0412-1234567"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Banco</Label>
                <Input
                  value={payForm.bankName}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, bankName: e.target.value }))
                  }
                  placeholder="Ej. Banesco"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSavePayment}
                disabled={paySaving}
                className="gradient-primary text-white border-0"
              >
                {paySaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Landmark className="size-4" />
                )}
                Registrar pago sin ficha
              </Button>
            </div>
          </div>

          {/* Lista de pagos */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
              <div className="flex items-center gap-2 text-xs">
                {["UNMATCHED", "MATCHED", "IGNORED", "todos"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPaymentsFilter(f)}
                    className={cn(
                      "px-2 py-1 rounded-md font-medium transition-colors",
                      paymentsFilter === f
                        ? "bg-red-50 text-red-600"
                        : "text-muted-foreground hover:bg-gray-50"
                    )}
                  >
                    {f === "UNMATCHED"
                      ? "Sin conciliar"
                      : f === "MATCHED"
                      ? "Conciliados"
                      : f === "IGNORED"
                      ? "Ignorados"
                      : "Todos"}
                  </button>
                ))}
              </div>
            </div>
            {paymentsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No hay pagos en esta bandeja
              </div>
            ) : (
              <div className="divide-y">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col md:flex-row md:items-center gap-2 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold">
                          {p.reference || "—"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            p.status === "UNMATCHED" &&
                              "bg-amber-100 text-amber-700 border-amber-200",
                            p.status === "MATCHED" &&
                              "bg-emerald-100 text-emerald-700 border-emerald-200",
                            p.status === "IGNORED" &&
                              "bg-gray-100 text-gray-500 border-gray-200"
                          )}
                        >
                          {p.status === "UNMATCHED"
                            ? "Sin conciliar"
                            : p.status === "MATCHED"
                            ? "Conciliado"
                            : "Ignorado"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[p.method] || p.method}
                          {p.bankName ? ` · ${p.bankName}` : ""}
                        </span>
                        {p.eventTitle && (
                          <span className="text-xs text-muted-foreground">
                            · {p.eventTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {p.payerName || "Titular desconocido"}
                        {p.payerPhone ? ` · ${p.payerPhone}` : ""}
                        {p.notes ? ` · ${p.notes}` : ""}
                        {` · ${formatDate(p.createdAt)}`}
                      </p>
                      {p.status === "MATCHED" && p.matchedRegistration && (
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Inscripción: {p.matchedRegistration.firstName}{" "}
                          {p.matchedRegistration.lastName} (
                          {p.matchedRegistration.idNumber}) —{" "}
                          {statusLabels[normalizeStatus(p.matchedRegistration.status)] ||
                            p.matchedRegistration.status}
                          {p.matchedRegistration.bibNumber
                            ? ` · Dorsal #${p.matchedRegistration.bibNumber}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.amount > 0 && (
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {p.amount.toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {p.currency}
                        </span>
                      )}
                      {p.status === "MATCHED" &&
                        p.matchedRegistration &&
                        normalizeStatus(p.matchedRegistration.status) ===
                          "PENDING" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                            disabled={approvingMatch === p.id || updating === p.matchedRegistrationId}
                            onClick={() => handleApproveMatched(p)}
                            title="Aprobar inscripción conciliada (asigna dorsal + caja)"
                          >
                            {approvingMatch === p.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Zap className="size-4" />
                            )}
                            Aprobar + dorsal
                          </Button>
                        )}
                      {p.status === "UNMATCHED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIgnorePayment(p.id)}
                          title="Marcar como ignorado"
                        >
                          <Ban className="size-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            aria-label="Eliminar pago"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará el registro de conciliación{" "}
                              <strong>{p.reference || p.payerName}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeletePayment(p.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog: rechazo con motivo obligatorio */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (!open) setRejectDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar inscripción</DialogTitle>
            <DialogDescription>
              {rejectTargetIds.length === 1
                ? "Indica el motivo del rechazo (obligatorio). El dorsal asignado se libera."
                : `Vas a rechazar ${rejectTargetIds.length} inscripciones. Indica el motivo (obligatorio).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason">Motivo del rechazo *</Label>
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. Comprobante ilegible / pago no localizado"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700 border-0"
                onClick={confirmReject}
              >
                <XCircle className="size-4" />
                Rechazar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: inscripción rápida en sitio / WhatsApp */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscripción rápida en sitio / WhatsApp</DialogTitle>
            <DialogDescription>
              Para atletas que pagan en la puerta o por WhatsApp: nace aprobada
              con dorsal y caja asignados al instante.
            </DialogDescription>
          </DialogHeader>

          {quickResult ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle className="mx-auto size-8 text-emerald-600" />
                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  Inscripción creada y aprobada
                </p>
                {quickResult.bibNumber != null ? (
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    Dorsal #{quickResult.bibNumber}
                    <span className="ml-2 text-sm font-medium text-gray-600">
                      {quickResult.bibBoxLabel}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    {quickResult.bibWarning || "Dorsal pendiente de asignación"}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setQuickOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Evento *</Label>
                <Select
                  value={quickForm.eventId || "ninguno"}
                  onValueChange={(v) =>
                    setQuickForm((f) => ({
                      ...f,
                      eventId: v === "ninguno" ? "" : v,
                      categoryId: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecciona el evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno" disabled>
                      Selecciona el evento
                    </SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input
                  value={quickForm.firstName}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apellido *</Label>
                <Input
                  value={quickForm.lastName}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cédula *</Label>
                <Input
                  value={quickForm.idNumber}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, idNumber: e.target.value }))
                  }
                  placeholder="V-12345678"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Género</Label>
                <Select
                  value={quickForm.gender || "n/a"}
                  onValueChange={(v) =>
                    setQuickForm((f) => ({ ...f, gender: v === "n/a" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n/a">—</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={quickForm.categoryId || "sin-cat"}
                  onValueChange={(v) =>
                    setQuickForm((f) => ({
                      ...f,
                      categoryId: v === "sin-cat" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cat">Sin categoría</SelectItem>
                    {quickCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={quickForm.phone}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="0412-1234567"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Método de pago</Label>
                <Select
                  value={quickForm.paymentMethod}
                  onValueChange={(v) =>
                    setQuickForm((f) => ({ ...f, paymentMethod: v }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Referencia</Label>
                <Input
                  value={quickForm.paymentRef}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, paymentRef: e.target.value }))
                  }
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monto (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quickForm.totalAmount}
                  onChange={(e) =>
                    setQuickForm((f) => ({ ...f, totalAmount: e.target.value }))
                  }
                  placeholder="Precio del evento por omisión"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 md:col-span-2 pt-2">
                <Button variant="outline" onClick={() => setQuickOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleQuickSubmit}
                  disabled={quickSaving}
                  className="gradient-primary text-white border-0"
                >
                  {quickSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                  Crear y aprobar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Inscripción</DialogTitle>
            <DialogDescription>
              Información completa del participante
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (
            <div className="space-y-4 py-2">
              {/* Status & Bib */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm",
                    statusColors[normalizeStatus(selectedReg.status)] || ""
                  )}
                >
                  {statusLabels[normalizeStatus(selectedReg.status)] ||
                    selectedReg.status}
                </Badge>
                {selectedReg.bibNumber && (
                  <>
                    <Badge variant="secondary" className="text-sm">
                      Dorsal #{selectedReg.bibNumber}
                    </Badge>
                    {selectedReg.bibBoxLabel && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                        <KeyRound className="mr-1 size-3" />
                        {selectedReg.bibBoxLabel}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {normalizeStatus(selectedReg.status) === "REJECTED" &&
                selectedReg.rejectReason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <strong>Motivo del rechazo:</strong> {selectedReg.rejectReason}
                  </div>
                )}

              <Separator />

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <User className="size-4 text-red-500" />
                  Datos Personales
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField
                    label="Nombre"
                    value={getRunnerName(selectedReg)}
                  />
                  <DetailField
                    label="Cédula"
                    value={getRunnerCedula(selectedReg)}
                  />
                  <DetailField
                    label="Email"
                    value={
                      selectedReg.runner?.email || selectedReg.email || ""
                    }
                  />
                  <DetailField
                    label="Teléfono"
                    value={
                      selectedReg.runner?.telefono || selectedReg.phone || ""
                    }
                  />
                  <DetailField
                    label="Género"
                    value={
                      selectedReg.runner?.genero || selectedReg.gender || ""
                    }
                  />
                  <DetailField
                    label="Fecha de Nacimiento"
                    value={
                      selectedReg.runner?.fechaNacimiento
                        ? formatDate(selectedReg.runner.fechaNacimiento)
                        : selectedReg.dateOfBirth || ""
                    }
                  />
                  <DetailField
                    label="Talla Franela"
                    value={
                      selectedReg.shirtSize ||
                      selectedReg.runner?.tallaFranela ||
                      ""
                    }
                  />
                  <DetailField
                    label="Equipo"
                    value={
                      selectedReg.runner?.team || selectedReg.team || ""
                    }
                  />
                  <DetailField
                    label="Ciudad"
                    value={selectedReg.runner?.ciudad || ""}
                  />
                  {selectedReg.runner?.licenciaFederativa && (
                    <DetailField
                      label="Licencia Federativa"
                      value={selectedReg.runner.licenciaFederativa}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Category & Event Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Calendar className="size-4 text-red-500" />
                  Evento y Categoría
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField
                    label="Evento"
                    value={selectedReg.event?.title || ""}
                  />
                  <DetailField
                    label="Categoría"
                    value={selectedReg.category?.name || ""}
                  />
                  <DetailField
                    label="Fecha de Registro"
                    value={formatDate(selectedReg.createdAt)}
                  />
                  {selectedReg.chipCode && (
                    <DetailField
                      label="Chip Code"
                      value={selectedReg.chipCode}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <CreditCard className="size-4 text-red-500" />
                  Información de Pago
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField
                    label="Método de Pago"
                    value={selectedReg.paymentMethod}
                  />
                  <DetailField
                    label="Referencia"
                    value={selectedReg.paymentRef}
                  />
                  <DetailField
                    label="Monto Total"
                    value={
                      selectedReg.totalAmount
                        ? `$${selectedReg.totalAmount.toFixed(2)}`
                        : ""
                    }
                  />
                  <DetailField
                    label="Franela"
                    value={selectedReg.hasShirt ? "Sí" : "No"}
                  />
                </div>

                {/* Payment Proof Preview */}
                {selectedReg.paymentProofUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Comprobante de Pago
                    </p>
                    <a
                      href={selectedReg.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <div className="relative w-32 h-24 rounded-lg overflow-hidden border hover:ring-2 hover:ring-red-400 transition-all">
                        <img
                          src={selectedReg.paymentProofUrl}
                          alt="Comprobante de pago"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <ImageIcon className="size-6 text-white" />
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Heart className="size-4 text-red-500" />
                  Contacto de Emergencia
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField
                    label="Nombre"
                    value={
                      selectedReg.runner?.contactoEmergenciaNombre ||
                      selectedReg.emergencyContact ||
                      ""
                    }
                  />
                  <DetailField
                    label="Teléfono"
                    value={
                      selectedReg.runner?.contactoEmergenciaTelefono ||
                      selectedReg.emergencyPhone ||
                      ""
                    }
                  />
                  {selectedReg.runner?.contactoEmergenciaParentesco && (
                    <DetailField
                      label="Parentesco"
                      value={selectedReg.runner.contactoEmergenciaParentesco}
                    />
                  )}
                </div>
              </div>

              {/* Blood Type */}
              {selectedReg.runner?.grupoSanguineo && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                      <Droplets className="size-4 text-red-500" />
                      Ficha Médica
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <DetailField
                        label="Grupo Sanguíneo"
                        value={selectedReg.runner.grupoSanguineo}
                      />
                      {selectedReg.runner.alergiasCondiciones && (
                        <DetailField
                          label="Alergias/Condiciones"
                          value={selectedReg.runner.alergiasCondiciones}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              {normalizeStatus(selectedReg.status) === "PENDING" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedReg.id, "APPROVED");
                      setDetailOpen(false);
                    }}
                    disabled={updating === selectedReg.id}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                  >
                    {updating === selectedReg.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    Aprobar (asigna dorsal)
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      openRejectDialog([selectedReg.id]);
                    }}
                    disabled={updating === selectedReg.id}
                    className="flex-1"
                  >
                    <XCircle className="size-4" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}
