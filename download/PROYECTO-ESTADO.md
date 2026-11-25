# 📋 PROYECTO-ESTADO.md — VzlaBike and Run

> **Archivo de estado técnico del proyecto.**  
> Última actualización: 2026-11-25 (commit `d8ce9e9`)  
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
| **Guía staging** | `download/STAGING-SETUP.md` (subdominio + Turso separada, $0) |

---

## 🔑 CREDENCIALES Y ACCESO

| Servicio | Dato |
|----------|------|
| **Admin URL** | https://vzlabike-and-run.vercel.app/admin/login |
| **Admin Password** | `vzlabike2024` |
| **GitHub User** | `SEBASMTB` |
| **Vercel Team** | `venezuelabike-9338s-projects` |
| **Turso Org** | `vbrresult` (Free plan) |
| **Turso DB** | `vzlabikeandrun` (prod) · `vzlabikeandrun-staging` (crear, ver guía) |

**Variables de entorno (Vercel + .env local):**
- `DATABASE_URL` = `libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io`
- `TURSO_AUTH_TOKEN` = (en Vercel Environment Variables + .env local, NO en git)

---

## 🌐 DIRECCIONES DE ACCESO (REGLA: SIEMPRE darlas al usuario)

> ⭐ **REGLA DE ORO impuesta por el usuario (2026-11-25):** *"RECUERDA SIEMPRE DARME LAS DIRECCIONES PARA ENTRAR"*.
> Al final de CADA cambio funcional, CADA sesión y CADA entregable, listar SIEMPRE las URLs
> actualizadas de todo lo que se creó o modificó + las de acceso general. Nunca terminar una
> respuesta sin direcciones de entrada.

### Generales
| Página | URL |
|--------|-----|
| **Inicio** | https://vzlabike-and-run.vercel.app/ |
| **Eventos (lista pública)** | https://vzlabike-and-run.vercel.app/eventos |
| **Tienda** | https://vzlabike-and-run.vercel.app/tienda |
| **Resultados** | https://vzlabike-and-run.vercel.app/resultados |
| **Monitor Live** | https://vzlabike-and-run.vercel.app/#monitor-live |

### Panel Admin (contraseña: `vzlabike2024`)
| Página | URL |
|--------|-----|
| **Login Admin** | https://vzlabike-and-run.vercel.app/admin/login |
| **Dashboard** | https://vzlabike-and-run.vercel.app/admin |
| **Gestión de Eventos** (lotes de dorsales, cajas, cuentas de pago) | https://vzlabike-and-run.vercel.app/admin/eventos |
| **Inscripciones** (aprobar/rechazar, dorsales, ⚡ inscripción rápida, "Pagos sin Ficha", Excel/ChuckScore) | https://vzlabike-and-run.vercel.app/admin/inscripciones |
| **Admin Tienda** | https://vzlabike-and-run.vercel.app/admin/tienda |
| **Pedidos** | https://vzlabike-and-run.vercel.app/admin/pedidos |
| **Salir** | https://vzlabike-and-run.vercel.app/admin/logout |

### Por evento (patrón + eventos activos)
- Detalle: `/eventos/{slug}` · **Inscribirse (wizard 3 pasos):** `/eventos/{slug}/inscribirse` · **Lista inscritos:** `/eventos/{slug}/inscritos`
- Ejemplo completo (LA RUTA DE LA CAMPAÑA ADMIRABLE):
  - https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable
  - https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable/inscribirse
  - https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable/inscritos

**Slugs activos (8):** `farmaluna-10k-2024` · `womens-run-2024` · `la-ruta-digital-2024` · `maraton-caracas-2024` · `triatlon-vzla-2024` · `21k-la-autopista` · `la-ruta-de-la-campana-admirable` · `miss`

### Consulta del corredor (dorsal + caja)
- El widget **"¿Ya te inscribiste?"** está en la página de detalle de cada evento (consulta por cédula, muestra estado + dorsal + caja de retiro).

---

## ✅ FUNCIONES OPERATIVAS (Implementadas y funcionando)

### 🏠 Páginas públicas
- [x] `/` — Landing page (Hero, Features, Events, Services, Contact)
  - [x] Tipografía **Figtree** global (estilo Active Network) — commit `faf9474`
  - [x] Sección **¿Por Qué Elegirnos?** con **fotografías deportivas reales** — commit `11eeb78`
