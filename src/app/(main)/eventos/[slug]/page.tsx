import { EventDetailClient } from "./EventDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  return <EventDetailClient slug={slug} />;
}
