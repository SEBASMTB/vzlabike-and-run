"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "./SectionHeading";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.email("Ingresa un email válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
  eventType: z.string().min(1, "Selecciona el tipo de evento"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Phone,
    title: "Teléfono",
    details: ["+58 412-016-2685"],
    action: "tel:+584120162685",
  },
  {
    icon: Mail,
    title: "Email",
    details: ["info@vzlabikeandrun.com", "soporte@vzlabikeandrun.com"],
    action: "mailto:info@vzlabikeandrun.com",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    details: ["+58 412-016-2685"],
    action: "https://wa.me/584120162685",
  },
  {
    icon: MapPin,
    title: "Dirección",
    details: ["Caracas, Venezuela"],
    action: "#",
  },
  {
    icon: Clock,
    title: "Horario",
    details: ["Lun - Vie: 8:00 AM - 6:00 PM", "Sáb: 9:00 AM - 2:00 PM"],
    action: "#",
  },
];

export function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const [eventType, setEventType] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      eventType: "",
      message: "",
    },
  });

  const handleEventTypeChange = useCallback((val: string) => {
    setEventType(val);
    setValue("eventType", val, { shouldValidate: true });
  }, [setValue]);

  const onSubmit = async (data: ContactForm) => {
    setSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    toast({
      title: "¡Mensaje Enviado! 📬",
      description:
        "Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.",
    });
  };

  return (
    <section id="contacto" className="py-20 md:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Contáctanos"
          subtitle="¿Listo para llevar tu evento al siguiente nivel? Contáctanos y recibe una cotización personalizada."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nombre Completo *</Label>
                  <Input
                    id="contact-name"
                    placeholder="Tu nombre"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Teléfono *</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+58 412-016-2685"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-event">Tipo de Evento *</Label>
                  <Select
                    value={eventType}
                    onValueChange={handleEventTypeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carrera">Carrera (Running)</SelectItem>
                      <SelectItem value="triatlon">Triatlón</SelectItem>
                      <SelectItem value="mtb">MTB / Ciclismo</SelectItem>
                      <SelectItem value="virtual">Evento Virtual</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.eventType && (
                    <p className="text-sm text-destructive">
                      {errors.eventType.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Mensaje *</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Cuéntanos sobre tu evento..."
                  className="min-h-[120px]"
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gradient-primary text-white border-0"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden h-48 bg-gray-200 relative">
              <div className="absolute inset-0 gradient-dark flex items-center justify-center">
                <div className="text-center text-white">
                  <MapPin className="size-10 mx-auto mb-2 text-red-400" />
                  <p className="font-semibold">Caracas, Venezuela</p>
                  <p className="text-sm text-white/60">
                    Ubicación central para servicios en todo el país
                  </p>
                </div>
              </div>
            </div>

            {/* Contact items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info) => (
                <a
                  key={info.title}
                  href={info.action}
                  target={info.action.startsWith("http") ? "_blank" : undefined}
                  rel={
                    info.action.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="flex items-start gap-3 p-4 bg-card rounded-xl border hover:border-red-200 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <info.icon className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {info.title}
                    </p>
                    {info.details.map((detail) => (
                      <p key={detail} className="text-xs text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                </a>
              ))}
            </div>

            {/* Social media */}
            <div className="bg-card rounded-xl border p-4">
              <p className="font-semibold text-sm mb-3">Síguenos en Redes Sociales</p>
              <div className="flex gap-3">
                {[
                  {
                    name: "Instagram",
                    href: "#",
                    color: "bg-gradient-to-br from-purple-500 to-pink-500",
                  },
                  {
                    name: "Facebook",
                    href: "#",
                    color: "bg-blue-600",
                  },
                  {
                    name: "Twitter/X",
                    href: "#",
                    color: "bg-gray-800",
                  },
                  {
                    name: "YouTube",
                    href: "#",
                    color: "bg-red-600",
                  },
                  {
                    name: "TikTok",
                    href: "#",
                    color: "bg-gray-900",
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={`w-10 h-10 ${social.color} rounded-lg flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform`}
                  >
                    {social.name.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