- [x] `/eventos` — Listado público con filtros y buscador + hero multi-disciplina (`0bfe73a`)
- [x] `/eventos/[slug]` — Detalle de evento
  - [x] **Cupos disponibles en vivo** — `registrationCount` real con barra (`0b1b979`)
  - [x] Enlace "Ver lista de inscritos (N)" (`0b1b979`)
  - [x] **Consulta "¿Ya te inscribiste?"** — el corredor pone su cédula y ve estado + **dorsal + caja de retiro** (`71b6595`, widget `BibLookupWidget` + `GET /api/events/[slug]/mi-inscripcion`, rate-limited, sin PII sensible)
- [x] `/eventos/[slug]/inscritos` — Lista pública por evento (stats, buscador, imprimir, sin PII; ahora con **columna Caja** para aprobados) — `0b1b979` + `71b6595`
- [x] **Sección Monitor Live** (`/#monitor-live`) — foto real del monitor (Santa Ana Corre 10K), bisel, Ken Burns ligero (prefers-reduced-motion), badge EN VIVO, 4 beneficios y CTAs — commit `1b9a1e4`
- [x] `/eventos/[slug]/inscribirse` — **Wizard de 3 pasos estilo Hipereventos** (`0f7fcdc`)
  - **Paso 1 Datos del Corredor:** tipo (para mí/otro), autocompletado por cédula desde tabla `Runner` (`/api/runners/lookup`, debounce 600ms, banner "Bienvenido de vuelta", campos siempre editables), identidad, contacto, estado/ciudad y contacto de emergencia
  - **Paso 2 Categoría y Talla:** club/team, **categoría asignada automáticamente y bloqueada** por fecha de nacimiento + género (card "Asignada automáticamente"), talla de franela
  - **Paso 3 Pago:** **monto y tasa BCV congelados** (bloqueados al entrar), **cuentas de destino de pago configurables por evento** (Pago Móvil/Transferencia/Zelle/Binance/Divisas, solo visibles en este paso), método (incluye **Binance USDT**), **referencia única por evento**, comprobante comprimido en cliente (≤3MB) y waiver
  - Recibo final completo (evento/participante/inscripción/pago) con impresión; el dorsal se muestra como "se asigna al aprobar"
- [x] `/tienda` — Tienda de productos
- [x] `/resultados` — Redirige a resultados externos

### 🔐 Panel Admin (`/admin/*`)
- [x] Login con contraseña + middleware de auth + guard server-side
- [x] **Gestión de eventos** (CRUD completo)
  - [x] Formulario reestructurado (banners, kit, premios, reglas, patrocinadores)
  - [x] **Sección "Datos de Pago y Cajas de Entrega"** (`1d796da`):
    - **Tamaño de caja física** del evento (bloques de 100 → 1–99/100–199… o 150 → 1–149/150–299…)
    - **Editor de cuentas de pago** (`PaymentAccountsEditor`): método + etiqueta + campos por método (banco/teléfono/cédula/cuenta/correo/wallet/notas), se guardan en `Event.paymentAccounts` y el wizard los muestra SOLO en el Paso 3
  - [x] **Sección 4 Categorías con lotes de dorsales** (`1d796da`):
    - Columnas **"Dorsal desde" / "Dorsal hasta"** editables por categoría (`Category.bibStart/bibEnd`)
    - Botón **"Auto-calcular lotes correlativos"**: reparte el cupo del evento en bloques consecutivos, **Élite primero y Juvenil después** (los números más bajos), resto por edad
    - **Validación de solapamientos** (no guarda si hay rangos cruzados o inválidos)
