# 📋 PROYECTO-ESTADO.md — VzlaBike and Run

> **Archivo de estado técnico del proyecto.**  
> Última actualización: 2026-11-05  
> Mantener siempre actualizado tras cada cambio funcional.

---

## 🎯 IDENTIFICACIÓN DEL PROYECTO

| Campo | Valor |
|-------|-------|
| **Nombre** | VzlaBike and Run® |
| **Tipo** | Plataforma de cronometraje deportivo y organización de eventos |
| **Stack** | Next.js 16 + Prisma 6 + Tailwind CSS 4 + shadcn/ui |
| **Repo GitHub** | https://github.com/SEBASMTB/vzlabike-and-run |
| **Deploy Vercel** | https://vzlabike-and-run.vercel.app |
| **Base de datos** | Turso (libSQL) — `libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io` |

---

## 🔑 CREDENCIALES Y ACCESO

| Servicio | Dato |
|----------|------|
| **Admin URL** | https://vzlabike-and-run.vercel.app/admin/login |
| **Admin Password** | `vzlabike2024` |
| **GitHub User** | `SEBASMTB` |
| **Vercel Team** | `venezuelabike-9338s-projects` |
| **Turso Org** | `vbrresult` (Free plan) |
| **Turso DB** | `vzlabikeandrun` |

**Variables de entorno (Vercel + .env local):**
- `DATABASE_URL` = `libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io`
- `TURSO_AUTH_TOKEN` = (en Vercel Environment Variables + .env local, NO en git)

---

## ✅ FUNCIONES OPERATIVAS (Implementadas y funcionando)

### 🏠 Páginas públicas
- [x] `/` — Landing page (Hero, Features, Events, Services, Contact)
- [x] `/eventos` — Listado público con filtros por deporte y buscador
- [x] `/eventos/[slug]` — Detalle de evento individual
- [x] `/eventos/[slug]/inscribirse` — Página de inscripción
- [x] `/tienda` — Tienda de productos
- [x] `/resultados` — Redirige a resultados externos

### 🔐 Panel Admin (`/admin/*`)
- [x] Login con contraseña (`vzlabike2024`)
- [x] Middleware de auth (cookie-based, redirect a login)
- [x] Dashboard principal con stats
- [x] **Gestión de eventos** (CRUD completo)
  - [x] Formulario de creación/edición reestructurado (commit `18c4139`)
  - [x] **Sección 1: Banners** — Upload directo (dropzone) en lugar de URLs
  - [x] **Sección 2: Kit/Franela** — Upload imagen + campo contenido del kit
  - [x] **Sección 3: Premios** — Editor texto + carga múltiple imágenes
  - [x] **Sección 3: Reglas** — Texto + upload PDF/imagen del reglamento
  - [x] **Sección 3: Patrocinadores** — Carga múltiple logos + nombre + URL
  - [x] **Sección 4: Categorías** — Selector disciplina + plantillas + checkboxes + formulario especial
- [x] Gestión de inscripciones (aprobar/rechazar)
- [x] Gestión de tienda (productos CRUD)
- [x] Gestión de pedidos
- [x] Exportación Excel ChuckScore

### 🗄️ Base de datos
- [x] Turso configurado y conectado en producción
- [x] 9 columnas nuevas migradas al Event model (commit `6beefc5`)
- [x] 9 eventos existentes + 1 evento demo creado
- [x] Persistencia garantizada (datos sobreviven redeploys)

### 🎨 Componentes UI
- [x] `FileUpload` (dropzone reutilizable) — `src/components/ui/file-upload.tsx`
- [x] `SponsorsCarousel` (carrusel animado de logos) — `src/components/SponsorsCarousel.tsx`
- [x] `MultiImageUpload` (carga múltiple inline en EventFormPage)
- [x] `SponsorsLogosEditor` (editor de logos con nombre+URL inline)

---

## 📁 ARQUITECTURA DE ARCHIVOS CLAVE

```
/home/z/my-project/
├── prisma/schema.prisma          # Schema de BD (Event + Category + Registration + Product + ProductOrder + Runner)
├── src/lib/db.ts                 # Prisma client factory (Turso → file → /tmp) + EXPECTED_COLUMNS + seed
├── src/lib/categories.ts         # 761 líneas — generadores de categorías + 11 presets + MTB engine
├── src/middleware.ts             # Auth middleware (protege /admin/*)
├── src/app/
│   ├── page.tsx                  # Landing page
│   ├── (main)/eventos/page.tsx   # Listado público de eventos
│   ├── (main)/eventos/[slug]/    # Detalle de evento + inscripción
│   ├── tienda/page.tsx           # Tienda pública
│   ├── admin/(auth)/login/       # Login admin
│   ├── admin/(protected)/        # Dashboard + eventos + inscripciones + tienda + pedidos
│   │   └── eventos/nuevo/EventFormPage.tsx  # ⭐ FORMULARIO REESTRUCTURADO (1585 líneas)
│   └── api/                      # 34 endpoints (ver INVENTARIO-PROYECTO.md)
├── src/components/
│   ├── ui/file-upload.tsx        # Dropzone reutilizable
│   ├── SponsorsCarousel.tsx      # Carrusel de logos
│   ├── Header.tsx, Footer.tsx    # Layout público
│   └── admin/                    # CategoryManager, EventManager, etc.
├── scripts/
│   ├── migrate-turso.js          # Migración de columnas a Turso
│   ├── create-demo-event.py      # Script para crear evento demo
│   └── fix-demo-event.py         # Script para crear evento via API
└── download/
    ├── INVENTARIO-PROYECTO.md    # Inventario completo (rutas, APIs, componentes)
    ├── TURSO-SETUP.md            # Guía de configuración Turso
    └── PROYECTO-ESTADO.md        # ← ESTE ARCHIVO
```

