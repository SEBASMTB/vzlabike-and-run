import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VzlaBike and Run® - Cronometraje Deportivo y Organización de Eventos",
  description:
    "Organización de eventos deportivos con tecnología de punta. Cronometraje profesional para carreras, triatlones, MTB y más en Venezuela.",
  keywords: [
    "cronometraje",
    "eventos deportivos",
    "carreras",
    "triatlón",
    "MTB",
    "ciclismo",
    "Venezuela",
    "timing",
    "resultados",
  ],
  authors: [{ name: "VzlaBike and Run" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "VzlaBike and Run® - Cronometraje Deportivo Profesional",
    description:
      "Organizamos eventos deportivos con tecnología de punta. Carreras, Triatlones, MTB y más.",
    siteName: "VzlaBike and Run",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://vbr-results.vercel.app" />
        <link rel="preconnect" href="https://vbr-results.vercel.app" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://wa.me" />
      </head>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
