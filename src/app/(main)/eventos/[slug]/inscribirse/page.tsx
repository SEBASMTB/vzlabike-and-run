import { notFound } from "next/navigation";
import { InscribirsePage } from "./InscribirsePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InscribirseRoute({ params }: PageProps) {
  const { slug } = await params;

  // Fetch event data from internal API (avoids Prisma schema mismatch in server components)
  let event: any = null;
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/events/${slug}`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      event = await res.json();
    }
  } catch {
    // ignore fetch errors
  }

  if (!event) {
    notFound();
  }

  // Solo permitir inscripción si el evento está activo o próximo
  if (event.status === "cancelled" || event.status === "finished") {
    notFound();
  }

  // Fetch categories for this event
  let categories: any[] = [];
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const catRes = await fetch(`${baseUrl}/api/events/${slug}/categories`, {
      next: { revalidate: 0 },
    });
    if (catRes.ok) {
      categories = await catRes.json();
    }
  } catch {
    // ignore
  }

  const eventData = {
    ...event,
    categoryList: categories,
  };

  return <InscribirsePage event={eventData} registrationCount={0} />;
}
