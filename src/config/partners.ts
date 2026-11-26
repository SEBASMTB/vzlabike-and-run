/**
 * CLIENTES Y ALIADOS — configuración de logos de la home.
 *
 * CÓMO AGREGAR O ACTUALIZAR UN LOGO (2 pasos):
 *  1. Guarda el archivo en `public/aliados/` (PNG/SVG/WebP con fondo
 *     transparente, resolución ~2x del tamaño final para que se vea nítido).
 *  2. Añade una entrada en la lista `partners` de abajo:
 *       { name: "Marca", logo: "/aliados/marca.png", width: 140, height: 60 }
 *
 * Notas:
 *  - `width`/`height` son el tamaño de RENDER en píxeles (no el tamaño del
 *    archivo); Next/Image los usa para evitar saltos de layout.
 *  - Si omites width/height se usan 140×60 (proporción horizontal estándar).
 *  - El orden de la lista es el orden de aparición en la sección.
 *  - La sección (`src/components/ClientsSection.tsx`) renderiza esta lista
 *    automáticamente: no hace falta tocar el componente.
 */

export interface Partner {
  name: string;
  /** Ruta pública del logo, ej. "/aliados/marca.png" */
  logo: string;
  /** Ancho de render en px (opcional, default 140) */
  width?: number;
  /** Alto de render en px (opcional, default 60) */
  height?: number;
}

export const partners: Partner[] = [
  { name: "World Triathlon", logo: "/aliados/logo-world-athletics.png", width: 140, height: 60 },
  { name: "UCI", logo: "/aliados/logo-uci.png", width: 80, height: 80 },
  { name: "World Athletics", logo: "/aliados/logo-world-athletics-2.png", width: 140, height: 60 },
  { name: "FEVE Tri", logo: "/aliados/logo-fevetri.png", width: 120, height: 120 },
  { name: "FVA", logo: "/aliados/logo-fva.png", width: 120, height: 120 },
];
