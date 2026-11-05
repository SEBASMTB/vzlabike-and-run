"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Save, X, Upload, Eye, EyeOff,
  ShoppingCart, Search, ChevronDown, ArrowUpDown, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceBs: number;
  imageUrl: string;
  images: string;
  sizes: string;
  color: string;
  stock: number;
  active: boolean;
  eventId: string | null;
  event: Event | null;
  sortOrder: number;
  _count?: { orders: number };
  createdAt: string;
}

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  price: 0,
  priceBs: 0,
  imageUrl: "",
  images: "[]",
  sizes: "[]",
  color: "",
  stock: 0,
  active: true,
  eventId: null as string | null,
  sortOrder: 0,
};

export default function AdminTiendaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<(typeof EMPTY_PRODUCT) & { id?: string }>(EMPTY_PRODUCT);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "created">("created");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Sizes management
  const [sizeInput, setSizeInput] = useState("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchEvents()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchEvents]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingProduct((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages((prev) => [...prev, reader.result as string]);
        setEditingProduct((prev) => ({
          ...prev,
          images: JSON.stringify([...prev.images ? JSON.parse(prev.images) : [], reader.result as string]),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setEditingProduct((ep) => ({
        ...ep,
        images: JSON.stringify(updated),
      }));
      return updated;
    });
  };

  const addSize = () => {
    const size = sizeInput.trim().toUpperCase();
    if (!size) return;
    const currentSizes = editingProduct.sizes ? JSON.parse(editingProduct.sizes) : [];
    if (currentSizes.includes(size)) {
      toast.error("Esa talla ya existe");
      return;
    }
    const newSizes = [...currentSizes, size];
    setEditingProduct((prev) => ({ ...prev, sizes: JSON.stringify(newSizes) }));
    setSizeInput("");
  };

  const removeSize = (size: string) => {
    const currentSizes = editingProduct.sizes ? JSON.parse(editingProduct.sizes) : [];
    const newSizes = currentSizes.filter((s: string) => s !== size);
    setEditingProduct((prev) => ({ ...prev, sizes: JSON.stringify(newSizes) }));
  };

  const openCreateDialog = () => {
    setEditingProduct({ ...EMPTY_PRODUCT });
    setAdditionalImages([]);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      priceBs: product.priceBs,
      imageUrl: product.imageUrl,
      images: product.images,
      sizes: product.sizes,
      color: product.color,
      stock: product.stock,
      active: product.active,
      eventId: product.eventId,
      sortOrder: product.sortOrder,
    });
    setAdditionalImages(product.images ? JSON.parse(product.images) : []);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        toast.success(isEditing ? "Producto actualizado" : "Producto creado");
        setDialogOpen(false);
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Producto eliminado");
        setDeleteConfirm(null);
        fetchProducts();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, active: !product.active }),
      });
      if (res.ok) {
        fetchProducts();
        toast.success(product.active ? "Producto desactivado" : "Producto activado");
      }
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  // Filter and sort
  let filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = filterEvent === "all" || p.eventId === filterEvent;
    return matchesSearch && matchesEvent;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name": return a.name.localeCompare(b.name);
      case "price": return b.price - a.price;
      case "stock": return a.stock - b.stock;
      case "created": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return 0;
    }
  });

  const currentSizes = editingProduct.sizes ? JSON.parse(editingProduct.sizes) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin size-8 text-gray-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="size-7 text-blue-600" />
            Tienda / Productos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los productos disponibles en la tienda (jerseys, mercancía, accesorios)
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="none">Sin evento</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-40">
                <ArrowUpDown className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Recientes</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="price">Precio</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Total Productos</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-green-600">{products.filter((p) => p.active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Sin Stock</p>
            <p className="text-2xl font-bold text-red-600">{products.filter((p) => p.stock === 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">Con Evento</p>
            <p className="text-2xl font-bold text-blue-600">{products.filter((p) => p.eventId).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay productos</h3>
            <p className="text-gray-400 mt-1">
              {searchTerm || filterEvent !== "all"
                ? "No se encontraron productos con los filtros aplicados"
                : "Comienza agregando tu primer producto"}
            </p>
            {!searchTerm && filterEvent === "all" && (
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="size-4" />
                Agregar Producto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingCart className="size-12" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant={product.active ? "default" : "secondary"} className="text-xs">
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                  {product.stock === 0 && (
                    <Badge variant="destructive" className="text-xs">Agotado</Badge>
                  )}
                </div>
                {/* Event badge */}
                {product.event && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="bg-white/90 text-xs">
                      {product.event.title}
                    </Badge>
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditDialog(product)}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-blue-50"
                  >
                    <Pencil className="size-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => toggleActive(product)}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    {product.active ? (
                      <EyeOff className="size-3.5 text-gray-600" />
                    ) : (
                      <Eye className="size-3.5 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-blue-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.priceBs > 0 && (
                      <span className="text-xs text-gray-400">
                        Bs. {product.priceBs.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Stock: {product.stock}
                  </span>
                </div>
                {product._count && product._count.orders > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {product._count.orders} pedido(s)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            Los pedidos asociados también se eliminarán.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagen Principal</Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {editingProduct.imageUrl ? (
                    <img
                      src={editingProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="size-8 text-gray-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" type="button" asChild>
                      <span>
                        <Upload className="size-4 mr-1" />
                        Subir Imagen
                      </span>
                    </Button>
                  </label>
                  {editingProduct.imageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setEditingProduct((prev) => ({ ...prev, imageUrl: "" }))}
                    >
                      Quitar imagen
                    </Button>
                  )}
                  <p className="text-xs text-gray-400">Máximo 5MB</p>
                </div>
              </div>
            </div>

            {/* Additional Images */}
            <div className="space-y-2">
              <Label>Imágenes Adicionales</Label>
              <div className="flex flex-wrap gap-2">
                {additionalImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded border overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImageUpload}
                    className="hidden"
                  />
                  <Plus className="size-5 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Name & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-name">Nombre del Producto *</Label>
                <Input
                  id="prod-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Jersey Oficial VzlaBike 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-color">Color</Label>
                <Input
                  id="prod-color"
                  value={editingProduct.color}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="Ej: Rojo, Azul, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-desc">Descripción</Label>
              <Textarea
                id="prod-desc"
                value={editingProduct.description}
                onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el producto, materiales, características..."
                rows={3}
              />
            </div>

            {/* Prices & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-price-usd">Precio USD</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="prod-price-usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price || ""}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-price-bs">Precio Bs</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Bs.</span>
                  <Input
                    id="prod-price-bs"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.priceBs || ""}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({ ...prev, priceBs: parseFloat(e.target.value) || 0 }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-stock">Stock</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  value={editingProduct.stock || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Event Association */}
            <div className="space-y-2">
              <Label>Evento Asociado (opcional)</Label>
              <Select
                value={editingProduct.eventId || "none"}
                onValueChange={(v) =>
                  setEditingProduct((prev) => ({ ...prev, eventId: v === "none" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin evento asociado</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <Label>Tallas Disponibles</Label>
              <div className="flex gap-2">
                <Input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder="Ej: S, M, L, XL"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={addSize}>
                  <Plus className="size-4" />
                </Button>
              </div>
              {currentSizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSizes.map((size: string) => (
                    <Badge key={size} variant="secondary" className="gap-1 pr-1">
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Active & Sort */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProduct.active}
                  onCheckedChange={(checked) =>
                    setEditingProduct((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label>Producto activo</Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-sort">Orden</Label>
                <Input
                  id="prod-sort"
                  type="number"
                  min="0"
                  value={editingProduct.sortOrder || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="size-4 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editingProduct.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="size-4" />
                  {isEditing ? "Actualizar" : "Crear Producto"}
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
