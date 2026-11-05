"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  rules: string;
  kitInfo: string;
  sponsors: string;
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
  rules: "",
  kitInfo: "",
  sponsors: "",
};

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
      });
      categories.push({
        name: `${label} F`,
        minAge: range.min,
        maxAge: range.max,
        gender: "F",
        distanceKm: "",
        price: String(basePrice),
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
      });
      categories.push({
        name: `${label} F`,
        minAge: range.min,
        maxAge: range.max,
        gender: "F",
        distanceKm: "",
        price: String(basePrice),
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
        rules: formData.rules,
        kitInfo: formData.kitInfo,
        sponsors: formData.sponsors,
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
              <Label htmlFor="imageUrl">Imagen URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="/event-image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerImage">Banner Image URL</Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => updateField("bannerImage", e.target.value)}
                placeholder="/banner.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerHorizontalUrl">Banner Horizontal (Landing)</Label>
              <Input
                id="bannerHorizontalUrl"
                value={formData.bannerHorizontalUrl}
                onChange={(e) =>
                  updateField("bannerHorizontalUrl", e.target.value)
                }
                placeholder="/banner-horizontal.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerVerticalUrl">Banner Vertical (Móvil)</Label>
              <Input
                id="bannerVerticalUrl"
                value={formData.bannerVerticalUrl}
                onChange={(e) =>
                  updateField("bannerVerticalUrl", e.target.value)
                }
                placeholder="/banner-vertical.jpg"
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
          </div>
        </Card>
      </motion.div>

      {/* ─── Organizational Info ────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HandCoins className="size-5 text-red-500" />
            Información Organizacional
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizador</Label>
              <Input
                id="organizer"
                value={formData.organizer}
                onChange={(e) => updateField("organizer", e.target.value)}
                placeholder="Nombre del organizador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prizes">
                <span className="flex items-center gap-1">
                  <Trophy className="size-3" /> Premios
                </span>
              </Label>
              <Textarea
                id="prizes"
                value={formData.prizes}
                onChange={(e) => updateField("prizes", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules">
                <span className="flex items-center gap-1">
                  <FileText className="size-3" /> Reglas
                </span>
              </Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => updateField("rules", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitInfo">
                <span className="flex items-center gap-1">
                  <Package className="size-3" /> Info del Kit
                </span>
              </Label>
              <Textarea
                id="kitInfo"
                value={formData.kitInfo}
                onChange={(e) => updateField("kitInfo", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsors">Patrocinadores</Label>
              <Textarea
                id="sponsors"
                value={formData.sponsors}
                onChange={(e) => updateField("sponsors", e.target.value)}
                rows={2}
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
            Generador de Categorías
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Intervalo de Categorías</Label>
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
            <div className="space-y-2">
              <Label>Modo de Cálculo de Edad</Label>
              <Select
                value={formData.ageCalcMode}
                onValueChange={(v) => updateField("ageCalcMode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar_year">Año calendario</SelectItem>
                  <SelectItem value="event_date">Fecha del evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGenerateCategories(5)}
            >
              <Sparkles className="size-4" />
              Generar cada 5 años
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleGenerateCategories(10)}
            >
              <Sparkles className="size-4" />
              Generar cada 10 años
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSpecialCategory}
            >
              <Plus className="size-4" />
              Agregar Categoría Especial
            </Button>
          </div>

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
              <div className="border-t px-4 py-2 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  {categories.length} categorías definidas
                </p>
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No hay categorías definidas. Usa los botones de arriba para
                generar categorías automáticamente o agregar categorías
                especiales.
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
