"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Search, Eye, CheckCircle, XCircle,
  Clock, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Order {
  id: string;
  productId: string;
  product: { name: string; imageUrl: string };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  size: string;
  color: string;
  quantity: number;
  totalPrice: number;
  totalPriceBs: number;
  paymentMethod: string;
  paymentRef: string;
  status: string;
  notes: string;
  createdAt: string;
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (filterStatus !== "todos") params.set("status", filterStatus);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/admin/product-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      console.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      // Use the product-orders API to update status
      const res = await fetch(`/api/admin/product-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Estado actualizado");
        fetchOrders();
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const exportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      "ID", "Producto", "Nombre", "Apellido", "Email", "Telefono",
      "Cedula", "Talla", "Color", "Cantidad", "Total USD", "Total Bs",
      "Metodo Pago", "Referencia", "Estado", "Notas", "Fecha"
    ];

    const rows = orders.map((o) => [
      o.id, o.product.name, o.firstName, o.lastName, o.email, o.phone,
      o.idNumber, o.size, o.color, o.quantity, o.totalPrice.toFixed(2),
      o.totalPriceBs.toFixed(2), o.paymentMethod, o.paymentRef,
      o.status, o.notes, new Date(o.createdAt).toLocaleString("es-VE"),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmado</Badge>;
      case "shipped":
        return <Badge className="bg-blue-100 text-blue-700">Enviado</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-100 text-emerald-700">Entregado</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin size-8 text-gray-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Cargando pedidos...</p>
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
            Pedidos de Tienda
          </h1>
          <p className="text-gray-500 mt-1">Gestiona los pedidos de productos de la tienda</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o cedula..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay pedidos</h3>
            <p className="text-gray-400 mt-1">Los pedidos de la tienda apareceran aqui</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-left p-3 font-medium text-gray-500">Producto</th>
                    <th className="text-left p-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-left p-3 font-medium text-gray-500">Cantidad</th>
                    <th className="text-left p-3 font-medium text-gray-500">Total</th>
                    <th className="text-left p-3 font-medium text-gray-500">Estado</th>
                    <th className="text-left p-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("es-VE", {
                          day: "2-digit", month: "short"
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {order.product.imageUrl && (
                            <img
                              src={order.product.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium truncate max-w-32">
                            {order.product.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{order.firstName} {order.lastName}</p>
                        <p className="text-xs text-gray-400">{order.email}</p>
                      </td>
                      <td className="p-3">{order.quantity}</td>
                      <td className="p-3">
                        <p className="font-semibold">${order.totalPrice.toFixed(2)}</p>
                        {order.totalPriceBs > 0 && (
                          <p className="text-xs text-gray-400">Bs. {order.totalPriceBs.toFixed(2)}</p>
                        )}
                      </td>
                      <td className="p-3">{statusBadge(order.status)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Ver detalle"
                          >
                            <Eye className="size-4 text-gray-500" />
                          </button>
                          {order.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(order.id, "confirmed")}
                                className="p-1.5 rounded hover:bg-green-50"
                                title="Confirmar"
                              >
                                <CheckCircle className="size-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => updateStatus(order.id, "cancelled")}
                                className="p-1.5 rounded hover:bg-red-50"
                                title="Cancelar"
                              >
                                <XCircle className="size-4 text-red-500" />
                              </button>
                            </>
                          )}
                          {order.status === "confirmed" && (
                            <button
                              onClick={() => updateStatus(order.id, "shipped")}
                              className="p-1.5 rounded hover:bg-blue-50"
                              title="Marcar enviado"
                            >
                              <ShoppingCart className="size-4 text-blue-600" />
                            </button>
                          )}
                          {order.status === "shipped" && (
                            <button
                              onClick={() => updateStatus(order.id, "delivered")}
                              className="p-1.5 rounded hover:bg-emerald-50"
                              title="Marcar entregado"
                            >
                              <CheckCircle className="size-4 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Pagina {page} de {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {selectedOrder.product.imageUrl && (
                  <img
                    src={selectedOrder.product.imageUrl}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{selectedOrder.product.name}</h3>
                  <p className="text-sm text-gray-500">
                    Cantidad: {selectedOrder.quantity} x ${selectedOrder.totalPrice / selectedOrder.quantity}
                  </p>
                  <p className="font-bold text-blue-600 mt-1">
                    Total: ${selectedOrder.totalPrice.toFixed(2)}
                  </p>
                  {selectedOrder.totalPriceBs > 0 && (
                    <p className="text-sm text-gray-400">
                      Bs. {selectedOrder.totalPriceBs.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefono</p>
                  <p className="font-medium">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cedula</p>
                  <p className="font-medium">{selectedOrder.idNumber || "-"}</p>
                </div>
                {selectedOrder.size && (
                  <div>
                    <p className="text-gray-500">Talla</p>
                    <p className="font-medium">{selectedOrder.size}</p>
                  </div>
                )}
                {selectedOrder.color && (
                  <div>
                    <p className="text-gray-500">Color</p>
                    <p className="font-medium">{selectedOrder.color}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Metodo de Pago</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentMethod || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Referencia</p>
                  <p className="font-medium">{selectedOrder.paymentRef || "-"}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-gray-500 text-sm">Notas</p>
                  <p className="text-sm bg-gray-50 rounded p-2 mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {statusBadge(selectedOrder.status)}
                  <span className="text-xs text-gray-400">
                    {new Date(selectedOrder.createdAt).toLocaleString("es-VE")}
                  </span>
                </div>
                {selectedOrder.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        updateStatus(selectedOrder.id, "confirmed");
                        setDetailOpen(false);
                      }}
                    >
                      <CheckCircle className="size-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        updateStatus(selectedOrder.id, "cancelled");
                        setDetailOpen(false);
                      }}
                    >
                      <XCircle className="size-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
