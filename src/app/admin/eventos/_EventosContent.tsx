"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategoriesByGender,
  getCategoriesForSport,
  parseEventCategories,
  serializeEventCategories,
  getCategoryPresets,
  type CategoryOption,
  type CategoryPreset,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  distance: string;
  category: string;
  sportType: string;
  imageUrl: string;
  bannerImage: string;
  price: number;
  priceBs: number;
  status: string;
  maxParticipants: number;
  featured: boolean;
  organizer: string;
  prizes: string;
  rules: string;
  kitInfo: string;
  sponsors: string;
  categories: string;
  ageCalcMode: string;
  categoryInterval: string;
  hasShirt: boolean;
  _count?: { registrations: number };
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  distance: string;
  category: string;
  sportType: string;
  imageUrl: string;
  bannerImage: string;
  bannerHorizontalUrl: string;
  bannerVerticalUrl: string;
  price: number;
  priceBs: number;
  status: string;
  maxParticipants: number;
  featured: boolean;
  organizer: string;
  prizes: string;
  rules: string;
  kitInfo: string;
  sponsors: string;
  categories: string;
  ageCalcMode: string;
  categoryInterval: string;
  hasShirt: boolean;
  hasShirtOption: string; // 'INCLUDED' | 'OPTIONAL' | 'NONE'
  shirtPrice: number;
  requiresFederationLicense: boolean;
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  description: "",
  date: "",
  location: "",
  distance: "",
  category: "",
  sportType: "",
  imageUrl: "",
  bannerImage: "",
  bannerHorizontalUrl: "",
  bannerVerticalUrl: "",
  price: 0,
  priceBs: 0,
  status: "upcoming",
  maxParticipants: 500,
  featured: false,
  organizer: "",
  prizes: "",
  rules: "",
  kitInfo: "",
  sponsors: "",
  categories: "",
  ageCalcMode: "calendar_year",
  categoryInterval: "10",
  hasShirt: true,
  hasShirtOption: "OPTIONAL",
  shirtPrice: 0,
  requiresFederationLicense: false,
};

// ============================================================
// Constants
// ============================================================
const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  upcoming: "Próximo",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

