import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

// Force dynamic rendering — nunca cachear páginas admin
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  // Verificar token del lado del servidor
  // Si no existe o es inválido/expirado → redirigir al login
  if (!token || !verifyToken(token)) {
    redirect("/admin/login");
  }

  // Token válido → renderizar shell con sidebar
  return <AdminShell>{children}</AdminShell>;
}