- [x] **Gestión de inscripciones REDISEÑADA** (`1a6313b`):
  - **Pendientes por defecto** al entrar (bandeja de trabajo)
  - **Acciones masivas**: checkboxes → Aprobar (asigna dorsales correlativos por lote) / Rechazar con motivo / Deseleccionar
  - **Rechazo con motivo obligatorio** (dialog; guarda `Registration.rejectReason` y **libera el dorsal**)
  - **Aprobar asigna dorsal + caja** al instante (toast con el dorsal asignado)
  - **Bandeja "Pagos sin Ficha"** (tab con contador): registrar en segundos transferencia/pago móvil del banco (evento, método, referencia, monto+moneda, titular, teléfono, banco, notas) — **no consumen dorsales**; filtros Sin conciliar/Conciliados/Ignorados/Todos; **aprobación de 1 clic** del conciliado (asigna dorsal+caja); marcar Ignorado/eliminar
  - **"Inscripción rápida en sitio / WhatsApp"** (botón ⚡): dialog mínimo (evento, nombre, cédula, categoría…) → nace APPROVED con **dorsal + caja al instante**; concilia por referencia si coincide
  - Vista detalle con **dorsal + caja**, motivo de rechazo, comprobante visible y montos
- [x] **Exportación Excel general** — 28 columnas ahora (agrega **Caja de Retiro** y **Motivo de Rechazo**), respeta filtros — `0b1b979` + `1a6313b`
- [x] **Exportación ChuckScore** — **solo APROBADOS**, ordenada por dorsal, con columna **Kit Box** (caja física) — `1a6313b`
- [x] Botón "Lista pública" + filtro por categoría funcional — `0b1b979`

### ⚙️ Motor de dorsales (nuevo — `d739ff1`)
- [x] **Asignación atómica al aprobar** (`src/lib/bib-assignment.ts`): primer número LIBRE dentro del lote `bibStart–bibEnd` de la categoría; si no hay lote (o está lleno) → primer libre global (1..max); reintentos ante conflicto de concurrencia
- [x] **PENDING/REJECTED nunca queman dorsales** (bibNumber queda NULL; rechazar/devolver a pendiente libera el número)
- [x] **Índice único parcial** `(eventId, bibNumber)` en BD — última barrera anti-duplicados
- [x] **Cajas físicas**: `bibBoxLabel` se calcula al aprobar según `Event.bibBoxSize` (convención del organizador: 100 → 1–99, 100–199…; 150 → 1–149, 150–299…)
- [x] **Referencia de pago única por evento** (índice único parcial `(eventId, paymentRef)` + validación normalizada en el registro: `66-0123` colisiona con `660123`)
- [x] **Estados únicos PENDING / APPROVED / REJECTED** (normalización automática de legacy `pending/confirmed/rejected` en el arranque de BD)
- [x] **Modelo `PaymentRecord`** (Pagos sin Ficha) con estados UNMATCHED/MATCHED/IGNORED y `matchedRegistrationId`

### 🧹 Limpieza y seguridad (`71b6595`)
- [x] Eliminado **código muerto con fuga PII**: `GET /api/registrations/lookup` (devolvía email/teléfono/DOB por cédula sin auth), `RegistrationDialog`, `GroupRegistrationDialog` (llamaban al endpoint roto `/api/register`), `/api/register`, `/api/register-group`, `/api/eligibility`
- [x] `GET /api/registrations` ahora **exige auth** (antes volcaba todo público) — verificado 401 en producción
- [x] **Serialización BigInt segura** en `/api/events` (COUNT del adaptador libSQL) — `467052e`

### 🗄️ Base de datos
- [x] Turso configurado; migración automática al primer request (`src/lib/db.ts`: CREATE TABLE IF NOT EXISTS + ALTER TABLE + índices, **cada statement con catch propio** para que un índice con datos sucios no tumbe el init)
- [x] **Esquema nuevo (`a2baa26`)**: `Category.bibStart/bibEnd`, `Event.paymentAccounts/bibBoxSize`, `Registration.rejectReason/bibBoxLabel`, tabla `PaymentRecord`
- [x] 9 eventos existentes + persistencia garantizada

### 🎨 Componentes UI
- [x] Tipografía Figtree, hero multi-disciplina, 6 fotografías deportivas, `MonitorLiveSection`, `FileUpload` (compresión client-side), `SponsorsCarousel`, `MultiImageUpload`, `SponsorsLogosEditor`
- [x] **Nuevos**: `PaymentAccountsEditor` (cuentas de pago del evento, `EventFormPage`), `BibLookupWidget` (consulta pública dorsal+caja), tab "Pagos sin Ficha", dialog "Inscripción rápida", dialog "Rechazo con motivo", barra de acciones masivas

