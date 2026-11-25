"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Info,
  Shirt,
  Image as ImageIcon,
  Trophy,
  FileText,
  Package,
  HandCoins,
  UploadCloud,
  Users,
  Bike,
  Activity,
  Zap,
  Radio,
  Hash,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  accountLabel,
  PAYMENT_METHOD_LABELS,
  type PaymentAccount,
} from "@/lib/payment-accounts";
import {
  getCategoryPresets,
  type CategoryPreset,
  type CategoryOption,
} from "@/lib/categories";

// ============================================================
// Types
// ============================================================

interface CategoryRow {
  id?: string; // existing ID for edit mode
  name: string;
  minAge: number;
  maxAge: number;
  gender: string; // M, F, MIXTO
  distanceKm: string;
  price: string;
  bibStart: string; // Lote de dorsales: inicio (vacío = sin lote)
  bibEnd: string;   // Lote de dorsales: fin
}

interface EventFormData {
  title: string;
  slug: string;
  sportType: string;
  date: string;
  location: string;
  description: string;
  distance: string;
  imageUrl: string;
  bannerImage: string;
  bannerHorizontalUrl: string;
  bannerVerticalUrl: string;
  hasShirtOption: string;
  shirtPrice: string;
  hasShirt: boolean;
  shirtImage: string;          // base64 image of shirt
  kitInfoDetails: string;      // detailed kit contents
  price: string;
  priceBs: string;
  maxParticipants: string;
  requiresFederationLicense: boolean;
  ageCalcMode: string;
  categoryInterval: string;
  status: string;
  featured: boolean;
  organizer: string;
  prizes: string;
  prizesImages: string;        // JSON array of base64 images
  rules: string;
  rulesFile: string;           // base64 PDF/image of rules
  kitInfo: string;
  sponsors: string;
  sponsorsLogos: string;       // JSON array of {logo, name, url}
  paymentAccounts: string;     // JSON array de cuentas de destino de pago
  bibBoxSize: string;          // Tamaño del bloque de cajas físicas (100/150)
}

interface EventFormPageProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: Partial<EventFormData>;
  initialCategories?: CategoryRow[];
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const defaultFormData: EventFormData = {
  title: "",
  slug: "",
  sportType: "running",
  date: "",
  location: "",
  description: "",
  distance: "",
  imageUrl: "",
  bannerImage: "",
  bannerHorizontalUrl: "",
  bannerVerticalUrl: "",
  hasShirtOption: "OPTIONAL",
  shirtPrice: "",
  hasShirt: true,
  shirtImage: "",
  kitInfoDetails: "",
  price: "0",
  priceBs: "0",
  maxParticipants: "500",
  requiresFederationLicense: false,
  ageCalcMode: "calendar_year",
  categoryInterval: "10",
  status: "upcoming",
  featured: false,
  organizer: "",
  prizes: "",
  prizesImages: "[]",
  rules: "",
  rulesFile: "",
  kitInfo: "",
  sponsors: "",
  sponsorsLogos: "[]",
  paymentAccounts: "[]",
  bibBoxSize: "100",
};

/**
 * Prioridad de orden para lotes correlativos: Élite primero, luego Juvenil,
 * después el resto por edad mínima ascendente. Devuelve una clave ordenable.
 */
function bibPriority(cat: CategoryRow): number {
  const name = (cat.name || "").toUpperCase();
  if (name.includes("ÉLITE") || name.includes("ELITE")) return 0;
  if (name.includes("JUVENIL") || name.includes("JUNIOR")) return 1;
  return 2 + Math.min(cat.minAge, 80) / 100;
}

/**
 * Valida que los lotes de dorsales no se solapen y sean rangos válidos.
 * Devuelve null si todo está bien, o el mensaje de error.
 */
function bibOverlapError(categories: CategoryRow[]): string | null {
  const ranges = categories
    .filter((c) => c.bibStart !== "" && c.bibEnd !== "")
    .map((c) => ({
      name: c.name || "(sin nombre)",
      s: parseInt(c.bibStart),
      e: parseInt(c.bibEnd),
    }));

  for (const r of ranges) {
    if (isNaN(r.s) || isNaN(r.e) || r.s < 1 || r.e < r.s) {
      return `Rango de dorsales inválido en "${r.name}" — el inicial debe ser ≥ 1 y el final ≥ inicial`;
    }
  }

  const sorted = [...ranges].sort((a, b) => a.s - b.s);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].s <= sorted[i - 1].e) {
      return `Lotes superpuestos: ${sorted[i - 1].name} (${sorted[i - 1].s}–${sorted[i - 1].e}) y ${sorted[i].name} (${sorted[i].s}–${sorted[i].e})`;
    }
  }
  return null;
}

// ============================================================
// Helper: Generate categories by interval
// ============================================================

