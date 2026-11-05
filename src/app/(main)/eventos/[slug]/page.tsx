import { notFound } from "next/navigation";
import { type CategoryOption, parseEventCategories } from "@/lib/categories";
import { EventDetailPage } from "./EventDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: PageProps) {
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

  // Only show categories if the admin explicitly set them for this event
  let categories: CategoryOption[] = [];
  if (event.categories && event.categories.trim()) {
    categories = parseEventCategories(event.categories, event.sportType || "running");
  }

  return (
    <EventDetailPage
      event={{
        ...event,
        registrationCount: 0,
      }}
      categories={categories}
    />
  );
}
