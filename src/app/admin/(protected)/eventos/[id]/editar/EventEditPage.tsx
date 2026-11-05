"use client";

import EventFormPage from "../../nuevo/EventFormPage";

interface EventEditPageProps {
  eventData: Record<string, unknown>;
  categories: Array<{
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
    gender: string;
    distanceKm: number | null;
    price: number;
  }>;
}

export default function EventEditPage({ eventData, categories }: EventEditPageProps) {
  // Map event data to form data format
  const initialData = {
    title: String(eventData.title || ""),
    slug: String(eventData.slug || ""),
    sportType: String(eventData.sportType || "running"),
    date: eventData.date
      ? new Date(eventData.date as string).toISOString().split("T")[0]
      : "",
    location: String(eventData.location || ""),
    description: String(eventData.description || ""),
    distance: String(eventData.distance || ""),
    imageUrl: String(eventData.imageUrl || ""),
    bannerImage: String(eventData.bannerImage || ""),
    bannerHorizontalUrl: String(eventData.bannerHorizontalUrl || ""),
    bannerVerticalUrl: String(eventData.bannerVerticalUrl || ""),
    hasShirtOption: String(eventData.hasShirtOption || "OPTIONAL"),
    shirtPrice: eventData.shirtPrice != null ? String(eventData.shirtPrice) : "",
    hasShirt: Boolean(eventData.hasShirt),
    price: String(eventData.price ?? 0),
    priceBs: String(eventData.priceBs ?? 0),
    maxParticipants: String(eventData.maxParticipants ?? 500),
    requiresFederationLicense: Boolean(eventData.requiresFederationLicense),
    ageCalcMode: String(eventData.ageCalcMode || "calendar_year"),
    categoryInterval: String(eventData.categoryInterval || "10"),
    status: String(eventData.status || "upcoming"),
    featured: Boolean(eventData.featured),
    organizer: String(eventData.organizer || ""),
    prizes: String(eventData.prizes || ""),
    rules: String(eventData.rules || ""),
    kitInfo: String(eventData.kitInfo || ""),
    sponsors: String(eventData.sponsors || ""),
  };

  const initialCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    minAge: cat.minAge,
    maxAge: cat.maxAge,
    gender: cat.gender,
    distanceKm: cat.distanceKm != null ? String(cat.distanceKm) : "",
    price: String(cat.price),
  }));

  return (
    <EventFormPage
      mode="edit"
      eventId={String(eventData.id)}
      initialData={initialData}
      initialCategories={initialCategories}
    />
  );
}
