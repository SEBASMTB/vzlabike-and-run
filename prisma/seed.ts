import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  // Clear existing data
  await db.registration.deleteMany();
  await db.event.deleteMany();

  const events = [
    {
      title: "WOMENS RUN",
      slug: "womens-run-2024",
      description:
        "La carrera más grande de mujeres en Venezuela. Únete a miles de corredoras en esta emocionante prueba de 5K. Un evento diseñado para celebrar la fuerza, determinación y espíritu deportivo de la mujer venezolana.",
      date: addDays(30),
      location: "Caracas, Venezuela",
      distance: "5K",
      category: "Carrera",
      imageUrl: "/event-womens-run.jpg",
      price: 35,
      status: "upcoming",
      maxParticipants: 2000,
      featured: true,
    },
    {
      title: "21K LA AUTOPISTA",
      slug: "21k-la-autopista",
      description:
        "La media maratón más emblemática del país. Recorre la autopista en una experiencia única con cierre total de vías. Miles de corredores disfrutan de este evento que combina deportividad y espectacularidad.",
      date: addDays(108),
      location: "Autopista Regional del Centro, Venezuela",
      distance: "21K",
      category: "Carrera",
      imageUrl: "/event-21k-autopista.jpg",
      price: 65,
      status: "upcoming",
      maxParticipants: 5000,
      featured: true,
    },
    {
      title: "FARMALUNA 10K",
      slug: "farmaluna-10k-2024",
      description:
        "Corre bajo la luz de la luna en esta mágica carrera nocturna. La Farmaluna 10K te ofrece una experiencia diferente con iluminación especial, música en vivo y un ambiente incomparable.",
      date: addDays(15),
      location: "Caracas, Venezuela",
      distance: "10K",
      category: "Carrera",
      imageUrl: "/event-farmaluna.jpg",
      price: 45,
      status: "upcoming",
      maxParticipants: 3000,
      featured: false,
    },
    {
      title: "LA RUTA DIGITAL",
      slug: "la-ruta-digital-2024",
      description:
        "El primer evento virtual integrado con tecnología de punta. Corre desde cualquier lugar, registra tu recorrido y compite con atletas de todo el país. Resultados en tiempo real a través de nuestra plataforma VBRWorks.",
      date: addDays(31),
      location: "Virtual - Desde cualquier lugar",
      distance: "10K Virtual",
      category: "Virtual",
      imageUrl: "/event-ruta-digital.jpg",
      price: 25,
      status: "upcoming",
      maxParticipants: 10000,
      featured: false,
    },
    {
      title: "MARATÓN DE CARACAS",
      slug: "maraton-caracas-2024",
      description:
        "El maratón más importante de Venezuela. 42 kilómetros de pura emoción recorriendo las calles más emblemáticas de la capital. Un desafío para los corredores más exigentes.",
      date: addDays(60),
      location: "Caracas, Venezuela",
      distance: "42K",
      category: "Carrera",
      imageUrl: "/event-maraton-caracas.jpg",
      price: 85,
      status: "upcoming",
      maxParticipants: 4000,
      featured: false,
    },
    {
      title: "TRIATLÓN VZLA",
      slug: "triatlon-vzla-2024",
      description:
        "El triatlón más completo de Venezuela. Distancia olímpica: 1.5km de natación, 40km de ciclismo y 10km de carrera. Un evento para atletas que buscan superar sus límites en tres disciplinas.",
      date: addDays(90),
      location: "Valencia, Venezuela",
      distance: "Distancia Olímpica",
      category: "Triatlón",
      imageUrl: "/event-triatlon.jpg",
      price: 120,
      status: "upcoming",
      maxParticipants: 500,
      featured: false,
    },
  ];

  console.log("🌱 Seeding events...");

  for (const event of events) {
    await db.event.create({ data: event });
    console.log(`  ✅ Created event: ${event.title}`);
  }

  console.log(`\n🎉 Seeding completed! ${events.length} events created.`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