---

## 📊 ESTADO DE LA BASE DE DATOS (Turso)

- **Tablas:** Event (38 columnas), Registration, Product, ProductOrder, Runner, Category
- **Eventos:** 9 totales (8 seed + 1 demo "DESAFIO MTB LA CULATA 2026")
- **Columnas nuevas del Event:** shirtImage, kitInfoDetails, prizesImages, rulesFile, sponsorsLogos, bannerHorizontalUrl, bannerVerticalUrl, requiresFederationLicense, hasShirtOption, shirtPrice

---

## ⚠️ ERRORES PENDIENTES / ISSUES CONOCIDOS

| # | Issue | Estado | Solución temporal |
|---|-------|--------|-------------------|
| 1 | El componente `SponsorsCarousel` no está integrado en la vista pública de detalle de evento (`EventDetailPage.tsx`) | **Pendiente** | Los logos se guardan en BD pero no se muestran en la web pública todavía |
| 2 | Las imágenes de premios (`prizesImages`) no se renderizan en la vista pública | **Pendiente** | Datos guardados, falta integrar en EventDetailPage |
| 3 | El archivo de reglamento (`rulesFile`) no tiene botón de descarga en la vista pública | **Pendiente** | Datos guardados, falta integrar |
| 4 | `shirtImage` y `kitInfoDetails` no se muestran en la vista pública | **Pendiente** | Datos guardados, falta integrar en EventDetailPage |
| 5 | El sistema dual de categorías (`Category` Prisma vs `EventCategory` raw SQL) sigue sin reconciliar | **Pendiente** | El formulario usa `Category` Prisma (bulk endpoint). `CategoryManager` usa `EventCategory` raw SQL |
| 6 | `src/app/api/debug/route.ts` puede exponer info sensible | **Baja prioridad** | Solo accesible con auth |

---

## 🔄 HISTORIAL DE COMMITS (git log)

```
78bc31a fix: Remover campo 'category' del prisma.event.create() que causaba error
6beefc5 feat: Script de migracion para Turso (columnas nuevas del Event)
bf33f93 config: Activar Turso como base de datos de produccion
a5dc312 feat: API endpoint para verificar configuracion de BD en produccion
c570f4d docs: Guia paso a paso para configurar Turso y persistencia en Vercel
0439653 fix: Aviso de persistencia cuando se usa SQLite efimero en produccion
18c4139 feat: Restructuracion completa del formulario de eventos admin
ba1e6f8 fix: Remover campo 'category' invalido del seed data
143d09d fix: Eliminar paginas duplicadas que causaban error de build en Vercel
47408a6 feat: VzlaBike and Run - Plataforma de cronometraje deportivo
```

---

## 🚀 SIGUIENTE PASO INMEDIATO

### Integrar los nuevos campos en la vista pública de detalle de evento

**Archivo a modificar:** `src/app/(main)/eventos/[slug]/EventDetailPage.tsx`

**Tareas:**
1. Mostrar `shirtImage` en la sección de kit/franela
2. Mostrar `kitInfoDetails` como contenido detallado del kit
3. Renderizar `prizesImages` (JSON array de base64) como galería de imágenes
4. Agregar botón de descarga para `rulesFile` (PDF o imagen del reglamento)
5. Integrar `SponsorsCarousel` con `sponsorsLogos` (JSON array de {logo, name, url})

**Notas:**
- El `EventDetailPage.tsx` ya existe y tiene su propia estructura (997 líneas)
- Los datos ya están en la BD (verificados con el evento demo)
- Solo falta renderizarlos en el frontend

---

## 📐 PROTOCOLO DE TRABAJO (a aplicar en cada sesión)

1. **Cada cambio funcional → commit atómico + push inmediato**
   ```bash
   git add .
   git commit -m "feat/fix: Descripción específica"
   git push origin main
   ```

2. **Vercel sincroniza automáticamente** tras cada push (2-3 min de build)

3. **Actualizar este archivo** (`PROYECTO-ESTADO.md`) tras cada cambio funcional:
   - Mover items de "Pendiente" a "Operativo"
   - Actualizar historial de commits
   - Actualizar "Siguiente paso inmediato"

4. **Al final de cada sesión**, generar el "Prompt de Resumen" en `SESSION-RESUME.md`

5. **Nunca dejar cambios sin commitear** — si el chat se cierra, los cambios se pierden