---

## 📁 ARQUITECTURA DE ARCHIVOS CLAVE

```
/home/z/my-project/
├── prisma/schema.prisma           # Runner + Event + Category(+bibStart/End) + Registration(+rejectReason/bibBoxLabel) + PaymentRecord + Product
├── src/lib/db.ts                  # Prisma factory (Turso→file→/tmp) + DDL + EXPECTED_COLUMNS + índices únicos + normalización estados
├── src/lib/bib-assignment.ts      # ⭐ Asignación atómica de dorsales (lote por categoría, reintentos)
├── src/lib/payment-accounts.ts    # ⭐ Cuentas de pago (tipos, parse, labels) + normalizePaymentRef + bibBoxLabel
├── src/lib/categories.ts          # Generadores de categorías + presets
├── src/middleware.ts              # Auth middleware /admin/*
├── src/app/
│   ├── page.tsx                   # Landing (+ MonitorLiveSection)
│   ├── (main)/eventos/[slug]/
│   │   ├── EventDetailPage.tsx    # Detalle + consulta dorsal/caja (BibLookupWidget)
│   │   ├── inscribirse/           # Wizard 3 pasos (InscribirseClient → RegistrationWizard)
│   │   └── inscritos/             # Lista pública (+ columna Caja)
│   ├── admin/(protected)/
│   │   ├── inscripciones/page.tsx # ⭐ Rediseñado: pendientes por defecto, masivos, Pagos sin Ficha, inscripción rápida
│   │   └── eventos/nuevo/EventFormPage.tsx  # + lotes de dorsales + cajas + cuentas de pago
│   └── api/
│       ├── events/[slug]/
│       │   ├── register/route.ts          # PENDING sin dorsal + ref única + conciliación automática
│       │   ├── mi-inscripcion/route.ts    # ⭐ Consulta pública segura (dorsal+caja)
│       │   ├── participantes/route.ts     # Lista pública (+caja)
│       │   └── categories/route.ts        # Fuente única Category + fallback deporte
│       ├── admin/
│       │   ├── registrations/[id]/route.ts   # PATCH: aprobar→dorsal, rechazar→motivo+libera
│       │   ├── registrations/bulk/route.ts   # ⭐ Aprobar/rechazar/eliminar masivo
│       │   ├── registrations/quick/route.ts  # ⭐ Inscripción rápida en sitio (APPROVED+caja)
│       │   ├── payments/route.ts             # ⭐ Bandeja Pagos sin Ficha (GET/POST)
│       │   ├── payments/[id]/route.ts        # ⭐ PATCH/DELETE pago
│       │   └── export/{inscripciones,chuckscore}/route.ts
│       └── events/route.ts        # Lista + crear (stringifySafe BigInt)
├── src/components/
│   ├── registration/RegistrationWizard.tsx  # ⭐ 3 pasos (1050→1980 líneas)
│   ├── BibLookupWidget.tsx        # ⭐ Consulta dorsal+caja pública
│   └── ui/file-upload.tsx, SponsorsCarousel.tsx, Header/Footer, MonitorLiveSection.tsx
└── download/
    ├── PROYECTO-ESTADO.md         # ← ESTE ARCHIVO
    ├── SESSION-RESUME.md          # Resumen técnico para reanudar sesión
    └── STAGING-SETUP.md           # ⭐ Guía subdominio de pruebas + Turso separada
```

---

## 📊 ESTADO DE LA BASE DE DATOS (Turso)

- **Tablas:** Event (40 cols), Registration (35 cols), Runner, Category (8 cols), PaymentRecord (14 cols), Product, ProductOrder
- **Eventos:** 9 totales (8 seed/demo + MISS restaurado)
- **Inscripciones reales:** 2 (NATHALIE MORENO bib 3 y FUNDACION VENEZUELABIKE bib 2, ambos APPROVED, evento LA RUTA DE LA CAMPAÑA ADMIRABLE)
- **⚠️ Pendiente usuario:** re-subir la imagen del evento MISS desde el panel (perdida en el incidente 2026-11-10)

---

## 🧪 RESULTADOS DE PRUEBAS (2026-11-25)

