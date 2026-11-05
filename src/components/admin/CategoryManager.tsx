"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getCategoriesForSport,
  getEligibleCategories,
  type CategoryOption,
  type CategoryExtraField,
} from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
interface EventCategory {
  id: string;
  eventId: string;
  name: string;
  code: string;
  discipline: string;
  gender: string;
  minAge: number;
  maxAge: number;
  profileType: string;
  sortOrder: number;
  active: boolean;
  extraFields: CategoryExtraField[];
  createdAt: string;
}

interface CategoryManagerProps {
  eventId: string;
  sportType: string;
  eventDate?: string;
  ageCalcMode?: string;
}

// ============================================================
// Main Component
// ============================================================
export function CategoryManager({
  eventId,
  sportType,
  eventDate,
  ageCalcMode = "calendar_year",
}: CategoryManagerProps) {
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<EventCategory | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formMinAge, setFormMinAge] = useState("0");
  const [formMaxAge, setFormMaxAge] = useState("999");
  const [formProfileType, setFormProfileType] = useState("");
  const [formDiscipline, setFormDiscipline] = useState("");
  const [formExtraFields, setFormExtraFields] = useState<CategoryExtraField[]>([]);
  const [hasExtraFields, setHasExtraFields] = useState(false);

  // Preview state
  const [previewAge, setPreviewAge] = useState("");
  const [previewGender, setPreviewGender] = useState("");

  const { toast } = useToast();

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/events/${eventId}/categories`);
      if (res.ok) {
        const data = await res.json();
        setEventCategories(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Get all preset categories for this sport
  const presetCategories = getCategoriesForSport(sportType, "10");
  const presetCodes = new Set(presetCategories.map(c => c.value));

  // Handlers
  const handleNew = () => {
    setEditingCat(null);
    setFormName("");
    setFormCode("");
    setFormGender("");
    setFormMinAge("0");
    setFormMaxAge("999");
    setFormProfileType("");
    setFormDiscipline("");
    setFormExtraFields([]);
    setHasExtraFields(false);
    setDialogOpen(true);
  };

  const handleEdit = (cat: EventCategory) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormCode(cat.code);
    setFormGender(cat.gender);
    setFormMinAge(String(cat.minAge));
    setFormMaxAge(String(cat.maxAge));
    setFormProfileType(cat.profileType);
    setFormDiscipline(cat.discipline);
    setFormExtraFields(cat.extraFields || []);
    setHasExtraFields((cat.extraFields || []).length > 0);
    setDialogOpen(true);
  };

  const handleToggleActive = async (cat: EventCategory) => {
    try {
      await fetch(`/api/admin/events/${eventId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: cat.id, active: !cat.active }),
      });
      fetchCategories();
    } catch {
      toast({ title: "Error al actualizar categoría", variant: "destructive" });
    }
  };

  const handleDelete = async (cat: EventCategory) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await fetch(
        `/api/admin/events/${eventId}/categories?categoryId=${cat.id}`,
        { method: "DELETE" }
      );
      fetchCategories();
    } catch {
      toast({ title: "Error al eliminar categoría", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast({ title: "Nombre y código son requeridos", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const url = `/api/admin/events/${eventId}/categories`;
      const method = editingCat ? "PUT" : "POST";
      const payload: any = {
        name: formName.trim(),
        code: formCode.trim(),
        gender: formGender,
        discipline: formDiscipline,
        minAge: parseInt(formMinAge) || 0,
        maxAge: parseInt(formMaxAge) || 999,
        profileType: formProfileType,
        extraFields: hasExtraFields ? formExtraFields : [],
      };

      if (editingCat) {
        payload.categoryId = editingCat.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchCategories();
        toast({
          title: editingCat ? "Categoría actualizada" : "Categoría creada",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "No se pudo guardar",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Extra field management
  const addExtraField = () => {
    setFormExtraFields(prev => [
      ...prev,
      { key: `field_${Date.now()}`, label: "", type: "text" as const, required: false },
    ]);
  };

  const removeExtraField = (index: number) => {
    setFormExtraFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateExtraField = (index: number, field: Partial<CategoryExtraField>) => {
    setFormExtraFields(prev =>
      prev.map((f, i) => (i === index ? { ...f, ...field } : f))
    );
  };

  // Preview eligible categories
  const previewResults: CategoryOption[] = [];
  if (previewAge && previewGender) {
    const age = parseInt(previewAge);
    if (age > 0) {
      // Combine preset + custom categories
      const customCats: CategoryOption[] = eventCategories
        .filter(c => c.active)
        .map(c => ({
          value: c.code,
          label: c.name,
          minAge: c.minAge,
          maxAge: c.maxAge,
          gender: c.gender || undefined,
          profile: (c.profileType || undefined) as any,
          extraFields: c.extraFields,
        }));

      const allCats = [...presetCategories, ...customCats];
      const { eligible } = getEligibleCategories(age, allCats, previewGender);
      previewResults.push(...eligible);
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Categorías Personalizadas</h3>
          <p className="text-xs text-muted-foreground">
            Categorías especiales adicionales para este evento (ej: Organismos de Seguridad, 100 kg+)
          </p>
        </div>
        <Button onClick={handleNew} size="sm" className="gradient-primary text-white border-0">
          <Plus className="size-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Category List */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : eventCategories.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No hay categorías personalizadas para este evento.</p>
            <p className="text-xs mt-1">
              Las categorías predefinidas del deporte ({sportType}) ya están activas automáticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {eventCategories.map(cat => (
              <div
                key={cat.id}
                className={cn(
                  "flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors",
                  !cat.active && "opacity-50 bg-gray-50"
                )}
              >
                <Switch
                  checked={cat.active}
                  onCheckedChange={() => handleToggleActive(cat)}
                  className="shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {cat.code}
                    </Badge>
                    {cat.gender && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 shrink-0",
                          cat.gender === "M" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                        )}
                      >
                        {cat.gender === "M" ? "Varones" : cat.gender === "F" ? "Damas" : cat.gender}
                      </Badge>
                    )}
                    {cat.profileType && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-emerald-50 text-emerald-700">
                        {cat.profileType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      Edad: {cat.minAge === 0 ? "Todos" : cat.minAge} - {cat.maxAge >= 999 ? "Sin límite" : cat.maxAge}
                    </span>
                    {(cat.extraFields || []).length > 0 && (
                      <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
                        <Info className="size-3" />
                        {(cat.extraFields || []).length} campo(s) extra(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleEdit(cat)}
                    aria-label="Editar categoría"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat)}
                    aria-label="Eliminar categoría"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Tool */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Search className="size-4" />
          Vista Previa de Categorías
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Ingresa una edad y género para ver qué categorías (predefinidas + personalizadas) calificaría un participante.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <Label className="text-xs">Edad</Label>
            <Input
              type="number"
              placeholder="Ej: 32"
              value={previewAge}
              onChange={e => setPreviewAge(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Género</Label>
            <Select value={previewGender} onValueChange={setPreviewGender}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Badge variant="outline" className="h-8 flex items-center text-xs">
              {previewResults.length} categoría(s)
            </Badge>
          </div>
        </div>

        {previewResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {previewResults.map((cat, idx) => (
              <div
                key={`${cat.value}-${idx}`}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs",
                  idx === 0
                    ? "bg-green-50 border border-green-200"
                    : "bg-white border border-gray-100"
                )}
              >
                <div className="flex items-center gap-2">
                  {idx === 0 && (
                    <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className={cn("font-medium", idx === 0 ? "text-green-800" : "text-foreground")}>
                    {cat.label}
                  </span>
                  {cat.extraFields && cat.extraFields.length > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">
                      {cat.extraFields.length} campo(s) extra
                    </Badge>
                  )}
                </div>
                {idx === 0 && (
                  <span className="text-[10px] text-green-600 font-semibold">SUGERIDA</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Editar Categoría" : "Nueva Categoría Personalizada"}
            </DialogTitle>
            <DialogDescription>
              {editingCat
                ? "Modifica los datos de la categoría"
                : "Crea una categoría especial con campos adicionales si es necesario"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Nombre *</Label>
                <Input
                  placeholder="Ej: Organismos de Seguridad"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Código *</Label>
                <Input
                  placeholder="Ej: ORG-SEGS"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="mt-1 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Género</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="M">Varones</SelectItem>
                    <SelectItem value="F">Damas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Edad mínima</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formMinAge}
                  onChange={e => setFormMinAge(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Edad máxima</Label>
                <Input
                  type="number"
                  placeholder="999"
                  value={formMaxAge}
                  onChange={e => setFormMaxAge(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo de Perfil</Label>
                <Select value={formProfileType} onValueChange={setFormProfileType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    <SelectItem value="competitivo">Competitivo</SelectItem>
                    <SelectItem value="recreativo">Recreativo</SelectItem>
                    <SelectItem value="special">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Disciplina</Label>
                <Input
                  placeholder="Ej: MTB, Running"
                  value={formDiscipline}
                  onChange={e => setFormDiscipline(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Extra Fields Toggle */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label className="text-sm font-medium">Campos adicionales</Label>
                <p className="text-[11px] text-muted-foreground">
                  Agrega campos personalizados que se mostrarán en la inscripción (ej: peso, institución)
                </p>
              </div>
              <Switch
                checked={hasExtraFields}
                onCheckedChange={(checked) => {
                  setHasExtraFields(checked);
                  if (!checked) setFormExtraFields([]);
                }}
              />
            </div>

            {/* Extra Fields List */}
            {hasExtraFields && (
              <div className="border rounded-lg p-3 space-y-3 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800">
                    Campos adicionales ({formExtraFields.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={addExtraField}
                  >
                    <Plus className="size-3 mr-1" />
                    Agregar campo
                  </Button>
                </div>

                {formExtraFields.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No hay campos adicionales. Haz clic en &quot;Agregar campo&quot;.
                  </p>
                )}

                {formExtraFields.map((field, idx) => (
                  <div key={idx} className="border rounded-md p-2 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Campo #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive"
                        onClick={() => removeExtraField(idx)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Etiqueta</Label>
                        <Input
                          placeholder="Ej: Peso actual (kg)"
                          value={field.label}
                          onChange={e =>
                            updateExtraField(idx, { label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_") || `field_${idx}` })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-[11px]">Tipo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(val: "text" | "number") =>
                              updateExtraField(idx, { type: val })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 pt-4">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e =>
                              updateExtraField(idx, { required: e.target.checked })
                            }
                            className="size-3.5 rounded"
                          />
                          <Label className="text-[11px]">Oblig.</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formName.trim() || !formCode.trim()}
              className="gradient-primary text-white border-0"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </span>
              ) : editingCat ? (
                "Actualizar"
              ) : (
                "Crear Categoría"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
