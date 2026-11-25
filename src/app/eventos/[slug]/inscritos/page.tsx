import { Metadata } from "next";
import { ListaInscritosClient } from "./ListaInscritosClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Lista de Inscritos | VzlaBike and Run®",
    description:
      "Lista pública de participantes inscritos del evento. Consulta tu dorsal, categoría y estado de inscripción.",
  };
}

export default async function ListaInscritosPage({ params }: PageProps) {
  const { slug } = await params;
  return <ListaInscritosClient slug={slug} />;
}