function generateCategories(interval: 5 | 10, basePrice: number): CategoryRow[] {
  const categories: CategoryRow[] = [];

  if (interval === 5) {
    // 18-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60+
    const ranges = [
      { min: 18, max: 24 },
      { min: 25, max: 29 },
      { min: 30, max: 34 },
      { min: 35, max: 39 },
      { min: 40, max: 44 },
      { min: 45, max: 49 },
      { min: 50, max: 54 },
      { min: 55, max: 59 },
      { min: 60, max: 99 },
    ];

    for (const range of ranges) {
      const label = range.max === 99 ? `${range.min}+` : `${range.min}-${range.max}`;
      categories.push({
        name: `${label} M`,
        minAge: range.min,
        maxAge: range.max,
        gender: "M",
        distanceKm: "",
        price: String(basePrice),
        bibStart: "",
        bibEnd: "",
      });
      categories.push({
        name: `${label} F`,
        minAge: range.min,
        maxAge: range.max,
        gender: "F",
        distanceKm: "",
        price: String(basePrice),
        bibStart: "",
        bibEnd: "",
      });
    }
  } else {
    // 18-29, 30-39, 40-49, 50-59, 60+
    const ranges = [
      { min: 18, max: 29 },
      { min: 30, max: 39 },
      { min: 40, max: 49 },
      { min: 50, max: 59 },
      { min: 60, max: 99 },
    ];

    for (const range of ranges) {
      const label = range.max === 99 ? `${range.min}+` : `${range.min}-${range.max}`;
      categories.push({
        name: `${label} M`,
        minAge: range.min,
        maxAge: range.max,
        gender: "M",
        distanceKm: "",
        price: String(basePrice),
        bibStart: "",
        bibEnd: "",
      });
      categories.push({
        name: `${label} F`,
        minAge: range.min,
        maxAge: range.max,
        gender: "F",
        distanceKm: "",
        price: String(basePrice),
        bibStart: "",
        bibEnd: "",
      });
    }
  }

  return categories;
}

// ============================================================
// Main Component
// ============================================================

