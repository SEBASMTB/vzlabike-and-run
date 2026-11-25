# 📋 PROYECTO-ESTADO.md — VzlaBike and Run

> **Archivo de estado técnico del proyecto.**  
> Última actualización: 2026-11-25 (commit `260114f`)  
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
  - [x] Tipografía **Figtree** global (estilo Active Network) — commit `faf9474`
  - [x] Sección **¿Por Qué Elegirnos?** con **fotografías deportivas reales** (maratón, salida, cronometraje, foto-finish, triatlón, medalla) alineadas al texto de cada tarjeta, **sin logos** — commit `11eeb78` (v2 isométrico `6a24825` descartado por el usuario)
- [x] `/eventos` — Listado público con filtros por deporte y buscador
  - [x] Hero con imagen profesional multi-disciplina (ciclismo de ruta, triatlón, calle, trekking) — commit `0bfe73a`
- [x] `/eventos/[slug]` — Detalle de evento individual
- [x] **Sección Monitor Live** (`/#monitor-live`) — nueva en la landing entre Servicios y Plataforma: foto real del monitor del evento (Santa Ana Corre 10K) en bisel de monitor con animación Ken Burns ligera (solo transform/GPU, 26s, desactivada con `prefers-reduced-motion`), badge EN VIVO con pulso, 4 beneficios y CTAs (resultados online + solicitar servicio) — commit `1b9a1e4`
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
- [x] **Tipografía Figtree** (next/font/google, 300–900) — alternativa libre a "GP Commerce" de activenetwork.com; variable `--font-figtree` en `<html>` + regla base en globals.css. **Nota:** Inter nunca llegó a aplicarse (la variable estaba en `<body>` y Tailwind v4 aplica la fuente en `<html>`) — corregido en `faf9474`
- [x] **Hero multi-disciplina `/eventos`** — imagen WebP 2560x1440 (ciclismo, triatlón, calle, trekking) + overlays de legibilidad (`0bfe73a`)
- [x] **6 fotografías deportivas** — `public/features/{experiencia,creatividad,tecnologia,precision,adaptabilidad,compromiso}.webp` (896x512, 32–101 KB, colores naturales, sin texto/logos; masters en `scripts/foto-*.png`, generador `scripts/gen-features-foto.mjs`). **Sin chip de logo** (el usuario lo pidió quitar — el chip CSS de `6a24825` fue eliminado de `FeaturesSection.tsx`)
- [x] `MonitorLiveSection` (nueva sección Monitor Live con foto real animada) — `src/components/MonitorLiveSection.tsx`
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
│   ├── fix-demo-event.py         # Script para crear evento via API
│   ├── gen-hero.mjs              # Generador imagen héroe (SDK z-ai, tamaños custom múltiplos de 32)
│   └── hero-a.png                # Imagen fuente multi-disciplina (master, 2560x1440)
└── download/
    ├── INVENTARIO-PROYECTO.md    # Inventario completo (rutas, APIs, componentes)
    ├── TURSO-SETUP.md            # Guía de configuración Turso
    └── PROYECTO-ESTADO.md        # ← ESTE ARCHIVO