const sportTypeLabels: Record<string, string> = {
  running: "Running / Carrera",
  mtb: "MTB / Ciclismo",
  "mtb-ruta": "MTB + Ruta (Combinado)",
  trekking: "Trekking / Trail",
  triathlon: "Triatlón",
  duathlon: "Duatlón",
  aquathlon: "Acuatlón",
  virtual: "Virtual",
  trail: "Trail Running",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Parsea formData.categories (JSON) a CategoryOption[]
function parseFormDataCategories(catsStr: string, sportType: string = "running"): CategoryOption[] {
  if (!catsStr || !catsStr.trim()) return [];
  return parseEventCategories(catsStr, sportType);
}

// ============================================================
// Main Component
// ============================================================
export default function AdminEventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBannerH, setUploadingBannerH] = useState(false);
  const [uploadingBannerV, setUploadingBannerV] = useState(false);
  const [formError, setFormError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerHInputRef = useRef<HTMLInputElement>(null);
  const bannerVInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ---- Handlers ----
  const handleNew = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      description: event.description,
      date: event.date ? event.date.split("T")[0] : "",
      location: event.location,
      distance: event.distance,
      category: event.category || event.sportType,
      sportType: event.sportType || "running",
      imageUrl: event.imageUrl || "",
      bannerImage: event.bannerImage || "",
      price: event.price,
      priceBs: event.priceBs || 0,
      status: event.status,
      maxParticipants: event.maxParticipants,
      featured: event.featured,
      organizer: event.organizer || "",
      prizes: event.prizes || "",
      rules: event.rules || "",
      kitInfo: event.kitInfo || "",
      sponsors: event.sponsors || "",
      categories: event.categories || "",
      ageCalcMode: event.ageCalcMode || "calendar_year",
      categoryInterval: (event as any).categoryInterval || "10",
      hasShirt: event.hasShirt !== undefined ? event.hasShirt : true,
      hasShirtOption: (event as any).hasShirtOption || "OPTIONAL",
      shirtPrice: (event as any).shirtPrice || 0,
      requiresFederationLicense: (event as any).requiresFederationLicense || false,
      bannerHorizontalUrl: (event as any).bannerHorizontalUrl || "",
      bannerVerticalUrl: (event as any).bannerVerticalUrl || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setDeleteTarget(event);
    setDeleteOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingEvent ? prev.slug : generateSlug(title),
    }));
  };

  const handleSportTypeChange = (sportType: string) => {
    setFormData((prev) => ({
      ...prev,
      sportType,
      category: sportType,
      categoryInterval: prev.categoryInterval || "10",
      // MTB + Ruta: dejar categorías en BLANCO para que el admin las cree manualmente
      categories: sportType === "mtb-ruta" ? "" : prev.categories,
    }));
    // Auto-load default preset categories for this sport type (excepto mtb-ruta)
    if (sportType !== "mtb-ruta") {
      const presets = getCategoryPresets(sportType);
      if (presets.length > 0) {
        const defaultPreset = presets[0];
        setFormData((prev) => ({
          ...prev,
          categories: serializeEventCategories(defaultPreset.categories),
        }));
      }
    }
  };

  const handlePresetChange = (presetId: string) => {
    const presets = getCategoryPresets(formData.sportType);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        categories: serializeEventCategories(preset.categories),
      }));
    }
  };

  const handleIntervalChange = (interval: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryInterval: interval,
      categories: "", // Reset categories when interval changes
    }));
  };

  const handleCategoryToggle = (cat: CategoryOption) => {
    setFormData((prev) => {
      const selected = parseFormDataCategories(prev.categories, formData.sportType);
      const exists = selected.find((c) => c.value === cat.value);
      const updated = exists
        ? selected.filter((c) => c.value !== cat.value)
        : [...selected, cat];
      return { ...prev, categories: serializeEventCategories(updated) };
    });
  };

  const handleSelectAllGender = (gender: "male" | "female" | "open") => {
    const interval = (formData.categoryInterval as "5" | "10") || "10";
    const grouped = getCategoriesByGender(formData.sportType);
    const sportCats = getCategoriesForSport(formData.sportType, interval);
    const genderCats = gender === "male"
      ? sportCats.filter(c => c.gender === "M")
      : gender === "female"
        ? sportCats.filter(c => c.gender === "F")
        : sportCats.filter(c => !c.gender);
    const values = genderCats.map((c) => c.value);

    setFormData((prev) => {
      const selected = parseFormDataCategories(prev.categories, formData.sportType);
      const allSelected = genderCats.every((c) =>
        selected.find((s) => s.value === c.value)
      );
      const updated = allSelected
        ? selected.filter((c) => !values.includes(c.value))
        : [...selected, ...genderCats.filter((gc) => !selected.find((s) => s.value === gc.value))];
      return { ...prev, categories: serializeEventCategories(updated) };
    });
  };

  // Agregar categoría personalizada
  const [customCatName, setCustomCatName] = useState("");
  const [customCatMinAge, setCustomCatMinAge] = useState("");
  const [customCatMaxAge, setCustomCatMaxAge] = useState("");
  const [customCatGender, setCustomCatGender] = useState<string>("");

  const handleAddCustomCategory = () => {
    if (!customCatName.trim()) return;
    const minAge = parseInt(customCatMinAge) || 0;
    const maxAge = parseInt(customCatMaxAge) || 999;
    const value = `CUSTOM-${Date.now()}`;
    const gender = customCatGender === "open" ? undefined : (customCatGender === "M" ? "M" : customCatGender === "F" ? "F" : undefined);
    const newCat: CategoryOption = {
      value,
      label: customCatName.trim(),
      minAge,
      maxAge,
      gender,
    };
    setFormData((prev) => {
      const selected = parseFormDataCategories(prev.categories, formData.sportType);
      const updated = [...selected, newCat];
      return { ...prev, categories: serializeEventCategories(updated) };
    });
    setCustomCatName("");
    setCustomCatMinAge("");
    setCustomCatMaxAge("");
    setCustomCatGender("");
  };

  const handleRemoveCategory = (catValue: string) => {
    setFormData((prev) => {
      const selected = parseFormDataCategories(prev.categories, formData.sportType);
      const updated = selected.filter((c) => c.value !== catValue);
      return { ...prev, categories: serializeEventCategories(updated) };
    });
  };

  // ---- Image Upload (with client-side compression) ----
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;

          // Scale down if wider than maxWidth
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0, w, h);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File, type: "card" | "banner") => {
    if (type === "banner") setUploadingBanner(true);
    else setUploadingImage(true);

    try {
      // Check initial file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        setFormError("La imagen es muy pesada (máximo 5MB). Reduce el tamaño antes de subir.");
        return;
      }

      // Compress: max 1200px for banner, 800px for card, JPEG quality 0.75
      const maxWidth = type === "banner" ? 1200 : 800;
      const dataUrl = await compressImage(file, maxWidth, 0.75);

      if (type === "banner") {
        setFormData((prev) => ({ ...prev, bannerImage: dataUrl }));
      } else {
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      }
    } catch (err) {
      setFormError("Error al procesar la imagen. Intenta con otra imagen o usa una URL directa.");
    } finally {
      setUploadingImage(false);
      setUploadingBanner(false);
    }
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    setFormError("");

    // Auto-generate slug from title if empty
    let finalSlug = formData.slug;
    if (!finalSlug && formData.title) {
      finalSlug = generateSlug(formData.title);
    }

    if (!formData.title || !finalSlug || !formData.date || !formData.location || !formData.distance) {
      setFormError("Completa todos los campos obligatorios (Título, Slug/URL, Fecha, Ubicación, Distancia)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        slug: finalSlug,
        date: new Date(formData.date).toISOString(),
      };

      const url = editingEvent
        ? `/api/admin/events/${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.detail ? `${data.error} — ${data.detail}` : data.error || `Error al ${editingEvent ? "actualizar" : "crear"} el evento (${res.status})`;
        setFormError(errorMsg);
      }
    } catch (err) {
      setFormError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteOpen(false);
        setDeleteTarget(null);
        fetchEvents();
      }
    } catch {
      // Silently handle
    }
  };

  // ---- Filter ----
  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      (e.sportType || e.category).toLowerCase().includes(search.toLowerCase())
  );

  // ---- Categories for current sport ----
  const hasSportType = formData.sportType && formData.sportType.trim() !== "";
  const availablePresets = hasSportType ? getCategoryPresets(formData.sportType) : [];
  const selectedCats = parseFormDataCategories(formData.categories, formData.sportType);
  const selectedCatValues = selectedCats.map((c) => c.value);
  const interval = (formData.categoryInterval as "5" | "10") || "10";
  const sportCategories = hasSportType ? getCategoriesForSport(formData.sportType, interval) : [];
  const groupedCats = {
    male: sportCategories.filter(c => c.gender === "M"),
    female: sportCategories.filter(c => c.gender === "F"),
    open: sportCategories.filter(c => !c.gender),
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestión de Eventos
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra todos los eventos de la plataforma
          </p>
        </div>
        <Link href="/admin/eventos/nuevo">
          <Button className="gradient-primary text-white border-0 hover:opacity-90 shrink-0">
            <Plus className="size-4" />
            Nuevo Evento
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Events Table */}
      <CardWrapper>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-16">Img</TableHead>
                  <TableHead className="text-xs">Título</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Ubicación</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Deporte</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Precio</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Inscritos</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {search ? "No se encontraron eventos" : "No hay eventos registrados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt={event.title} className="size-10 rounded-lg object-cover" />
                        ) : (
                          <div className="size-10 rounded-lg bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center">
                            <ImageIcon className="size-4 text-white" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatDate(event.date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                        {event.location}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {sportTypeLabels[event.sportType] || event.sportType || event.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm font-medium">
                        ${event.price.toFixed(0)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="size-3.5 text-muted-foreground" />
                          {event._count?.registrations || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs whitespace-nowrap", statusColors[event.status] || "")}
                        >
                          {statusLabels[event.status] || event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/eventos/${event.id}/editar`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-blue-600"
                              aria-label="Editar evento"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDelete(event)}
                            aria-label="Eliminar evento"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardWrapper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Modifica los datos del evento" : "Completa los datos para crear un nuevo evento"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* ---- BASIC INFO ---- */}
            <SectionTitle>Información Básica</SectionTitle>

            <div className="sm:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Nombre del evento" className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))} placeholder="url-del-evento" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="location">Ubicación *</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} placeholder="Ciudad, Estado" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="distance">Distancia *</Label>
              <Input id="distance" value={formData.distance} onChange={(e) => setFormData((p) => ({ ...p, distance: e.target.value }))} placeholder="Ej: 5K, 10K, 21K" className="mt-1" />
            </div>

            <div>
              <Label>Tipo de Deporte</Label>
              <Select value={formData.sportType} onValueChange={handleSportTypeChange}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sportTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Intervalo de Categorías por Edad</Label>
              <Select value={formData.categoryInterval} onValueChange={handleIntervalChange}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Cada 10 años (20-29, 30-39, 40-49...)</SelectItem>
                  <SelectItem value="5">Cada 5 años (20-24, 25-29, 30-34...)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxParticipants">Máx. Participantes</Label>
              <Input id="maxParticipants" type="number" min={1} value={formData.maxParticipants} onChange={(e) => setFormData((p) => ({ ...p, maxParticipants: parseInt(e.target.value) || 500 }))} className="mt-1" />
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximo</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ---- PRICING ---- */}
            <SectionTitle>Precios</SectionTitle>

            <div>
              <Label htmlFor="price">Precio (USD)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setFormData((p) => ({ ...p, price: parseFloat(val) || 0 }));
                  }}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priceBs">Precio (Bs)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Bs.</span>
                <Input
                  id="priceBs"
                  type="text"
                  inputMode="decimal"
                  value={formData.priceBs || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setFormData((p) => ({ ...p, priceBs: parseFloat(val) || 0 }));
                  }}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>

            {/* ---- IMAGES ---- */}
            <SectionTitle>Imágenes</SectionTitle>

            {/* Card Image Upload */}
            <div>
              <Label>Imagen del Evento</Label>
              <div className="mt-1 flex items-center gap-3">
                {formData.imageUrl ? (
                  <div className="relative">
                    <img src={formData.imageUrl} alt="Preview" className="size-16 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, imageUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "card");
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    {uploadingImage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Banner Image Upload */}
            <div>
              <Label>Banner del Evento</Label>
              <div className="mt-1 flex items-center gap-3">
                {formData.bannerImage ? (
                  <div className="relative">
                    <img src={formData.bannerImage} alt="Banner Preview" className="size-16 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, bannerImage: "" }))}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "banner");
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="w-full"
                  >
                    {uploadingBanner ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {uploadingBanner ? "Subiendo..." : "Subir Banner"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Image URL fallback */}
            <div className="sm:col-span-2">
              <Label htmlFor="imageUrl">URL de Imagen (alternativa)</Label>
              <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://ejemplo.com/imagen.jpg" className="mt-1" />
            </div>

            {/* ---- CATEGORIES ---- */}
            <SectionTitle>Categorías del Evento</SectionTitle>

            {!hasSportType ? (
              <div className="sm:col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Primero selecciona el <strong>Tipo de Deporte</strong> arriba para ver y configurar las categorías.
                </p>
              </div>
            ) : (
              <>
            {/* Preset Selector */}
            {availablePresets.length > 1 && (
              <div className="sm:col-span-2">
                <Label>Plantilla de Categorías</Label>
                <Select onValueChange={handlePresetChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Selecciona una plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Al cambiar la plantilla se reemplazan todas las categorías seleccionadas.
                </p>
              </div>
            )}

            {/* Preset categories info */}
            {formData.sportType === "mtb-ruta" ? (
              <div className="sm:col-span-2 border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-blue-50/50">
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  MTB + Ruta (Combinado) — Categorías en Blanco
                </p>
                <p className="text-xs text-blue-600">
                  No hay categorías predefinidas para este tipo de evento. Usa el formulario de abajo para crear tus categorías personalizadas una por una.
                </p>
              </div>
            ) : (
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                Deporte: <span className="font-semibold">{sportTypeLabels[formData.sportType] || formData.sportType}</span>
                {" — "}{selectedCats.length} categoría(s) seleccionada(s) de {groupedCats.male.length + groupedCats.female.length + groupedCats.open.length} disponibles
                <br />
                Haz clic en las categorías para activarlas, o agrega categorías personalizadas abajo.
              </div>
            )}

            {/* Male Categories */}
            {groupedCats.male.length > 0 && (
              <div className="sm:col-span-2 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
                    Varones ({groupedCats.male.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSelectAllGender("male")}
                  >
                    {groupedCats.male.every((c) => selectedCatValues.includes(c.value)) ? "Limpiar" : "Marcar todas"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {groupedCats.male.map((cat) => (
                    <CategoryChip
                      key={cat.value}
                      cat={cat}
                      selected={selectedCatValues.includes(cat.value)}
                      onToggle={() => handleCategoryToggle(cat)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Female Categories */}
            {groupedCats.female.length > 0 && (
              <div className="sm:col-span-2 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-pink-500 inline-block" />
                    Damas ({groupedCats.female.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSelectAllGender("female")}
                  >
                    {groupedCats.female.every((c) => selectedCatValues.includes(c.value)) ? "Limpiar" : "Marcar todas"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {groupedCats.female.map((cat) => (
                    <CategoryChip
                      key={cat.value}
                      cat={cat}
                      selected={selectedCatValues.includes(cat.value)}
                      onToggle={() => handleCategoryToggle(cat)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Open Categories */}
            {groupedCats.open.length > 0 && (
              <div className="sm:col-span-2 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
                    Abiertas ({groupedCats.open.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSelectAllGender("open")}
                  >
                    {groupedCats.open.every((c) => selectedCatValues.includes(c.value)) ? "Limpiar" : "Marcar todas"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {groupedCats.open.map((cat) => (
                    <CategoryChip
                      key={cat.value}
                      cat={cat}
                      selected={selectedCatValues.includes(cat.value)}
                      onToggle={() => handleCategoryToggle(cat)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Category */}
            <div className="sm:col-span-2 border-2 border-dashed border-amber-300 rounded-lg p-3 bg-amber-50/50">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <Plus className="size-4" />
                Agregar Categoría Personalizada
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Nombre *</Label>
                  <Input
                    placeholder="Ej: Organismos de Seguridad"
                    value={customCatName}
                    onChange={(e) => setCustomCatName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Edad mínima</Label>
                  <Input
                    placeholder="15"
                    type="number"
                    value={customCatMinAge}
                    onChange={(e) => setCustomCatMinAge(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Edad máxima</Label>
                  <Input
                    placeholder="999 (sin límite)"
                    type="number"
                    value={customCatMaxAge}
                    onChange={(e) => setCustomCatMaxAge(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Género</Label>
                    <Select value={customCatGender} onValueChange={setCustomCatGender}>
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Todos</SelectItem>
                        <SelectItem value="M">Varones</SelectItem>
                        <SelectItem value="F">Damas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0 mb-0"
                    onClick={handleAddCustomCategory}
                    disabled={!customCatName.trim()}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected Categories Summary */}
            {selectedCats.length > 0 && (
              <div className="sm:col-span-2 border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    {selectedCats.length} categoría(s) activa(s) para este evento
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-destructive hover:text-destructive"
                    onClick={() => setFormData((p) => ({ ...p, categories: "" }))}
                  >
                    <Trash2 className="size-3 mr-1" />
                    Limpiar todas
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCats.map((cat) => (
                    <Badge
                      key={cat.value}
                      variant="secondary"
                      className={cn(
                        "text-xs pl-2 pr-1 py-1 flex items-center gap-1",
                        cat.gender === "M" ? "bg-blue-100 text-blue-700" :
                        cat.gender === "F" ? "bg-pink-100 text-pink-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {cat.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.value)}
                        className="ml-0.5 size-4 rounded-full hover:bg-black/10 flex items-center justify-center"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            </>
            )}

            {/* ---- AGE CALCULATION MODE ---- */}
            <SectionTitle>Cálculo de Edad</SectionTitle>
            <div className="sm:col-span-2">
              <div className="flex items-start gap-3 border rounded-lg p-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Modo de cálculo de edad para categorías</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define cómo se calcula la edad del participante para asignar la categoría correspondiente.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, ageCalcMode: "calendar_year" }))}
                      className={cn(
                        "text-left p-3 rounded-lg border-2 transition-all",
                        formData.ageCalcMode === "calendar_year"
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className="text-sm font-semibold">Año Calendario</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edad = Año del evento - Año de nacimiento. No importa si ya cumplió años en el año del evento.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, ageCalcMode: "event_day" }))}
                      className={cn(
                        "text-left p-3 rounded-lg border-2 transition-all",
                        formData.ageCalcMode === "event_day"
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className="text-sm font-semibold">Edad Exacta al Día del Evento</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edad = Fecha del evento - Fecha de nacimiento. Se usa la edad exacta cumplida.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- SHIRT / FRANELA CONFIG ---- */}
            <SectionTitle>Configuración de Kit / Franela</SectionTitle>

            <div className="sm:col-span-2">
              <Label>Modalidad de Franela Oficial</Label>
              <Select
                value={formData.hasShirtOption}
                onValueChange={(v) => {
                  setFormData((p) => ({
                    ...p,
                    hasShirtOption: v,
                    hasShirt: v !== "NONE",
                    shirtPrice: v === "INCLUDED" ? 0 : p.shirtPrice,
                  }));
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCLUDED">Incluida — La franela viene incluida en la inscripción (talla obligatoria)</SelectItem>
                  <SelectItem value="OPTIONAL">Opcional — El atleta decide si la quiere por un precio adicional</SelectItem>
                  <SelectItem value="NONE">Sin franela — No se ofrece franela en este evento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.hasShirtOption === "OPTIONAL" && (
              <div>
                <Label htmlFor="shirtPrice">Precio Franela Adicional (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">+$</span>
                  <Input
                    id="shirtPrice"
                    type="text"
                    inputMode="decimal"
                    value={formData.shirtPrice || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setFormData((p) => ({ ...p, shirtPrice: parseFloat(val) || 0 }));
                    }}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se sumará al precio base de inscripción si el atleta selecciona la franela.
                </p>
              </div>
            )}

            {/* ---- FEDERATION LICENSE ---- */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Label className="text-sm font-medium">Requiere Carnet/Licencia Federativa</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Si activas esto, los participantes deberán ingresar su N° de licencia federativa al inscribirse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, requiresFederationLicense: !p.requiresFederationLicense }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                    formData.requiresFederationLicense ? "bg-red-500" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                      formData.requiresFederationLicense ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* ---- BANNERS ---- */}
            <SectionTitle>Banners / Afiches del Evento</SectionTitle>

            {/* Banner Horizontal (Hero) */}
            <div>
              <Label>Banner Horizontal (Hero)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">Imagen wide para la cabecera del evento (1200×400 aprox.)</p>
              <div className="flex items-center gap-3">
                {formData.bannerHorizontalUrl ? (
                  <div className="relative">
                    <img src={formData.bannerHorizontalUrl} alt="Banner H" className="h-16 w-28 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, bannerHorizontalUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <input
                    ref={bannerHInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingBannerH(true);
                        try {
                          const dataUrl = await compressImage(file, 1200, 0.8);
                          setFormData((p) => ({ ...p, bannerHorizontalUrl: dataUrl }));
                        } catch {} finally { setUploadingBannerH(false); }
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => bannerHInputRef.current?.click()} disabled={uploadingBannerH} className="w-full">
                    {uploadingBannerH ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploadingBannerH ? "Subiendo..." : "Subir Banner H"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Banner Vertical (Afiche/Infografía) */}
            <div>
              <Label>Afiche Vertical (Infografía)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">Afiche vertical para compartir en redes (800×1200 aprox.)</p>
              <div className="flex items-center gap-3">
                {formData.bannerVerticalUrl ? (
                  <div className="relative">
                    <img src={formData.bannerVerticalUrl} alt="Banner V" className="h-16 w-12 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, bannerVerticalUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <input
                    ref={bannerVInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingBannerV(true);
                        try {
                          const dataUrl = await compressImage(file, 800, 0.8);
                          setFormData((p) => ({ ...p, bannerVerticalUrl: dataUrl }));
                        } catch {} finally { setUploadingBannerV(false); }
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => bannerVInputRef.current?.click()} disabled={uploadingBannerV} className="w-full">
                    {uploadingBannerV ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploadingBannerV ? "Subiendo..." : "Subir Afiche V"}
                  </Button>
                </div>
              </div>
            </div>

            {/* ---- ADDITIONAL INFO ---- */}
            <SectionTitle>Información Adicional</SectionTitle>

            <div className="sm:col-span-2">
              <Label htmlFor="organizer">Organizador</Label>
              <Input id="organizer" value={formData.organizer} onChange={(e) => setFormData((p) => ({ ...p, organizer: e.target.value }))} placeholder="Nombre del organizador" className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="sponsors">Patrocinadores</Label>
              <Input id="sponsors" value={formData.sponsors} onChange={(e) => setFormData((p) => ({ ...p, sponsors: e.target.value }))} placeholder="Nombre de patrocinadores" className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción del evento..." rows={3} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="prizes">Premios</Label>
              <Textarea id="prizes" value={formData.prizes} onChange={(e) => setFormData((p) => ({ ...p, prizes: e.target.value }))} placeholder="Descripción de premios..." rows={2} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="rules">Reglas</Label>
              <Textarea id="rules" value={formData.rules} onChange={(e) => setFormData((p) => ({ ...p, rules: e.target.value }))} placeholder="Reglas del evento..." rows={2} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="kitInfo">Información del Kit</Label>
              <Textarea id="kitInfo" value={formData.kitInfo} onChange={(e) => setFormData((p) => ({ ...p, kitInfo: e.target.value }))} placeholder="Qué incluye el kit de participante..." rows={2} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, featured: checked === true }))}
                />
                <Label htmlFor="featured" className="cursor-pointer">Evento Destacado</Label>
              </div>
            </div>
          </div>

          {formError && (
            <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {formError}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.title || !formData.date || !formData.location || !formData.distance}
              className="gradient-primary text-white border-0 hover:opacity-90"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </span>
              ) : editingEvent ? "Actualizar Evento" : "Crear Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el evento{" "}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>{" "}
              y todas sus inscripciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================
function CardWrapper({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border shadow-sm overflow-hidden">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 pt-2 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground border-b pb-1">{children}</h3>
    </div>
  );
}

function CategoryChip({
  cat,
  selected,
  onToggle,
}: {
  cat: CategoryOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150",
        selected
          ? cat.gender === "M"
            ? "bg-blue-100 border-blue-300 text-blue-800"
            : cat.gender === "F"
              ? "bg-pink-100 border-pink-300 text-pink-800"
              : "bg-emerald-100 border-emerald-300 text-emerald-800"
          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
      )}
    >
      {cat.label}
    </button>
  );
}
