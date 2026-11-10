# 📋 PROYECTO-ESTADO.md — VzlaBike and Run

> **Archivo de estado técnico del proyecto.**  
> Última actualización: 2026-11-10 (commit `4f7db6c`)  
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
| `PUT`/`DELETE`/`POST` **sin auth** | 🚨 **VULNERABILIDAD ENCONTRADA Y CORREGIDA**: el modo "permissive" permitía editar/borrar eventos sin login (probado: un PUT sin cookie cambió el título). Corregido en commits `8174298` + `4f7db6c` (auth estricto incondicional). **Pendiente de verificar en producción tras el deploy** |
| `GET /api/health` | ✅ 200 — reporta `version: 2.1.0` cuando el deploy nuevo salga (marcador para verificar deploys) |

---

## ⚠️ ERRORES PENDIENTES / ISSUES CONOCIDOS

| # | Issue | Estado | Solución temporal |
|---|-------|--------|-------------------|
| 1 | ~~SponsorsCarousel no integrado en vista pública~~ | ✅ **Resuelto** (commit `9fa807c`) | Integrado en EventDetailPage |
| 2 | ~~prizesImages no se renderizan en vista pública~~ | ✅ **Resuelto** (commit `9fa807c`) | Galería de imágenes integrada |
| 3 | ~~rulesFile sin botón de descarga~~ | ✅ **Resuelto** (commit `9fa807c`) | Botón de descarga agregado |
| 4 | ~~shirtImage y kitInfoDetails no se muestran~~ | ✅ **Resuelto** (commit `9fa807c`) | Sección de franela + kit integrada |
| 5 | El sistema dual de categorías (`Category` Prisma vs `EventCategory` raw SQL) sigue sin reconciliar | **Pendiente** | El formulario usa `Category` Prisma (bulk endpoint). `CategoryManager` usa `EventCategory` raw SQL |
| 6 | `src/app/api/debug/route.ts` puede exponer info sensible | **Baja prioridad** | Solo accesible con auth |
| 7 | **VERCEL NO DESPLIEGA** los commits nuevos (`8174298`, `4f7db6c`): `/api/health` sigue en versión 2.0.0 tras 15+ min del push | 🔴 **BLOQUEANTE** | Revisar dashboard de Vercel (deploy fallido, integración GitHub desconectada o proyecto pausado). Reintentar deploy manual desde Vercel → Deployments → Redeploy |
| 8 | PUT/DELETE admin usan interpolación de strings con escape `''` (commits `5491ae8`/`06dc196` — libSQL no soporta params) | ⚠️ Aceptable | SQLite escapa comillas dobladas y las columnas van con allowlist. Refactorizar a params si el adaptador llega a soportarlos |

---

## 🔄 HISTORIAL DE COMMITS (git log)

```
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

### 1. Desbloquear el deploy de Vercel (URGENTE — commits de seguridad en espera)
1. Entrar a https://vercel.com/venezuelabike-9338s-projects/vzlabike-and-run/deployments
2. Ver si el commit `4f7db6c` aparece y si el build falló (click → Read Build Logs)
3. Si no aparece: Settings → Git → confirmar conexión GitHub y Production Branch = `main`
4. Si falla: copiar el error de los logs y repararlo
5. Verificación: `curl https://vzlabike-and-run.vercel.app/api/health` → debe decir `"version": "2.1.0"`

### 2. Verificar el fix de seguridad en producción
```bash
# Sin cookie debe dar 401:
curl -X PUT https://vzlabike-and-run.vercel.app/api/admin/events/cmwawt4yw0000jq08jrzyyfwk \
  -H "Content-Type: application/json" -d '{"title":"x"}'
# Esperado: {"error":"No autenticado"}
```

### 3. Re-subir la imagen del evento MISS desde el panel (perdida en el incidente)

### 4. (Opcional) Reconciliar el sistema dual de categorías
1. `Category` (Prisma, usado por el formulario bulk) vs `EventCategory` (raw SQL, usado por `CategoryManager.tsx`)
2. Recomendado: unificar en `Category` Prisma y actualizar `/api/admin/events/[id]/categories/route.ts`

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
