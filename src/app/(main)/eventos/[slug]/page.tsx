import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { type CategoryOption, parseEventCategories } from "@/lib/categories";
import { EventDetailPage } from "./EventDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;

  let event;
  try {
    event = await db.event.findUnique({
      where: { slug },
    });
  } catch {
    notFound();
  }

  if (!event) {
    notFound();
  }

  // Only show categories if the admin explicitly set them for this event
  // Do NOT auto-generate default categories for the detail page
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
