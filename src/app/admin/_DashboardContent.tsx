"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Users,
  UserCheck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Stats {
  totalEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  estimatedRevenue: number;
  recentRegistrations: RecentRegistration[];
  eventsWithCount: EventWithCount[];
}

interface RecentRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  bibNumber: number | null;
  createdAt: string;
  event: { title: string };
}

interface EventWithCount {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  status: string;
  price: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

const eventStatusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const eventStatusLabels: Record<string, string> = {
  upcoming: "Próximo",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

const statsCards = [
  {
    key: "totalEvents" as const,
    label: "Total Eventos",
    icon: CalendarDays,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "totalRegistrations" as const,
    label: "Total Inscritos",
    icon: Users,
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "confirmedRegistrations" as const,
    label: "Inscritos Confirmados",
    icon: UserCheck,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "estimatedRevenue" as const,
    label: "Ingresos Estimados",
    icon: DollarSign,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    isCurrency: true,
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen general de la plataforma VzlaBike and Run
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.key} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.label}
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {card.isCurrency && stats
                        ? formatCurrency(stats[card.key])
                        : stats?.[card.key]?.toLocaleString() || "0"}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "size-11 rounded-xl flex items-center justify-center",
                    card.bgColor
                  )}
                >
                  <card.icon className={cn("size-5", card.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-red-500" />
              <CardTitle className="text-lg">Inscripciones Recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Evento</TableHead>
                      <TableHead className="text-xs">Estado</TableHead>
                      <TableHead className="text-xs">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recentRegistrations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          No hay inscripciones recientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats?.recentRegistrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium text-sm">
                            {reg.firstName} {reg.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                            {reg.event.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                statusColors[reg.status] || ""
                              )}
                            >
                              {statusLabels[reg.status] || reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(reg.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-red-500" />
              <CardTitle className="text-lg">Eventos y Registros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {stats?.eventsWithCount.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay eventos registrados
                  </div>
                ) : (
                  stats?.eventsWithCount.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(event.date)} · {event.location}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          <Users className="size-3.5 text-muted-foreground" />
                          {event.confirmedRegistrations}
                          <span className="text-muted-foreground font-normal">
                            /{event.totalRegistrations}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs mt-1",
                            eventStatusColors[event.status] || ""
                          )}
                        >
                          {eventStatusLabels[event.status] || event.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
