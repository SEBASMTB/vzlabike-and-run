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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  chipCode: string | null;
  shirtSize: string | null;
  hasShirt: boolean;
  totalAmount: number;
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
}

interface CategoryData {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  // Legacy lowercase fallback
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
  return new Date(dateStr).toLocaleDateString("es-VE", {
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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventsData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [exporting, setExporting] = useState(false);

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
        // Handle both EventCategory (raw SQL) and Category (Prisma) formats
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Fetch categories when event filter changes
  useEffect(() => {
    if (eventFilter !== "all") {
      fetchCategories(eventFilter);
    } else {
      setCategories([]);
      setCategoryFilter("all");
    }
  }, [eventFilter, fetchCategories]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({
          title: "Estado actualizado",
          description: `Inscripción ${statusLabels[newStatus] || newStatus}`,
        });
        fetchRegistrations();
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
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
        description: "Archivo ChuckScore descargado",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestión de Inscripciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa y gestiona las inscripciones de los participantes
          </p>
        </div>
        {eventFilter !== "all" && (
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 shrink-0"
            onClick={handleChuckScoreExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Exportar ChuckScore (.xlsx)
          </Button>
        )}
      </div>

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
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="APPROVED">Aprobado</SelectItem>
              <SelectItem value="REJECTED">Rechazado</SelectItem>
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

        {/* Results count */}
        <p className="text-xs text-muted-foreground mt-3">
          {total} {total === 1 ? "resultado" : "resultados"} encontrados
        </p>
      </div>

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
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No se encontraron inscripciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((reg) => {
                      const normStatus = normalizeStatus(reg.status);
                      return (
                        <TableRow key={reg.id}>
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
                            {reg.paymentMethod || "—"}
                          </TableCell>
                          <TableCell>
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
                                    aria-label="Aprobar inscripción"
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
                                    onClick={() =>
                                      handleStatusUpdate(reg.id, "REJECTED")
                                    }
                                    disabled={updating === reg.id}
                                    aria-label="Rechazar inscripción"
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
              <div className="flex items-center gap-3">
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
                  <Badge variant="secondary" className="text-sm">
                    Dorsal #{selectedReg.bibNumber}
                  </Badge>
                )}
              </div>

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
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleStatusUpdate(selectedReg.id, "REJECTED");
                      setDetailOpen(false);
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
