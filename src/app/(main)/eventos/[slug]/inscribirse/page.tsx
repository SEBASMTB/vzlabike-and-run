import { InscribirseClient } from "./InscribirseClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InscribirseRoute({ params }: PageProps) {
  const { slug } = await params;
  return <InscribirseClient slug={slug} />;
}