```

---

## 📊 ESTADO DE LA BASE DE DATOS (Turso)

- **Tablas:** Event (38 columnas), Registration, Product, ProductOrder, Runner, Category
- **Eventos:** 9 totales (8 seed/demo + evento "MISS" running 21K restaurado)
- **⚠️ Incidente 2026-11-10:** el evento MISS fue borrado dos veces durante pruebas de seguridad vía API (el DELETE sin auth se ejecutó porque el fix aún no estaba desplegado). Recreado vía `POST /api/events` con todos sus campos originales (id actual `cmwawt4yw0000jq08jrzyyfwk`). **Pendiente:** re-subir la imagen del evento desde el panel (la imagen base64 original se perdió).
- **Columnas nuevas del Event:** shirtImage, kitInfoDetails, prizesImages, rulesFile, sponsorsLogos, bannerHorizontalUrl, bannerVerticalUrl, requiresFederationLicense, hasShirtOption, shirtPrice

---

## 🧪 RESULTADOS DE PRUEBAS API (2026-11-10)

| Prueba | Resultado |
|--------|-----------|
| `POST /api/admin/auth` (login) | ✅ 200, cookie `admin_token` 4h |
| `GET /api/events` (público) | ✅ 200, lista liviana |
| `GET /api/admin/events/[id]` (con cookie) | ✅ 200, evento completo |
| `PUT /api/admin/events/[id]` (con cookie) | ✅ 200 — actualiza texto, números, booleanos, fecha y shirtPrice; verificado en BD |
| `PUT` con campo inexistente | ✅ Lo ignora sin romper |
| `PUT` con URL equivocada (`/api/events/[id]`) | ❌ 405 — la ruta correcta es `/api/admin/events/[id]` |
| `PUT`/`DELETE`/`POST` **sin auth** | ✅ **RESUELTO EN PRODUCCIÓN (deploy `98be1de`)**: ahora devuelven `401 {"error":"No autenticado"}`. La vulnerabilidad era el modo "permissive" (commits `8174298` + `4f7db6c`) y el deploy quedó bloqueado por el build roto hasta `98be1de` |
| `GET /api/health` | ✅ 200 — `version: 2.1.0` en producción, marcador de deploy funcionando |
| Páginas `/`, `/eventos`, `/eventos/miss`, `/admin/login` | ✅ 200 |
| `/admin/eventos` sin login | ✅ 307 → redirect a login (guard server-side funcionando) |
| `PUT` con auth | ✅ 200 — write verificado en BD |

---

## ⚠️ ERRORES PENDIENTES / ISSUES CONOCIDOS

| # | Issue | Estado | Solución temporal |
|---|-------|--------|-------------------|
| 1 | ~~SponsorsCarousel no integrado en vista pública~~ | ✅ **Resuelto** (commit `9fa807c`) | Integrado en EventDetailPage |
| 2 | ~~prizesImages no se renderizan en vista pública~~ | ✅ **Resuelto** (commit `9fa807c`) | Galería de imágenes integrada |
| 3 | ~~rulesFile sin botón de descarga~~ | ✅ **Resuelto** (commit `9fa807c`) | Botón de descarga agregado |
| 4 | ~~shirtImage y kitInfoDetails no se muestran~~ | ✅ **Resuelto** (commit `9fa807c`) | Sección de franela + kit integrada |
| 5 | ~~Sistema dual de categorías (`Category` Prisma vs `EventCategory` raw SQL)~~ | ✅ **Resuelto** (commit `1fde98d`) | Fuente única = modelo Prisma `Category`. Endpoint público reescrito (lee Category + fallback estándar del deporte). Ruta admin migrada a Category. `CategoryManager` huérfano eliminado |
| 6 | ~~Inscripción pública rota (HTTP 500 en `register`)~~ | ✅ **Resuelto** (commit `1fde98d`) | `Registration.category` (texto) agregado al schema; `runnerId`/`categoryId` opcionales; columna `hasShirt` añadida a DDL/migraciones (P2022); tabla `Runner` en DDL; `categoryId` se resuelve por nombre |
| 7 | ~~Fecha del evento desplazada un día (14/02 mostraba 13/02)~~ | ✅ **Resuelto** (commit `1fde98d`) | `src/lib/date-utils.ts`: formateo SIEMPRE UTC; date-only se guarda al mediodía UTC en POST/PUT; barrido UTC en ~12 archivos |
| 8 | ~~Wizard no asigna categoría por fecha de nacimiento~~ | ✅ **Resuelto** (commit `1fde98d`) | Auto-asignación por edad+género con badge "Asignada" (editable). Eventos sin categorías definidas reciben las estándar del deporte |
| 11 | ~~Fecha de nacimiento absurda (p. ej. año 2027 → edad "-1 años") sin aviso en vivo~~ | ✅ **Resuelto** (commit `260114f`) | Error bajo "Edad calculada" al instante (futura, <5, >100), borde rojo, `max=hoy` en el input; validación server-side espejo (400) |
| 9 | `src/app/api/debug/route.ts` puede exponer info sensible | **Baja prioridad** | Solo accesible con auth |
| 10 | PUT/DELETE admin usan interpolación de strings con escape `''` (commits `5491ae8`/`06dc196` — libSQL no soporta params) | ⚠️ Aceptable | SQLite escapa comillas dobladas y las columnas van con allowlist. Refactorizar a params si el adaptador llega a soportarlos |

---

## 🔍 REVISIÓN FLUJO INSCRIPCIONES/PAGOS (2026-11-10) — diagnóstico previo al rediseño

> **ACTUALIZACIÓN 2026-11-25 (`260114f`)**: El hallazgo crítico y los items 1, 2 y 3 están RESUELTOS — la inscripción pública funciona E2E (E2E local 16/16 PASS en `scripts/e2e-registro-categorias.mjs`; verificación en producción con POST real HTTP 201). Categorías: fuente única `Category` con fallback estándar del deporte. **Comprobante (`paymentProofUrl`), montos USD/Bs y tasa BCV ya se persisten** (con compresión client-side máx 1600px JPEG + tope 3MB PDFs + guard 4MB). **Runner por cédula con upsert** y `runnerId`/`categoryId` vinculados a la Registration. Pendientes: estados únicos, panel admin, PII (fases 2 y 4 de la propuesta).

**Hallazgo crítico verificado en producción: LA INSCRIPCIÓN PÚBLICA ESTÁ ROTA (HTTP 500).**
`POST /api/events/[slug]/register` hace `db.registration.create({ category: "texto" })` sin `runnerId`/`categoryId` que el schema exige (schema.prisma:144-147) → PrismaClientValidationError → 500. Probado en producción: 500 confirmado. Producción tiene **0 inscripciones** (el flujo nunca funcionó; no hay datos que migrar). → **RESUELTO en `1fde98d`**

Otros hallazgos clave (revisión completa 2026-11-10):
1. ~~**Comprobante de pago nunca se guarda**~~ **RESUELTO (`260114f`)**: `paymentProofUrl` se persiste (base64); FileUpload comprime imágenes en el navegador (máx 1600px JPEG q0.82, solo >400KB) y topea PDFs en 3MB; guard del endpoint 1.5MB→4MB.
2. ~~**Montos y tasa BCV se descartan**~~ **RESUELTO (`260114f`)**: `totalAmount`, `totalAmountBs` y `bcvRate` se guardan con la inscripción (además de estado, ciudad y contacto de emergencia con parentesco).
3. ~~Categorías: 4 fuentes en conflicto~~ **RESUELTO (`1fde98d`)**: fuente única = `Category` (Prisma); endpoint público lee Category con fallback estándar del deporte; `openCategories` eliminado; `EventCategory`/`CategoryManager` eliminados; inscripciones guardan categoryId + snapshot texto
4. **Estados inconsistentes**: "pending" minúscula (register) vs "PENDING" (schema) vs "confirmed" legacy (stats/dashboard) → badges sin color, filtros confusos.
5. **Admin inscripciones**: filtro por categoría roto (UI lo envía, API lo ignora), búsqueda por dorsal no existe (placeholder lo promete), sin motivo de rechazo, sin email al aprobar/rechazar, dorsal se asigna al crear (debería ser al aprobar), export ChuckScore incluye PENDING, sin acciones masivas.
6. **Código muerto**: `/api/register` (el único endpoint alineado al schema — irónico), `/api/eligibility`, `RegistrationDialog` + `GroupRegistrationDialog` (vivos en la home, llaman al endpoint roto, taxonomía de pago distinta), `CategoryManager`, `InscribirsePage.tsx`.
7. **PII pública**: `/eventos/[slug]/inscritos` publica cédula+fecha de nacimiento; `/api/registrations/lookup` sin auth devuelve email/teléfono/DOB por cédula; `GET /api/registrations` vuelca todo incl. paymentRef.
8. **Datos de destino de pago no se muestran**: los IDs/cuentas (Binance/Zelle/pago móvil) solo existen hardcodeados en el diálogo legacy → el atleta no sabe a dónde pagar.
9. **BCV frágil**: API no oficial + fallback hardcode 145.50; tasa no se congela en la inscripción.
10. Dorsal duplicable (count+1 sin transacción ni unique); grupo "en transacción" que no lo es (loop de creates).

**PROPUESTA (presentada al usuario, esperando OK antes de implementar):**
- Fase 1 — Rehacer flujo de inscripción sobre el modelo normalizado (Runner + Category FKs, snapshot legacy): 3 pasos (Datos → Categoría/Talla → Pago con datos de destino configurables por evento, monto+tasa guardados, comprobante comprimido client-side ≤3MB, referencia). Estado único PENDING/APPROVED/REJECTED.
- Fase 2 — Panel admin ágil: vista pendientes por defecto, filtros funcionales (evento/categoría/búsqueda incl. dorsal), panel de pago en el detalle (comprobante visible), aprobar (dorsal auto) / rechazar (motivo obligatorio) con confirmación, email automático (Resend), acciones masivas, export solo aprobados.
- Fase 3 — Categorías: única fuente = Category (Prisma); endpoint público lee Category; eliminar EventCategory/openCategories/dead code; inscripciones con categoryId + snapshot texto.
- Fase 4 — Limpieza PII (inscritos/lookup sin datos sensibles), seguridad de cupo con unique constraints.
- Staging: subdominio (CNAME → Vercel proyecto aparte) + BD Turso separada; guía entregada al usuario.

---

## 🔄 HISTORIAL DE COMMITS (git log)

```
260114f fix: validacion en vivo de fecha de nacimiento + persistencia completa de inscripcion en BD
954f638 docs: estado y session-resume actualizados a 1fde98d (fix flujo inscripcion verificado en produccion)
1fde98d fix: flujo de inscripcion funcional - fecha UTC, categorias desde BD y esquema Prisma alineado
1b9a1e4 feat: nueva seccion Monitor Live - resultados en vivo en el sitio del evento (foto real + Ken Burns + badge EN VIVO)
11eeb78 feat(diseno): fotos deportivas reales en Por Que Elegirnos, sin logos (reemplaza isometrico v2)
6a24825 feat(diseno): ilustraciones estilo ChronoTrack v2 en Por Que Elegirnos - chip logo VBR via CSS overlay (anti-crop)
b514f17 feat(diseno): ilustraciones isometricas estilo ChronoTrack con logo VBR en seccion Por Que Elegirnos
b786f0d feat(diseno): seccion Por Que Elegirnos con imagen por tarjeta (6 WebP optimizados alineados a cada texto)
faf9474 feat(diseno): tipografia Figtree estilo Active Network (alternativa libre a GP Commerce) + fix variable next/font en html
0bfe73a feat(diseno): hero multi-disciplina en /eventos (ciclismo, triatlon, calle, trekking) 2560x1440 WebP nitido
98be1de fix(build): eliminar 7 paginas duplicadas que rompian el build de Vercel
1d7816c fix(admin): lista de eventos ya no muestra datos viejos tras borrar/editar (cache events-cache.ts + ?fresh=1)
4f7db6c fix(security): auth estricto incondicional + marcador version 2.1.0 en /api/health
8174298 fix(security): requireAuth estricto por defecto - bloquea PUT/DELETE sin token
7b84ce7 (auto) cambio de permisos de archivos (644->755), sin contenido
06dc196/5491ae8 fix: DELETE y PUT usan string interpolation (libSQL no soporta params)
442804e fix: PUT /api/admin/events/[id] con raw SQL (evita error de Prisma)
9fa807c feat: Integrar nuevos campos en vista publica de detalle de evento
189026d docs: Protocolo de estado y memoria del proyecto
78bc31a fix: Remover campo 'category' del prisma.event.create() que causaba error
6beefc5 feat: Script de migracion para Turso (columnas nuevas del Event)
bf33f93 config: Activar Turso como base de datos de produccion
```

---

## 🚀 SIGUIENTE PASO INMEDIATO

### 0. ~~Verificar en producción la inscripción del evento "LA RUTA DE LA CAMPAÑA ADMIRABLE"~~ ✅ **VERIFICADO (2026-11-25, `260114f`)**: fecha muestra "domingo, 14 de febrero de 2027"; 16 categorías desde BD; auto-asignación Máster C (50-59) para 57 años/M; error en vivo para fechas imposibles; POST real HTTP 201 con `runnerId`+`categoryId`+montos+BCV persistidos; fecha futura rechazada con 400. **Nota:** queda 1 inscripción de prueba (PRUEBA VERIFICACION-VBR, cédula 99000001) borable desde el panel admin

### 0.1 Continuar con el rediseño del flujo de inscripciones/pagos (fases 1-2 y 4 restantes — esperar OK del usuario; Fase 3 ya resuelta en `1fde98d`)

### 1. Re-subir la imagen del evento MISS desde el panel (perdida en el incidente del 2026-11-10)

### 1b. Verificar con el usuario si restaurar CAMPAÑA ADMIRABLE y LA CULATA (borradas durante pruebas del usuario)

### 2. (Opcional) Reconciliar el sistema dual de categorías
1. `Category` (Prisma, usado por el formulario bulk) vs `EventCategory` (raw SQL, usado por `CategoryManager.tsx`)
2. Recomendado: unificar en `Category` Prisma y actualizar `/api/admin/events/[id]/categories/route.ts`

### ✅ Estado cerrado (2026-11-10): deploy y seguridad
- Build de Vercel reparado (`98be1de`): producción en `version: 2.1.0`
- APIs admin exigen auth (401 sin cookie, 200 con cookie), páginas admin con guard server-side
- Evento MISS restaurado completo (id `cmwawt4yw0000jq08jrzyyfwk`)
- Bug de borrado "a la segunda" resuelto (`1d7816c`): PUT/DELETE invalidan el caché y el admin pide `?fresh=1`; probado end-to-end en producción con evento desechable (crear → borrar → lista fresca inmediata sin refrescar)

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
