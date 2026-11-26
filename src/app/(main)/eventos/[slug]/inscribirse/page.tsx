import { redirect } from "next/navigation";
import { InscribirseClient } from "./InscribirseClient";
import { getSessionUserFromServer } from "@/lib/user-auth";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Ruta de inscripción (server component).
 *
 * ACCESO OBLIGATORIO: ver el evento, la web y la lista de inscritos es
 * libre, pero para INSCRIBIRSE se requiere sesión. Sin sesión se redirige
 * a /iniciar-sesion con el parámetro ?redirect= para volver exactamente
 * aquí tras iniciar sesión o registrarse (donde la ficha del corredor se
 * auto-completa desde la tabla Runner por su cédula).
 */
export default async function InscribirseRoute({ params }: PageProps) {
  const { slug } = await params;

  const user = await getSessionUserFromServer();
  if (!user) {
    redirect(
      `/iniciar-sesion?redirect=${encodeURIComponent(
        `/eventos/${slug}/inscribirse`
      )}`
    );
  }

  return <InscribirseClient slug={slug} />;
}
