# 📋 INVENTARIO DEL PROYECTO - VzlaBike and Run

**Fecha de backup:** 2026-10-29  
**Commit de git:** `77eb667`  
**Total archivos TS/TSX:** 150  
**Total líneas de código:** 31,481  

---

## 🎯 PROYECTO

**VzlaBike and Run®** - Plataforma de organización de eventos deportivos y cronometraje profesional en Venezuela. Soporta carreras, MTB, triatlones y eventos virtuales.

### Stack Tecnológico
- **Frontend:** Next.js 16.1.3 (App Router) + React + TypeScript
- **Backend:** Next.js API Routes + Prisma ORM
- **Base de datos:** SQLite (file:./db/custom.db)
- **UI:** Tailwind CSS 4 + shadcn/ui + Framer Motion
- **Validación:** react-hook-form + Zod
- **Exportación Excel:** exceljs (ChuckScore)
- **Auth:** Cookie-based middleware (password: `vzlabike2024`)

---

## 📁 ESTRUCTURA DE PÁGINAS (src/app)

### Páginas Públicas
| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `src/app/page.tsx` | Landing page con Hero, Features, Events, Services, Platform, Clients, Contact |
| `/eventos` | `src/app/(main)/eventos/page.tsx` | **NUEVA** - Listado público de todos los eventos con filtros y búsqueda |
| `/eventos/[slug]` | `src/app/(main)/eventos/[slug]/page.tsx` | Detalle de evento individual |
| `/eventos/[slug]/inscribirse` | `src/app/(main)/eventos/[slug]/inscribirse/page.tsx` | Página de inscripción |
| `/tienda` | `src/app/tienda/page.tsx` | Tienda de productos |
| `/resultados` | `src/app/resultados/page.tsx` | Página de resultados |

### Panel Admin
| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/admin/login` | `src/app/admin/(auth)/login/page.tsx` | Login del admin |
| `/admin` | `src/app/admin/(protected)/page.tsx` | Dashboard principal |
| `/admin/eventos` | `src/app/admin/(protected)/eventos/page.tsx` | Gestión de eventos |
| `/admin/eventos/nuevo` | `src/app/admin/(protected)/eventos/nuevo/page.tsx` | Crear evento |
| `/admin/eventos/[id]/editar` | `src/app/admin/(protected)/eventos/[id]/editar/page.tsx` | Editar evento |
| `/admin/inscripciones` | `src/app/admin/(protected)/inscripciones/page.tsx` | Gestión de inscripciones |
| `/admin/tienda` | `src/app/admin/(protected)/tienda/page.tsx` | Gestión de tienda |
| `/admin/pedidos` | `src/app/admin/(protected)/pedidos/page.tsx` | Gestión de pedidos |

---

## 🔌 API ROUTES (34 endpoints)

### Admin Auth
- `POST /api/admin/auth` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/check` - Verificar sesión
- `GET /api/admin/verify` - Verificar cookie

### Admin Events
- `GET/POST /api/admin/events` - Listar/crear eventos
- `GET/PUT/DELETE /api/admin/events/[id]` - CRUD evento
- `GET/POST /api/admin/events/[id]/categories` - Categorías
- `POST /api/admin/events/[id]/categories/bulk` - Categorías bulk

### Admin Registrations
- `GET /api/admin/registrations` - Listar inscripciones
- `GET/PUT /api/admin/registrations/[id]` - CRUD inscripción

### Admin Products & Orders
- `GET/POST /api/admin/products` - CRUD productos
- `GET/PUT/DELETE /api/admin/products/[id]` - CRUD producto
- `GET /api/admin/product-orders` - Listar pedidos
- `GET/PUT /api/admin/product-orders/[id]` - CRUD pedido

### Admin Stats & Export
- `GET /api/admin/stats` - Estadísticas del dashboard
- `GET /api/admin/export/chuckscore` - Export Excel ChuckScore

### Public Events
- `GET /api/events` - Listar eventos públicos
- `GET /api/events/[slug]` - Detalle de evento
- `GET /api/events/[slug]/categories` - Categorías del evento
- `POST /api/events/[slug]/register` - Inscripción individual
- `POST /api/events/[slug]/register-group` - Inscripción grupal
- `GET /api/events/[slug]/registrations` - Inscripciones del evento

### Public Products
- `GET /api/products` - Listar productos
- `GET /api/products/[id]` - Detalle de producto
- `POST /api/products/[id]/order` - Crear pedido