### Local (E2E HTTP, servidor de build)
| Prueba | Resultado |
|--------|-----------|
| Wizard: registro → PENDING sin dorsal | ✅ |
| Referencia duplicada normalizada → 400 | ✅ |
| Admin auth + listado | ✅ |
| Aprobar → dorsal 1 + Caja 1–99 | ✅ |
| Rechazo sin motivo → 400 / con motivo → libera dorsal | ✅ |
| Inscripción rápida → APPROVED con dorsal+caja | ✅ |
| Conciliación por referencia (66-0123 ↔ 660123) | ✅ |
| mi-inscripcion: aprobado ve dorsal+caja; rechazado sin dorsal | ✅ |
| ChuckScore solo aprobados + Kit Box | ✅ |
| /api/registrations sin auth → 401 | ✅ |
| Índice único (evento,dorsal) bloquea duplicados (test unitario) | ✅ |

### Producción (E2E real, datos de prueba eliminados al final)
| Prueba | Resultado |
|--------|-----------|
| Pago sin ficha creado | ✅ |
| Registro PENDING sin dorsal | ✅ |
| Aprobación 1-clic → dorsal 1 + Caja 1–99 | ✅ |
| mi-inscripcion público → APPROVED + dorsal + caja | ✅ |
| ChuckScore: Kit Box + Eduardo + NATHALIE (solo aprobados) | ✅ |
| Excel general HTTP 200 | ✅ |
| Cleanup: registro y pago de prueba eliminados, count=2 | ✅ |
| Endpoints PII cerrados (401/404) | ✅ |
| Wizard / inscritos HTTP 200 | ✅ |

---

## ⚠️ ERRORES PENDIENTES / ISSUES CONOCIDOS

| # | Issue | Estado | Nota |
|---|-------|--------|------|
| 1-18 | (todos los históricos 1–18) | ✅ Resueltos | Ver historial de commits; el detalle de cada fix está en SESSION-RESUME.md |
| 19 | `src/app/api/debug/route.ts` puede exponer info | **Baja prioridad** | Solo accesible con auth |
| 20 | PUT/DELETE admin usan interpolación de strings con escape `''` (libSQL no soporta params) | ⚠️ Aceptable | Refactorizar a params si el adaptador los soporta |
| 21 | **Descuento de cupos** reportado por el usuario (2 inscritos no descontaban cupos) | ✅ **Resuelto en `0b1b979`** | Era el conteo congelado de cupos; verificado en producción: "498 de 500" con 2 inscritos |
| 22 | Lag de réplica Turso: un check de conciliación E2E falló por lectura momentáneamente desactualizada | ⚠️ Informativo | El matching funciona (verificado en BD); no requiere acción |
| 23 | Correo al aprobar/rechazar inscripciones | 🔜 Futuro | Fase 2 restante (Resend ya está en el stack para el email de preregistro) |

---

## 🔄 HISTORIAL DE COMMITS (git log)

