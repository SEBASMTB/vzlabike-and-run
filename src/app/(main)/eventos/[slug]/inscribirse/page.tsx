import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InscribirsePage } from "./InscribirsePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InscribirseRoute({ params }: PageProps) {
  const { slug } = await params;

  let event;
  try {
    event = await db.event.findUnique({
      where: { slug },
      include: {
        categoryList: {
          orderBy: [{ minAge: "asc" }, { gender: "asc" }],
        },
      },
    });
  } catch {
    notFound();
  }

  if (!event) {
    notFound();
  }

  // Solo permitir inscripción si el evento está activo o próximo
  if (event.status === "cancelled" || event.status === "finished") {
    notFound();
  }

  return <InscribirsePage event={event} registrationCount={0} />;
}