export default function EventFormPage({
  mode,
  eventId,
  initialData,
  initialCategories,
}: EventFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<EventFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [categories, setCategories] = useState<CategoryRow[]>(
    initialCategories || []
  );
  const [saving, setSaving] = useState(false);

  // Category system state
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [showSpecialCategoryForm, setShowSpecialCategoryForm] = useState(false);
  const [newSpecialCat, setNewSpecialCat] = useState<Omit<CategoryRow, "id">>({
    name: "",
    gender: "MIXTO",
    minAge: 0,
    maxAge: 99,
    distanceKm: "",
    price: "0",
    bibStart: "",
    bibEnd: "",
  });

  // Available presets based on selected sport type
  const availablePresets: CategoryPreset[] = useMemo(
    () => getCategoryPresets(formData.sportType),
    [formData.sportType]
  );

  // Available categories from the selected preset
  const availableCategories: CategoryOption[] = useMemo(() => {
    if (!selectedPresetId) return [];
    const preset = availablePresets.find((p) => p.id === selectedPresetId);
    return preset?.categories || [];
  }, [selectedPresetId, availablePresets]);

  // Load a preset's categories into the active list
  const handleLoadPreset = (presetId: string) => {
    const preset = availablePresets.find((p) => p.id === presetId);
    if (!preset) return;
    const basePrice = parseFloat(formData.price) || 0;
    const rows: CategoryRow[] = preset.categories.map((c) => ({
      name: c.label,
      minAge: c.minAge,
      maxAge: c.maxAge,
      gender: c.gender || "MIXTO",
      distanceKm: "",
      price: String(basePrice),
      bibStart: "",
      bibEnd: "",
    }));
    setCategories(rows);
    toast({
      title: "Plantilla cargada",
      description: `${preset.label}: ${rows.length} categorías`,
    });
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === "create" && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [mode, formData.title]);

  const updateField = (field: keyof EventFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateCategories = (interval: 5 | 10) => {
    const basePrice = parseFloat(formData.price) || 0;
    const generated = generateCategories(interval, basePrice);
    setCategories(generated);
    setFormData((prev) => ({
      ...prev,
      categoryInterval: String(interval),
    }));
    toast({
      title: "Categorías generadas",
      description: `Se generaron ${generated.length} categorías cada ${interval} años`,
    });
  };

  /**
   * Auto-calcular lotes correlativos: reparte el cupo del evento en bloques
   * consecutivos por categoría, dejando los números más bajos para Élite y
   * Juvenil. Ejemplo con 500 cupos y 16 categorías: Élite M/F 1–31 y 32–62.
   */
  const handleAutoCalcBibs = () => {
    if (categories.length === 0) {
      toast({
        title: "Sin categorías",
        description: "Agrega categorías antes de calcular los lotes",
        variant: "destructive",
      });
      return;
    }
    const total = parseInt(formData.maxParticipants) || 500;
    const perCat = Math.max(1, Math.floor(total / categories.length));

    // Ordenar índices por prioridad (Élite → Juvenil → por edad)
    const order = categories
      .map((cat, idx) => ({ idx, cat }))
      .sort((a, b) => bibPriority(a.cat) - bibPriority(b.cat));

    const next = [...categories];
    let cursor = 1;
    for (const { idx } of order) {
      const start = cursor;
      const end = Math.min(start + perCat - 1, total);
      next[idx] = { ...next[idx], bibStart: String(start), bibEnd: String(end) };
      cursor = end + 1;
      if (cursor > total) break;
    }

    setCategories(next);
    toast({
      title: "Lotes calculados",
      description: `${categories.length} bloques correlativos de ~${perCat} dorsales — Élite y Juvenil con los números más bajos`,
    });
  };

  const handleAddSpecialCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        name: "Especial",
        minAge: 18,
        maxAge: 99,
        gender: "MIXTO",
        distanceKm: "",
        price: formData.price || "0",
        bibStart: "",
        bibEnd: "",
      },
    ]);
  };

  const handleDeleteCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCategory = (
    index: number,
    field: keyof CategoryRow,
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
      )
    );
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title || !formData.date || !formData.location || !formData.distance) {
      toast({
        title: "Campos requeridos",
        description: "Título, fecha, ubicación y distancia son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug) {
      toast({
        title: "Slug requerido",
        description: "El slug no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    // Validación de lotes de dorsales: sin solapamientos ni rangos inválidos
    const bibErr = bibOverlapError(categories);
    if (bibErr) {
      toast({
        title: "Lotes de dorsales inválidos",
        description: bibErr,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        sportType: formData.sportType,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        distance: formData.distance,
        imageUrl: formData.imageUrl,
        bannerImage: formData.bannerImage,
        bannerHorizontalUrl: formData.bannerHorizontalUrl || null,
        bannerVerticalUrl: formData.bannerVerticalUrl || null,
        hasShirtOption: formData.hasShirtOption,
        shirtPrice: formData.hasShirtOption === "OPTIONAL" ? parseFloat(formData.shirtPrice) || null : null,
        hasShirt: formData.hasShirtOption !== "NONE",
        shirtImage: formData.shirtImage,
        kitInfoDetails: formData.kitInfoDetails,
        price: parseFloat(formData.price) || 0,
        priceBs: parseFloat(formData.priceBs) || 0,
        maxParticipants: parseInt(formData.maxParticipants) || 500,
        requiresFederationLicense: formData.requiresFederationLicense,
        ageCalcMode: formData.ageCalcMode,
        categoryInterval: formData.categoryInterval,
        status: formData.status,
        featured: formData.featured,
        organizer: formData.organizer,
        prizes: formData.prizes,
        prizesImages: formData.prizesImages,
        rules: formData.rules,
        rulesFile: formData.rulesFile,
        kitInfo: formData.kitInfo,
        sponsors: formData.sponsors,
        sponsorsLogos: formData.sponsorsLogos,
        paymentAccounts: formData.paymentAccounts,
        bibBoxSize: parseInt(formData.bibBoxSize) || 100,
        category: formData.sportType,
        categories: "",
      };

      let savedEventId = eventId;

      if (mode === "create") {
        // Create event
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al crear evento");
        }

        const event = await res.json();
        savedEventId = event.id;
      } else {
        // Update event
        const res = await fetch(`/api/admin/events/${eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al actualizar evento");
        }
      }

      // Save categories if any
      if (categories.length > 0 && savedEventId) {
        const catRes = await fetch(
          `/api/admin/events/${savedEventId}/categories/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categories: categories.map((cat) => ({
                name: cat.name,
                minAge: parseInt(String(cat.minAge)) || 18,
                maxAge: parseInt(String(cat.maxAge)) || 99,
                gender: cat.gender,
                distanceKm: cat.distanceKm ? parseFloat(cat.distanceKm) : null,
                price: parseFloat(cat.price) || 0,
                bibStart: cat.bibStart ? parseInt(cat.bibStart) : null,
                bibEnd: cat.bibEnd ? parseInt(cat.bibEnd) : null,
              })),
            }),
          }
        );

        if (!catRes.ok) {
          const err = await catRes.json();
          console.error("Category save error:", err);
          // Don't throw - event was saved successfully
          toast({
            title: "Categorías con error",
            description: "El evento se guardó pero hubo un error con las categorías",
            variant: "destructive",
          });
        }
      }

      toast({
        title: mode === "create" ? "Evento creado" : "Evento actualizado",
        description: formData.title,
      });

      router.push("/admin/eventos");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/eventos")}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {mode === "create" ? "Nuevo Evento" : "Editar Evento"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === "create"
              ? "Completa los datos para crear un nuevo evento"
              : "Modifica los datos del evento"}
          </p>
        </div>
      </div>

      {/* ─── General Info ──────────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="size-5 text-red-500" />
            Información General
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Nombre del evento"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="auto-generado-del-titulo"
              />
            </div>

            {/* Sport Type */}
            <div className="space-y-2">
              <Label>Tipo de Deporte</Label>
              <Select
                value={formData.sportType}
                onValueChange={(v) => updateField("sportType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="mtb">MTB</SelectItem>
                  <SelectItem value="ciclismo">Ciclismo</SelectItem>
                  <SelectItem value="triatlon">Triatlón</SelectItem>
                  <SelectItem value="trail">Trail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance">Distancia *</Label>
              <Input
                id="distance"
                value={formData.distance}
                onChange={(e) => updateField("distance", e.target.value)}
                placeholder="5K, 10K, 21K, 42K, etc."
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date ? formData.date.split("T")[0] : ""}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Caracas, Venezuela"
              />
            </div>

            {/* Price USD */}
            <div className="space-y-2">
              <Label htmlFor="price">Precio USD</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Price Bs */}
            <div className="space-y-2">
              <Label htmlFor="priceBs">Precio Bs</Label>
              <Input
                id="priceBs"
                type="number"
                step="0.01"
                min="0"
                value={formData.priceBs}
                onChange={(e) => updateField("priceBs", e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Máx. Participantes</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => updateField("maxParticipants", e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximo</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe el evento..."
              rows={3}
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  updateField("featured", !!checked)
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Destacado
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requiresFederationLicense"
                checked={formData.requiresFederationLicense}
                onCheckedChange={(checked) =>
                  updateField("requiresFederationLicense", !!checked)
                }
              />
              <Label htmlFor="requiresFederationLicense" className="cursor-pointer">
                Requiere Licencia Federativa
              </Label>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Banner / Media ──────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="size-5 text-red-500" />
            Banners / Media
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imagen Principal del Evento</Label>
              <FileUpload
                value={formData.imageUrl}
                onChange={(base64) => updateField("imageUrl", base64)}
                accept="image/*"
                maxSize={5}
                label="Subir imagen principal"
                hint="Recomendado: 1920×640px (3:1 horizontal)"
                aspectRatio="wide"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner del Evento</Label>
              <FileUpload
                value={formData.bannerImage}
                onChange={(base64) => updateField("bannerImage", base64)}
                accept="image/*"
                maxSize={5}
                label="Subir banner"
                hint="Recomendado: 1920×640px (3:1 horizontal)"
                aspectRatio="wide"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Horizontal (Landing)</Label>
              <FileUpload
                value={formData.bannerHorizontalUrl || ""}
                onChange={(base64) => updateField("bannerHorizontalUrl", base64)}
                accept="image/*"
                maxSize={5}
                label="Subir banner horizontal"
                hint="Para landing del evento"
                aspectRatio="wide"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Vertical (Móvil)</Label>
              <FileUpload
                value={formData.bannerVerticalUrl || ""}
                onChange={(base64) => updateField("bannerVerticalUrl", base64)}
                accept="image/*"
                maxSize={5}
                label="Subir banner vertical"
                hint="Para vista móvil"
                aspectRatio="tall"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Kit / Shirt Config ──────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shirt className="size-5 text-red-500" />
            Configuración de Kit / Franela
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Opción de Franela</Label>
              <Select
                value={formData.hasShirtOption}
                onValueChange={(v) => updateField("hasShirtOption", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCLUDED">Incluida</SelectItem>
                  <SelectItem value="OPTIONAL">Opcional</SelectItem>
                  <SelectItem value="NONE">Sin Franela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.hasShirtOption === "OPTIONAL" && (
              <div className="space-y-2">
                <Label htmlFor="shirtPrice">Precio Franela (USD)</Label>
                <Input
                  id="shirtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shirtPrice}
                  onChange={(e) => updateField("shirtPrice", e.target.value)}
                  placeholder="5.00"
                />
              </div>
            )}

            {/* Foto oficial de la franela/jersey */}
            <div className="space-y-2 md:col-span-2">
              <Label>Foto Oficial de la Franela / Jersey</Label>
              <FileUpload
                value={formData.shirtImage}
                onChange={(base64) => updateField("shirtImage", base64)}
                accept="image/*"
                maxSize={5}
                label="Subir foto de la franela"
                hint="Recomendado: 600×800px (3:4 retrato) o 800×800px (1:1 cuadrada)"
                aspectRatio="square"
              />
            </div>

            {/* Contenido detallado del kit */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="kitInfoDetails">Contenido del Kit</Label>
              <Textarea
                id="kitInfoDetails"
                value={formData.kitInfoDetails}
                onChange={(e) => updateField("kitInfoDetails", e.target.value)}
                placeholder="Detalle qué incluye el kit: medalla, número, chip de cronometraje, hidratación, etc."
                rows={4}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Organizational Info ────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HandCoins className="size-5 text-red-500" />
            Información Organizacional, Premios y Reglas
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizador</Label>
              <Input
                id="organizer"
                value={formData.organizer}
                onChange={(e) => updateField("organizer", e.target.value)}
                placeholder="Nombre del organizador"
              />
            </div>

            {/* === MÓDULO DE PREMIOS === */}
            <div className="space-y-3 border rounded-lg p-4 bg-amber-50/30">
              <Label className="flex items-center gap-1 text-base font-semibold">
                <Trophy className="size-4 text-amber-600" /> Módulo de Premios
              </Label>
              <Textarea
                value={formData.prizes}
                onChange={(e) => updateField("prizes", e.target.value)}
                placeholder="Describe los premios por categoría: 1er lugar $500, 2do lugar $300, etc."
                rows={4}
              />
              <div>
                <Label className="text-sm">Imágenes explicativas / Afiches de premios</Label>
                <MultiImageUpload
                  value={formData.prizesImages}
                  onChange={(json) => updateField("prizesImages", json)}
                  hint="Sube afiches o imágenes explicativas de los premios"
                />
              </div>
            </div>

            {/* === MÓDULO DE REGLAS / REGLAMENTO === */}
            <div className="space-y-3 border rounded-lg p-4 bg-blue-50/30">
              <Label className="flex items-center gap-1 text-base font-semibold">
                <FileText className="size-4 text-blue-600" /> Módulo de Reglas / Reglamento
              </Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => updateField("rules", e.target.value)}
                placeholder="Escribe las reglas principales del evento o un resumen del reglamento"
                rows={4}
              />
              <div>
                <Label className="text-sm">Reglamento completo (PDF o imagen)</Label>
                <FileUpload
                  value={formData.rulesFile}
                  onChange={(base64) => updateField("rulesFile", base64)}
                  accept=".pdf,image/*"
                  maxSize={10}
                  label="Subir reglamento (PDF o imagen)"
                  hint="Archivo descargable visible para los participantes"
                  aspectRatio="auto"
                />
              </div>
            </div>

            {/* === INFO DEL KIT (legacy) === */}
            <div className="space-y-2">
              <Label htmlFor="kitInfo" className="flex items-center gap-1">
                <Package className="size-3" /> Info del Kit (resumen)
              </Label>
              <Textarea
                id="kitInfo"
                value={formData.kitInfo}
                onChange={(e) => updateField("kitInfo", e.target.value)}
                placeholder="Resumen breve del kit"
                rows={2}
              />
            </div>

            {/* === MÓDULO DE PATROCINADORES === */}
            <div className="space-y-3 border rounded-lg p-4 bg-green-50/30">
              <Label className="flex items-center gap-1 text-base font-semibold">
                <Users className="size-4 text-green-600" /> Módulo de Patrocinadores
              </Label>
              <SponsorsLogosEditor
                value={formData.sponsorsLogos}
                onChange={(json) => updateField("sponsorsLogos", json)}
              />
              <Textarea
                value={formData.sponsors}
                onChange={(e) => updateField("sponsors", e.target.value)}
                placeholder="Información adicional de patrocinadores (texto)"
                rows={2}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Datos de Pago del Evento ───────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Landmark className="size-5 text-red-500" />
            Datos de Pago y Cajas de Entrega
          </h2>

          <div className="space-y-5">
            {/* Tamaño de bloque de cajas físicas */}
            <div className="space-y-2 max-w-xs">
              <Label className="flex items-center gap-1 text-sm font-semibold">
                <Hash className="size-3.5" /> Tamaño de caja de entrega
              </Label>
              <Select
                value={formData.bibBoxSize}
                onValueChange={(v) => updateField("bibBoxSize", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Bloques de 100 (1–99, 100–199…)</SelectItem>
                  <SelectItem value="150">Bloques de 150 (1–149, 150–299…)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Al aprobar una inscripción, el corredor verá su dorsal y la caja
                física donde retira su kit, número y chip.
              </p>
            </div>

            <Separator />

            {/* Cuentas de destino de pago (visibles solo en el Paso 3 del wizard) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-semibold">
                <HandCoins className="size-3.5" /> Cuentas para pagar (Pago Móvil, Zelle, Binance…)
              </Label>
              <p className="text-xs text-muted-foreground">
                Estas cuentas se muestran al corredor únicamente en el Paso 3
                (Pago) del formulario de inscripción.
              </p>
              <PaymentAccountsEditor
                value={formData.paymentAccounts}
                onChange={(json) => updateField("paymentAccounts", json)}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Smart Category Generator ───────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-red-500" />
            Módulo y Generador de Categorías
          </h2>

          {/* Discipline selector + presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Disciplina / Tipo de Deporte</Label>
              <Select
                value={formData.sportType}
                onValueChange={(v) => {
                  updateField("sportType", v);
                  setSelectedPresetId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">
                    <span className="flex items-center gap-2">
                      <Activity className="size-4" /> Atletismo / Carreras
                    </span>
                  </SelectItem>
                  <SelectItem value="mtb">
                    <span className="flex items-center gap-2">
                      <Bike className="size-4" /> Ciclismo MTB
                    </span>
                  </SelectItem>
                  <SelectItem value="mtb-ruta">
                    <span className="flex items-center gap-2">
                      <Bike className="size-4" /> Ciclismo Ruta
                    </span>
                  </SelectItem>
                  <SelectItem value="triathlon">
                    <span className="flex items-center gap-2">
                      <Zap className="size-4" /> Triatlón
                    </span>
                  </SelectItem>
                  <SelectItem value="trail">
                    <span className="flex items-center gap-2">
                      <Activity className="size-4" /> Trail / Trekking
                    </span>
                  </SelectItem>
                  <SelectItem value="virtual">
                    <span className="flex items-center gap-2">
                      <Radio className="size-4" /> Virtual
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plantilla de Categorías</Label>
              <Select
                value={selectedPresetId}
                onValueChange={(v) => {
                  setSelectedPresetId(v);
                  handleLoadPreset(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Intervalo de Edad</Label>
              <Select
                value={formData.categoryInterval}
                onValueChange={(v) => updateField("categoryInterval", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Cada 5 años</SelectItem>
                  <SelectItem value="10">Cada 10 años</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available categories from preset with checkboxes */}
          {availableCategories.length > 0 && (
            <div className="mb-4 border rounded-lg p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">
                  Categorías Predefinidas ({availableCategories.length})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allAsRows = availableCategories.map((c) => ({
                        name: c.label,
                        minAge: c.minAge,
                        maxAge: c.maxAge,
                        gender: c.gender || "MIXTO",
                        distanceKm: "",
                        price: formData.price || "0",
                        bibStart: "",
                        bibEnd: "",
                      }));
                      setCategories(allAsRows);
                    }}
                  >
                    <Plus className="size-3 mr-1" /> Activar Todas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCategories([])}
                  >
                    <Trash2 className="size-3 mr-1" /> Limpiar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {availableCategories.map((cat) => {
                  const isActive = categories.some(
                    (c) => c.name === cat.label
                  );
                  return (
                    <label
                      key={cat.value}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs",
                        isActive
                          ? "border-red-300 bg-red-50/50"
                          : "border-gray-200 hover:bg-white"
                      )}
                    >
                      <Checkbox
                        checked={isActive}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCategories((prev) => [
                              ...prev,
                              {
                                name: cat.label,
                                minAge: cat.minAge,
                                maxAge: cat.maxAge,
                                gender: cat.gender || "MIXTO",
                                distanceKm: "",
                                price: formData.price || "0",
                                bibStart: "",
                                bibEnd: "",
                              },
                            ]);
                          } else {
                            setCategories((prev) =>
                              prev.filter((c) => c.name !== cat.label)
                            );
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {cat.gender === "M"
                            ? "Masculino"
                            : cat.gender === "F"
                            ? "Femenino"
                            : "Mixto"}
                          {cat.profile && ` · ${cat.profile}`}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGenerateCategories(5)}
            >
              <Sparkles className="size-4" />
              Generar 5 años
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGenerateCategories(10)}
            >
              <Sparkles className="size-4" />
              Generar 10 años
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSpecialCategoryForm(!showSpecialCategoryForm)}
            >
              <Plus className="size-4" />
              Agregar Categoría Especial
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={handleAutoCalcBibs}
            >
              <Hash className="size-4" />
              Auto-calcular lotes correlativos
            </Button>
          </div>

          {/* Special Category Form */}
          {showSpecialCategoryForm && (
            <div className="mb-4 border rounded-lg p-4 bg-purple-50/30 space-y-3">
              <Label className="text-base font-semibold text-purple-700">
                Nueva Categoría Especial
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={newSpecialCat.name}
                    onChange={(e) =>
                      setNewSpecialCat({ ...newSpecialCat, name: e.target.value })
                    }
                    placeholder="Ej: Dupla Familiar"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Género</Label>
                  <Select
                    value={newSpecialCat.gender}
                    onValueChange={(v) =>
                      setNewSpecialCat({ ...newSpecialCat, gender: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="MIXTO">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distancia (KM)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newSpecialCat.distanceKm}
                    onChange={(e) =>
                      setNewSpecialCat({ ...newSpecialCat, distanceKm: e.target.value })
                    }
                    placeholder="Ej: 10"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Edad Mínima</Label>
                  <Input
                    type="number"
                    value={newSpecialCat.minAge}
                    onChange={(e) =>
                      setNewSpecialCat({ ...newSpecialCat, minAge: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Edad Máxima</Label>
                  <Input
                    type="number"
                    value={newSpecialCat.maxAge}
                    onChange={(e) =>
                      setNewSpecialCat({ ...newSpecialCat, maxAge: parseInt(e.target.value) || 99 })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Precio (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newSpecialCat.price}
                    onChange={(e) =>
                      setNewSpecialCat({ ...newSpecialCat, price: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="gradient-primary text-white border-0"
                onClick={() => {
                  if (!newSpecialCat.name) {
                    toast({ title: "El nombre es obligatorio", variant: "destructive" });
                    return;
                  }
                  setCategories((prev) => [...prev, { ...newSpecialCat }]);
                  setNewSpecialCat({
                    name: "",
                    gender: "MIXTO",
                    minAge: 0,
                    maxAge: 99,
                    distanceKm: "",
                    price: formData.price || "0",
                    bibStart: "",
                    bibEnd: "",
                  });
                  setShowSpecialCategoryForm(false);
                }}
              >
                <Plus className="size-3 mr-1" /> Agregar
              </Button>
            </div>
          )}

          {/* Category Table */}
          {categories.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs w-20">Género</TableHead>
                      <TableHead className="text-xs w-28">Edad</TableHead>
                      <TableHead className="text-xs w-24">Dist. KM</TableHead>
                      <TableHead className="text-xs w-24">Precio</TableHead>
                      <TableHead className="text-xs w-24">Dorsal desde</TableHead>
                      <TableHead className="text-xs w-24">Dorsal hasta</TableHead>
                      <TableHead className="text-xs w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={cat.name}
                            onChange={(e) =>
                              handleUpdateCategory(idx, "name", e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              cat.gender === "M" &&
                                "bg-blue-50 text-blue-700 border-blue-200",
                              cat.gender === "F" &&
                                "bg-pink-50 text-pink-700 border-pink-200",
                              cat.gender === "MIXTO" &&
                                "bg-purple-50 text-purple-700 border-purple-200"
                            )}
                          >
                            {cat.gender}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cat.minAge}-{cat.maxAge === 99 ? "+" : cat.maxAge}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={cat.distanceKm}
                            onChange={(e) =>
                              handleUpdateCategory(
                                idx,
                                "distanceKm",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm w-20"
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cat.price}
                            onChange={(e) =>
                              handleUpdateCategory(idx, "price", e.target.value)
                            }
                            className="h-8 text-sm w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={cat.bibStart}
                            onChange={(e) =>
                              handleUpdateCategory(idx, "bibStart", e.target.value)
                            }
                            className="h-8 text-sm w-20 font-mono"
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={cat.bibEnd}
                            onChange={(e) =>
                              handleUpdateCategory(idx, "bibEnd", e.target.value)
                            }
                            className="h-8 text-sm w-20 font-mono"
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteCategory(idx)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t px-4 py-2 bg-muted/30 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {categories.length} categorías activas
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Lote vacío = el dorsal se asigna con el primer número libre global al aprobar
                </p>
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No hay categorías definidas. Selecciona una plantilla arriba o
                usa los botones para generar categorías automáticamente.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ─── Save Button ────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/eventos")}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-primary text-white border-0 min-w-[140px]"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving
            ? "Guardando..."
            : mode === "create"
            ? "Crear Evento"
            : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// MultiImageUpload — Sube múltiples imágenes (JSON array de base64)
// ============================================================
function MultiImageUpload({
  value,
  onChange,
  hint,
}: {
  value: string; // JSON array of base64 strings
  onChange: (json: string) => void;
  hint?: string;
}) {
  const images: string[] = (() => {
    try {
      return JSON.parse(value || "[]");
    } catch {
      return [];
    }
  })();

  const addImage = (base64: string) => {
    const next = [...images, base64];
    onChange(JSON.stringify(next));
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Imagen ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <FileUpload
        onChange={(base64) => base64 && addImage(base64)}
        accept="image/*"
        maxSize={5}
        label="Agregar imagen"
        hint={hint}
        aspectRatio="auto"
      />
    </div>
  );
}

// ============================================================
// SponsorsLogosEditor — Editor de logos de patrocinadores
// ============================================================
interface SponsorLogo {
  logo: string; // base64
  name: string;
  url: string;
}

function SponsorsLogosEditor({
  value,
  onChange,
}: {
  value: string; // JSON array of SponsorLogo
  onChange: (json: string) => void;
}) {
  const sponsors: SponsorLogo[] = (() => {
    try {
      return JSON.parse(value || "[]");
    } catch {
      return [];
    }
  })();

  const addSponsor = (logo: string) => {
    const next = [...sponsors, { logo, name: "", url: "" }];
    onChange(JSON.stringify(next));
  };

  const updateSponsor = (idx: number, field: keyof SponsorLogo, val: string) => {
    const next = sponsors.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    onChange(JSON.stringify(next));
  };

  const removeSponsor = (idx: number) => {
    onChange(JSON.stringify(sponsors.filter((_, i) => i !== idx)));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Dimensiones recomendadas: 200x200px o relación 1:1 (logo cuadrado)
      </p>
      {sponsors.length > 0 && (
        <div className="space-y-3">
          {sponsors.map((sponsor, idx) => (
            <div
              key={idx}
              className="flex gap-3 items-start border rounded-lg p-3 bg-white"
            >
              <div className="w-20 h-20 shrink-0 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name || "Logo"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-6 text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Nombre del patrocinador"
                  value={sponsor.name}
                  onChange={(e) => updateSponsor(idx, "name", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="URL (opcional)"
                  value={sponsor.url}
                  onChange={(e) => updateSponsor(idx, "url", e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                    Cambiar logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert("La imagen no debe superar 2MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSponsor(idx, "logo", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSponsor(idx)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <FileUpload
        onChange={(base64) => base64 && addSponsor(base64)}
        accept="image/*"
        maxSize={2}
        label="Agregar logo de patrocinador"
        hint="Logo cuadrado preferido (PNG transparente)"
        aspectRatio="square"
      />
    </div>
  );
}

// ============================================================
// PaymentAccountsEditor — Cuentas de destino de pago del evento
// (JSON array de PaymentAccount; visible solo en el Paso 3 del wizard)
// ============================================================

const ACCOUNT_METHODS = [
  "movil",
  "transferencia",
  "zelle",
  "binance",
  "divisas",
  "otro",
] as const;

/** Campos que se muestran según el método de la cuenta */
function accountFieldsFor(method: string): Array<{
  key: keyof PaymentAccount;
  label: string;
  placeholder: string;
}> {
  switch (method) {
    case "movil":
      return [
        { key: "banco", label: "Banco", placeholder: "Ej. Banesco" },
        { key: "telefono", label: "Teléfono afiliado", placeholder: "0412-1234567" },
        { key: "cedula", label: "Cédula/RIF titular", placeholder: "V-12345678" },
      ];
    case "transferencia":
      return [
        { key: "banco", label: "Banco", placeholder: "Ej. Banco Nacional" },
        { key: "cuenta", label: "Número de cuenta", placeholder: "0000-0000-00-0000000000" },
        { key: "cedula", label: "Cédula/RIF titular", placeholder: "V-12345678" },
      ];
    case "zelle":
      return [
        { key: "correo", label: "Correo Zelle", placeholder: "pagos@vzlabike.com" },
        { key: "cedula", label: "Nombre del titular", placeholder: "Titular de la cuenta" },
      ];
    case "binance":
      return [
        { key: "wallet", label: "Binance ID / Wallet", placeholder: "ID: 123456789" },
      ];
    case "divisas":
      return [
        { key: "banco", label: "Banco / Entidad", placeholder: "Ej. Bank of America" },
        { key: "cuenta", label: "Número de cuenta", placeholder: "0000000000" },
      ];
    default:
      return [{ key: "notas", label: "Instrucciones", placeholder: "Indicaciones del pago" }];
  }
}

function PaymentAccountsEditor({
  value,
  onChange,
}: {
  value: string; // JSON array de PaymentAccount
  onChange: (json: string) => void;
}) {
  const accounts: PaymentAccount[] = (() => {
    try {
      const arr = JSON.parse(value || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  const updateAccount = (idx: number, patch: Partial<PaymentAccount>) => {
    const next = accounts.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(JSON.stringify(next));
  };

  const removeAccount = (idx: number) => {
    onChange(JSON.stringify(accounts.filter((_, i) => i !== idx)));
  };

  const addAccount = () => {
    const next = [...accounts, { method: "movil", label: "" } as PaymentAccount];
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-3">
      {accounts.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sin cuentas configuradas — el corredor verá un aviso para pagar por
            el canal habitual del evento.
          </p>
        </div>
      )}

      {accounts.map((acc, idx) => {
        const fields = accountFieldsFor(acc.method || "otro");
        return (
          <div
            key={idx}
            className="rounded-lg border bg-white p-3 space-y-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 min-w-[180px]">
                <Label className="text-xs">Método</Label>
                <Select
                  value={acc.method || "otro"}
                  onValueChange={(v) => updateAccount(idx, { method: v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m] || m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs">Etiqueta (opcional)</Label>
                <Input
                  value={acc.label || ""}
                  onChange={(e) => updateAccount(idx, { label: e.target.value })}
                  placeholder={`Ej. ${PAYMENT_METHOD_LABELS[acc.method || "otro"] || "Cuenta"} oficial del evento`}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-red-600 shrink-0"
                onClick={() => removeAccount(idx)}
                aria-label="Eliminar cuenta"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fields.map((f) => (
                <div key={String(f.key)} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={(acc[f.key] as string) || ""}
                    onChange={(e) =>
                      updateAccount(idx, { [f.key]: e.target.value } as Partial<PaymentAccount>)
                    }
                    placeholder={f.placeholder}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>

            {acc.method === "movil" && (
              <div className="space-y-1">
                <Label className="text-xs">Notas adicionales (opcional)</Label>
                <Input
                  value={acc.notas || ""}
                  onChange={(e) => updateAccount(idx, { notas: e.target.value })}
                  placeholder="Ej. Solo pagos móviles nacionales"
                  className="h-8 text-sm"
                />
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Vista previa: <strong>{accountLabel(acc)}</strong>
            </p>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addAccount}
        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
      >
        <Plus className="size-3 mr-1" /> Agregar cuenta de pago
      </Button>
    </div>
  );
}