```
cb25c17 fix(admin): filtro status=todos en bandeja de pagos sin ficha
467052e fix(api): serializacion BigInt segura en listado de eventos (COUNT del adaptador libSQL)
71b6595 feat(publico): consulta de dorsal y caja para el corredor, caja en la lista publica y limpieza de codigo muerto con fuga PII
1a6313b feat(admin): bandeja pagos sin ficha con conciliacion, pendientes por defecto, rechazo con motivo obligatorio, acciones masivas, inscripcion rapida en sitio y ChuckScore solo aprobados con caja fisica
d739ff1 feat(dorsales): asignacion atomica al aprobar dentro del lote por categoria, cajas fisicas 100/150, rechazo con motivo obligatorio que libera dorsal, acciones masivas, inscripcion rapida en sitio y bandeja de pagos sin ficha con conciliacion automatica
1d796da feat(eventos): lotes de dorsales por categoria con auto-calculo correlativo, validacion de solapamientos, cuentas de pago por evento y tamano de caja de entrega
0f7fcdc feat(inscripcion): wizard en 3 pasos estilo Hipereventos - datos del corredor con autocompletado, categoria automatica y pago con cuentas del evento, monto y tasa BCV congelados y referencia unica por evento
a2baa26 feat(esquema): lotes de dorsales por categoria, cajas fisicas, cuentas de pago por evento, tabla PaymentRecord y estados unicos PENDING/APPROVED/REJECTED
9850bd4 docs: estado y session-resume actualizados a 0b1b979
0b1b979 feat(cupos,excel,lista): conteo real de inscritos en vivo, exportacion Excel completa y lista publica por evento
ee345c3 feat(inscripcion): categoria automatica bloqueada, datos del corredor precargados por cedula y recibo completo con impresion
a2ddab3 chore: script de verificacion visual del wizard en produccion
257e4da fix(admin): listado inscripciones devuelve objetos category/event/runner + busqueda por dorsal
1b48d5a feat(admin): eliminar inscripciones - endpoint DELETE con auth + boton con confirmacion en el panel
260114f fix: validacion en vivo de fecha de nacimiento + persistencia completa de inscripcion en BD
954f638 docs: estado y session-resume actualizados a 1fde98d
1fde98d fix: flujo de inscripcion funcional - fecha UTC, categorias desde BD y esquema Prisma alineado
1b9a1e4 feat: nueva seccion Monitor Live - resultados en vivo en el sitio del evento
11eeb78 feat(diseno): fotos deportivas reales en Por Que Elegirnos, sin logos
faf9474 feat(diseno): tipografia Figtree estilo Active Network
0bfe73a feat(diseno): hero multi-disciplina en /eventos
98be1de fix(build): eliminar 7 paginas duplicadas que rompian el build de Vercel
1d7816c fix(admin): lista de eventos ya no muestra datos viejos tras borrar/editar
4f7db6c fix(security): auth estricto incondicional + marcador version 2.1.0
8174298 fix(security): requireAuth estricto por defecto
```

---

## 🚀 SIGUIENTE PASO INMEDIATO

### 0. ~~Rediseño completo 3-pasos + dorsales + conciliación + Monitor Live + PII~~ ✅ **HECHO Y VERIFICADO EN PRODUCCIÓN (2026-11-25, commits `a2baa26`→`cb25c17`)**

### 1. Crear el entorno de staging (opcional pero recomendado antes del siguiente evento real)
- Seguir `download/STAGING-SETUP.md` (Turso separada + subdominio + proyecto Vercel, $0/mes)

### 2. Configurar en el panel el evento real próximo (10 min)
- Editar el evento → sección **"Datos de Pago y Cajas de Entrega"**:
  1. Cargar las **cuentas reales** (Pago Móvil, Zelle, Binance…) — el wizard las mostrará en el Paso 3
  2. Elegir **tamaño de caja** (100 o 150)
- Sección 4 → definir **lotes de dorsales por categoría** (o botón "Auto-calcular lotes correlativos")

### 3. Re-subir la imagen del evento MISS desde el panel (pendiente desde el incidente 2026-11-10)

### 4. Verificar con el usuario si restaurar CAMPAÑA ADMIRABLE y LA CULATA (borradas durante pruebas del usuario)

### 5. Fase 2 restante (opcional): email automático al aprobar/rechar con Resend

---

## 📐 PROTOCOLO DE TRABAJO (a aplicar en cada sesión)

1. **Cada cambio funcional → commit atómico + push inmediato**
   ```bash
   git add .
   git commit -m "feat/fix: Descripción específica"
   git pull --rebase origin main && git push origin main
   ```

2. **Vercel sincroniza automáticamente** tras cada push (2-3 min de build)

3. **Verificación en producción** tras cada deploy: `curl /api/health` + flujo afectado

4. **Actualizar este archivo** (`PROYECTO-ESTADO.md`) tras cada cambio funcional:
   - Mover items de "Pendiente" a "Operativo"
   - Actualizar historial de commits
   - Actualizar "Siguiente paso inmediato"

5. **Al final de cada sesión**, actualizar `SESSION-RESUME.md` con el resumen técnico exacto

6. **Nunca dejar cambios sin commitear** — si el chat se cierra, los cambios se pierden

7. **SIEMPRE terminar la respuesta con las DIRECCIONES DE ACCESO** (URLs) de lo creado/modificado + URLs generales — regla impuesta por el usuario. Igual en commits, deploys y resúmenes.