### Public Registrations
- `GET /api/registrations` - Listar inscripciones
- `POST /api/register` - Registrar
- `GET /api/registrations/lookup` - Buscar inscripción

### Utilities
- `GET /api/health` - Health check
- `GET /api/eligibility` - Verificar elegibilidad
- `GET /api/runners/search` - Buscar corredores
- `POST /api/setup-db` - Setup DB
- `POST /api/setup-db-migration` - Migración DB

---

## 🧩 COMPONENTES PRINCIPALES (src/components)

### Layout
- `Header.tsx` - Navegación principal con menú responsive
- `Footer.tsx` - Pie de página
- `WhatsAppButton.tsx` - Botón flotante WhatsApp
- `ResultsFloatingButton.tsx` - Botón flotante resultados
- `ResultsBanner.tsx` - Banner de resultados

### Home Sections
- `HeroSection.tsx` - Sección hero
- `FeaturesSection.tsx` - Características
- `EventsSection.tsx`` - Sección de eventos (con botón "Ver Todos" → `/eventos`)
- `ServicesSection.tsx` - Servicios
- `PlatformSection.tsx` - Plataforma
- `ClientsSection.tsx` - Clientes
- `ContactSection.tsx` - Contacto
- `SectionHeading.tsx` - Encabezado de sección

### Event Components
- `EventCard.tsx` - Tarjeta de evento
- `CountdownTimer.tsx` - Cuenta regresiva
- `RegistrationDialog.tsx` - Diálogo de inscripción individual
- `GroupRegistrationDialog.tsx` - Diálogo de inscripción grupal

### Admin Components
- `admin/AdminSidebar.tsx` - Sidebar del admin
- `admin/EventManager.tsx` - Gestor de eventos
- `admin/RegistrationManager.tsx` - Gestor de inscripciones
- `admin/CategoryManager.tsx` - Gestor de categorías
- `admin/ProductManager.tsx` - Gestor de productos
- `admin/OrderManager.tsx` - Gestor de pedidos
- `admin/StatsCards.tsx` - Tarjetas de estadísticas

### UI (shadcn/ui)
- `ui/button.tsx`, `ui/input.tsx`, `ui/dialog.tsx`, `ui/badge.tsx`
- `ui/card.tsx`, `ui/select.tsx`, `ui/label.tsx`, `ui/textarea.tsx`
- `ui/separator.tsx`, `ui/toast.tsx`, `ui/toaster.tsx`

---

## 🗄️ BASE DE DATOS (Prisma Schema)

### Modelos principales:
- **Event** - Eventos deportivos
- **Registration** - Inscripciones (PENDING/APPROVED/REJECTED)
- **Product** - Productos de tienda
- **ProductOrder** - Pedidos de tienda
- **Runner** - Corredores

### Características del sistema:
- **Smart Category Generator:** Intervalos de 5 y 10 años
- **Age Calculation Modes:** calendar_year, event_date
- **Registration States:** PENDING, APPROVED, REJECTED (uppercase)
- **Shirt Options:** INCLUDED, OPTIONAL, NONE
- **Sport Types:** running, mtb, triathlon, virtual

---

## 🔐 CREDENCIALES

- **Admin Password:** `vzlabike2024`
- **DB URL:** `file:./db/custom.db`
- Ver archivo `CREDENCIALES-IMPORTANTES.txt` para más detalles

---

## 📦 RESPALDO

- **Archivo:** `download/backups/vzlabike-backup-20261029-091927.tar.gz`
- **Tamaño:** 4.6 MB
- **Contenido:** src/, prisma/, public/, scripts/, .zscripts/, config files, db/
- **Excluye:** node_modules, .next, skills, upload

---

## ✅ CAMBIOS DE ESTA SESIÓN

1. **NUEVA página `/eventos`** (`src/app/(main)/eventos/page.tsx`)
   - Listado público de todos los eventos
   - Filtros por tipo de deporte
   - Buscador por nombre/lugar/distancia
   - Eventos separados en Próximos y Pasados
   - Tarjetas con countdown, precio y CTA

2. **Header.tsx** - Enlace "Eventos" ahora navega a `/eventos`

3. **EventsSection.tsx** - Botón "Ver Todos los Eventos" ahora usa `<Link>` a `/eventos`

---

## 🚀 CÓMO LEVANTAR EL PROYECTO

```bash
cd /home/z/my-project
bun install
bun run db:push
bun run dev
```

Servidor en `http://localhost:3000`  
Preview URL: `https://preview-<bot-id>.space-z.ai/`

**Admin:** `/admin/login` → password: `vzlabike2024`
