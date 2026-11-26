# Logos de Clientes y Aliados

Esta carpeta contiene los logos que se muestran en la sección
**"Clientes y Aliados"** de la página principal.

## Cómo agregar o actualizar un logo (2 pasos)

1. Guarda el archivo aquí (`public/aliados/`) — PNG/SVG/WebP con fondo
   transparente, resolución ~2x del tamaño final de render.
2. Añade su entrada en `src/config/partners.ts`:

   ```ts
   { name: "Marca", logo: "/aliados/marca.png", width: 140, height: 60 }
   ```

La sección de la home renderiza la lista automáticamente. Sin tocar el
componente. Recomendado: nombres de archivo en minúsculas y sin espacios
(`mi-marca.png`).
