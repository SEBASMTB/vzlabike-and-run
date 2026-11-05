import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EventEditPage from "./EventEditPage";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      categoryList: {
        orderBy: [{ gender: "asc" }, { minAge: "asc" }],
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Serialize dates for client component
  const eventData = {
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };

  return (
    <EventEditPage
      eventData={eventData as Record<string, unknown>}
      categories={event.categoryList.map((cat) => ({
        id: cat.id,
        name: cat.name,
        minAge: cat.minAge,
        maxAge: cat.maxAge,
        gender: cat.gender,
        distanceKm: cat.distanceKm,
        price: cat.price,
      }))}
    />
  );
}
