"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart, Search, Filter, ArrowLeft,
  Star, ChevronRight, Package, X, Minus, Plus,
  CreditCard, DollarSign, Smartphone, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
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
import { toast } from "sonner";

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
  event: { id: string; title: string; slug: string } | null;
  sortOrder: number;
}

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  // Order form
  const [orderForm, setOrderForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    size: "",
    color: "",
    quantity: 1,
    paymentMethod: "",
    paymentRef: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Image gallery
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const events = Array.from(
    new Map(products.filter((p) => p.event).map((p) => [p.event!.id, p.event!])).values()
  );

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEvent = selectedEvent === "all" || p.eventId === selectedEvent;
    return matchSearch && matchEvent;
  });

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setActiveImage(0);
    setDetailOpen(true);
  };

  const openOrder = () => {
    setDetailOpen(false);
    if (selectedProduct) {
      const sizes = selectedProduct.sizes ? JSON.parse(selectedProduct.sizes) : [];
      setOrderForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        idNumber: "",
        size: sizes.length > 0 ? sizes[0] : "",
        color: selectedProduct.color || "",
        quantity: 1,
        paymentMethod: "",
        paymentRef: "",
        notes: "",
      });
      setOrderOpen(true);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedProduct) return;

    const { firstName, lastName, email, phone } = orderForm;
    if (!firstName || !lastName || !email || !phone) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderForm),
      });

      if (res.ok) {
        toast.success("Pedido realizado con exito");
        setOrderOpen(false);
        setSelectedProduct(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al realizar el pedido");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  const productImages = (product: Product) => {
    const imgs = product.images ? JSON.parse(product.images) : [];
    if (product.imageUrl && !imgs.includes(product.imageUrl)) {
      return [product.imageUrl, ...imgs];
    }
    return imgs;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4 text-sm">
                <ShoppingCart className="size-4" />
                Tienda Oficial
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Tienda VzlaBike and Run
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                Jersey oficiales, mercancia deportiva y accesorios de los mejores eventos
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="size-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">No hay productos disponibles</h3>
              <p className="text-gray-400 mt-2">Vuelve pronto para ver nuestros productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => openDetail(product)}
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="size-16 text-gray-300" />
                      </div>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <Badge className="absolute top-3 left-3 bg-amber-500">
                        {product.stock} restantes
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-lg bg-white/90">
                          Agotado
                        </Badge>
                      </div>
                    )}
                    {product.event && (
                      <Badge className="absolute bottom-3 left-3 bg-white/90 text-foreground">
                        {product.event.title}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.priceBs > 0 && (
                          <span className="text-sm text-gray-400">
                            Bs. {product.priceBs.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        Ver mas
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                    {product.color && (
                      <p className="text-xs text-gray-400 mt-2">
                        Color: {product.color}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Product Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            {selectedProduct?.event && (
              <DialogDescription>
                Producto del evento: {selectedProduct.event.title}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={productImages(selectedProduct)[activeImage] || "/placeholder.jpg"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {productImages(selectedProduct).length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {productImages(selectedProduct).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                          idx === activeImage ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedProduct.name}</h2>
                  {selectedProduct.color && (
                    <p className="text-gray-500 mt-1">Color: {selectedProduct.color}</p>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-blue-600">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                  {selectedProduct.priceBs > 0 && (
                    <span className="text-lg text-gray-400">
                      Bs. {selectedProduct.priceBs.toFixed(2)}
                    </span>
                  )}
                </div>

                <Separator />

                {selectedProduct.description && (
                  <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                )}

                {/* Sizes */}
                {selectedProduct.sizes && JSON.parse(selectedProduct.sizes).length > 0 && (
                  <div>
                    <Label className="mb-2 block">Tallas Disponibles</Label>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedProduct.sizes).map((size: string) => (
                        <Badge key={size} variant="outline" className="px-3 py-1.5 text-sm">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock */}
                <div className="flex items-center gap-2 text-sm">
                  <Package className="size-4 text-gray-400" />
                  <span className={selectedProduct.stock > 5 ? "text-green-600" : selectedProduct.stock > 0 ? "text-amber-600" : "text-red-600"}>
                    {selectedProduct.stock > 5 ? "En stock" : selectedProduct.stock > 0 ? `Solo ${selectedProduct.stock} disponibles` : "Agotado"}
                  </span>
                </div>

                {/* Event Link */}
                {selectedProduct.event && (
                  <Link
                    href={`/eventos/${selectedProduct.event.slug}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Ver evento: {selectedProduct.event.title}
                    <ChevronRight className="size-3" />
                  </Link>
                )}

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                  disabled={selectedProduct.stock === 0}
                  onClick={openOrder}
                >
                  <ShoppingCart className="size-5 mr-2" />
                  {selectedProduct.stock === 0 ? "Agotado" : "Ordenar Ahora"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ordenar: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Completa tus datos para realizar el pedido
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Product Summary */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {selectedProduct?.imageUrl && (
                  <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selectedProduct?.name}</p>
                <p className="text-blue-600 font-bold">${selectedProduct?.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="size-3" />
                </button>
                <span className="font-semibold w-8 text-center">{orderForm.quantity}</span>
                <button
                  onClick={() => setOrderForm((f) => ({ ...f, quantity: Math.min(selectedProduct?.stock || 99, f.quantity + 1) }))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>

            {/* Size selection */}
            {selectedProduct?.sizes && JSON.parse(selectedProduct.sizes).length > 0 && (
              <div className="space-y-2">
                <Label>Talla *</Label>
                <Select
                  value={orderForm.size}
                  onValueChange={(v) => setOrderForm((f) => ({ ...f, size: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar talla" />
                  </SelectTrigger>
                  <SelectContent>
                    {JSON.parse(selectedProduct.sizes).map((size: string) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color */}
            {selectedProduct?.color && (
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={orderForm.color}
                  onChange={(e) => setOrderForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder={selectedProduct.color}
                />
              </div>
            )}

            <Separator />

            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="od-fname">Nombre *</Label>
                <Input
                  id="od-fname"
                  value={orderForm.firstName}
                  onChange={(e) => setOrderForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="od-lname">Apellido *</Label>
                <Input
                  id="od-lname"
                  value={orderForm.lastName}
                  onChange={(e) => setOrderForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="od-email">Email *</Label>
                <Input
                  id="od-email"
                  type="email"
                  value={orderForm.email}
                  onChange={(e) => setOrderForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="od-phone">Telefono *</Label>
                <Input
                  id="od-phone"
                  type="tel"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="od-id">Cedula / RIF (opcional)</Label>
              <Input
                id="od-id"
                value={orderForm.idNumber}
                onChange={(e) => setOrderForm((f) => ({ ...f, idNumber: e.target.value }))}
              />
            </div>

            <Separator />

            {/* Payment */}
            <div className="space-y-2">
              <Label>Metodo de Pago *</Label>
              <Select
                value={orderForm.paymentMethod}
                onValueChange={(v) => setOrderForm((f) => ({ ...f, paymentMethod: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="pago_movil">Pago Movil</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="od-ref">Referencia de Pago</Label>
              <Input
                id="od-ref"
                value={orderForm.paymentRef}
                onChange={(e) => setOrderForm((f) => ({ ...f, paymentRef: e.target.value }))}
                placeholder="Numero de referencia"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="od-notes">Notas (opcional)</Label>
              <Textarea
                id="od-notes"
                value={orderForm.notes}
                onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Instrucciones especiales de entrega..."
                rows={2}
              />
            </div>

            {/* Total */}
            {selectedProduct && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio unitario</span>
                  <span>${selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cantidad</span>
                  <span>x{orderForm.quantity}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <div className="text-right">
                    <span className="text-blue-600">${(selectedProduct.price * orderForm.quantity).toFixed(2)}</span>
                    {selectedProduct.priceBs > 0 && (
                      <p className="text-sm text-gray-400">
                        Bs. {(selectedProduct.priceBs * orderForm.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-base"
              onClick={handleSubmitOrder}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  Confirmar Pedido
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WhatsAppButton />
    </div>
  );
}
