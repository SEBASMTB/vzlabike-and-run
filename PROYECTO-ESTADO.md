# 📋 PROYECTO-ESTADO.md — VzlaBike and Run

> **Archivo de estado técnico del proyecto.**  
> Última actualización: 2026-11-27 (RECONSTRUCCIÓN FINAL COMPLETA y **PUSH**: cuentas de atleta + /mi-perfil + gate de inscripción + header con sesión + importador incremental — commits `178db28`, `033f471`, `bbea7c6`, `d66a34b`, `b71a487`, `d5d7e92`, `6061dbe`, docs `PROYECTO-ESTADO.md`/`SESSION-RESUME.md` **incluidos en el repo**)  
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
| **Guía staging** | `STAGING-SETUP.md` (subdominio + Turso separada, $0) |

---

## 🔑 CREDENCIALES Y ACCESO

| Servicio | Dato |
|----------|------|
| **Admin URL** | https://vzlabike-and-run.vercel.app/admin/login |
| **Admin Password** | `vzlabike2024` |
| **GitHub User** | `SEBASMTB` |
| **Vercel Team** | `venezuelabike-9338s-projects` |
| **Turso Org** | `vbrresult` (Free plan) |
| **Turso DB** | `vzlabikeandrun` (prod) |

**Variables de entorno (Vercel + .env local):**
- `DATABASE_URL` = `libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io`
- `TURSO_AUTH_TOKEN` = (en Vercel Environment Variables + .env local, NO en git)
- `AUTH_SECRET` = secreto de las sesiones de atleta (OPCIONAL: si no está cargado, usa `TOKEN_SECRET` y, al final, el fallback de desarrollo — **recomendado cargarlo en Vercel** para sesiones independientes del admin)
- `RESEND_API_KEY` = (pendiente del usuario, ver Notificaciones)

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

### Cuentas de atleta (2026-11-27)
| Página | URL |
|--------|-----|
| **Iniciar Sesión** (correo **o** cédula) | https://vzlabike-and-run.vercel.app/iniciar-sesion |
| **Registrarse** (vincula el historial por cédula al instante) | https://vzlabike-and-run.vercel.app/registrarse |
| **Mi Perfil** (Personal · Médica · Emergencia · Mis Inscripciones) | https://vzlabike-and-run.vercel.app/mi-perfil |

> **Flujo:** el público navega toda la web sin sesión (incluye detalle del evento y lista de inscritos). Al pulsar **"Inscribirme"** sin sesión → `/iniciar-sesion?redirect=/eventos/[slug]/inscribirse` (con enlace a `/registrarse?redirect=…`). Al registrarse con su **cédula**, si está en el histórico (tabla `Runner`) la cuenta queda **vinculada** y su ficha se pre-llena al instante; tras entrar, el navegador **vuelve solo** al wizard interrumpido con los datos desplegados.

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

---

## ✅ FUNCIONES OPERATIVAS (Implementadas y funcionando)

### 👤 CUENTAS DE ATLETA + MI PERFIL (2026-11-27, commits `178db28` + `033f471` + `bbea7c6` + `d66a34b` + `d5d7e92` + `6061dbe` — verificado E2E local con navegador real + curl)
- [x] **Modelo `User`** (email único + `passwordHash` scrypt con sal + `nombre` + `role` + `runnerId` @unique → vínculo 1:1 con `Runner`; la cédula vive SOLO en Runner). DDL `CREATE TABLE IF NOT EXISTS` + índices únicos añadidos a `db.ts` y `db-init.ts` → **Turso crea la tabla sola al primer request** (sin migración manual)
- [x] **`/registrarse`** — cuenta con nombre, apellido, **CÉDULA** (obligatoria), email y contraseña. Al escribir la cédula busca en el histórico (`/api/runners/lookup`, debounce): si existe muestra **"¡Historial encontrado!"** con el nombre de la ficha; al enviar, la cuenta queda **VINCULADA** (`runnerId`) y ya ve su ficha pre-llenada. 409 si el email o la cédula ya tienen cuenta (nunca secuestra un Runner vinculado a otro usuario). Si el Runner no tenía email, se rellena con el de la cuenta
- [x] **`/iniciar-sesion`** — login por **correo O cédula** + contraseña (la cédula resuelve vía Runner vinculado). `?redirect=` validado **anti open-redirect** (solo rutas internas) y devuelto al flujo interrumpido. Si ya hay sesión, la página re-direcciona al destino
- [x] **Acceso obligatorio al inscribirse** — el público ve toda la web sin sesión (detalle, inscritos, resultados); `/eventos/[slug]/inscribirse` (server component con `cookies()`) redirige con **`redirect()` de next/navigation** (el meta-refresh/NextResponse NO funciona en Next 16/Turbopack) a `/iniciar-sesion?redirect=/eventos/[slug]/inscribirse`. Tras entrar o registrarse, vuelve **solo** al wizard
- [x] **Wizard con auto-despliegue** — logueado, los datos del atleta se despliegan solos en el Paso 1 (banner verde con nombre, via prop `sessionRunner` alimentada por `/api/auth/me`); **"Para otra persona"** sigue disponible para inscribir a un tercero y resetea el formulario
- [x] **`/mi-perfil`** — panel del atleta con menú lateral VBR (tarjeta con iniciales + badge **"Cédula verificada · {cédula}"**): **Información Personal** (nombre, apellido, cédula solo-lectura, correo de la cuenta, fecha nacimiento, sexo, teléfono/WhatsApp, estado, ciudad, club, talla), **Información Médica** (grupo sanguíneo + alergias/condiciones) y **Contacto de Emergencia** (nombre, teléfono, parentesco) — cada sección con guardado propio → **Mis Inscripciones** agrupadas en **Pendientes / Aprobadas (dorsal grande + caja de retiro) / Rechazadas (con motivo)**, con enlace al evento y estado vacío amable
- [x] **Sin vínculo → banner "Vincula tu cédula"** en /mi-perfil: PATCH con la cédula busca el Runner histórico y lo vincula (404 si no existe en el histórico, 409 si es de otra cuenta)
- [x] **APIs** (todas con rate-limit y privacidad estricta):
  - `POST /api/auth/registrarse` — crea cuenta + vincula Runner por cédula + **cookie de sesión inmediata**
  - `POST /api/auth/iniciar-sesion` — correo o cédula; mensaje de error genérico
  - `POST /api/auth/cerrar-sesion` — borra la cookie
  - `GET|PATCH /api/auth/me` — ficha propia (runner completo incl. médica) / edición de la ficha propia + vinculación por cédula + nombre visible
  - `GET /api/auth/mis-inscripciones` — historial propio (`runnerId` o cédula en filas legacy `recipientCedula/idNumber`) agrupado por estado; **401 sin sesión**; nunca expone PII de terceros
- [x] **`getDb()` explícito** en registrarse/iniciar-sesion y en `getSessionUser()` — el init/DDL de BD queda garantizado también en desarrollo (el proxy de `db.ts` solo auto-inicia en producción). Patrón comprobado de la reconstrucción anterior
- [x] **Header con sesión** — sin sesión: **Iniciar Sesión** + **Registrarse** (desktop y móvil, con `?redirect=` a la página actual); con sesión: chip con el nombre → **Mi Perfil** + botón **Cerrar sesión**. **EventCard** de la portada ahora dice **"Inscribirme"** (acceso directo al evento)
- [x] **Seguridad** — scrypt con sal aleatoria por usuario + comparación constant-time, cookie `vbr_user_token` httpOnly/SameSite=Lax/secure en producción (30 días), token firmado con `AUTH_SECRET` (fallback `TOKEN_SECRET`, fallback dev); roles separados: el token user (role:"user") jamás valida como admin y viceversa

### 📥 IMPORTACIÓN INCREMENTAL DE CORREDORES (2026-11-27, commit `b71a487` — probado: crear, re-carga idempotente sin duplicar y merge sin borrar sobre SQLite desechable)
- [x] **`scripts/import-runners.ts`** — CSV UTF-8 (con o sin BOM) en **lotes de 500**, **upsert por CÉDULA NORMALIZADA** (`V-12.345.678` → `V12345678`, convención compartida en `src/lib/cedula.ts`): si la cédula ya existe **JAMÁS duplica** el corredor. **MERGE SIN BORRAR**: pre-query de los existentes del lote y campo a campo gana el valor no-vacío del CSV; los vacíos conservan el dato vigente → un lote nuevo con columnas en blanco NUNCA borra información válida
- [x] **Encabezados EXACTOS del CSV (plantilla oficial `plantilla-corredores-vbr.csv`):**
  ```
  CEDULA,NOMBRE,APELLIDO,FECHA_NACIMIENTO,SEXO,EMAIL,TELEFONO,ESTADO,CIUDAD,DIRECCION,CLUB,TALLA,GRUPO_SANGUINEO,ALERGIAS,EMERGENCIA_NOMBRE,EMERGENCIA_TELEFONO,EMERGENCIA_PARENTESCO
  ```
  (obligatorios: `CEDULA`, `NOMBRE`, `APELLIDO` — resto opcional) + alias históricos aceptados: `FECA DE NAC`, `FECHA NAC`, `FECHA DE NACIMIENTO`, `E MAIL`, `TEAM`
- [x] Detecta delimitador `,` o `;` (Excel español), fechas ISO / DD-MM-YYYY / MM-DD-YYYY (ambiguo → latino) y normaliza sexo (M/F/MASC/FEM…), talla (XS–XXXL) y grupo sanguíneo; duplicados DENTRO del mismo CSV se consolidan (gana el último no-vacío); fecha faltante se estima 01/01/1990 con aviso
- [x] `--dry-run` para simular; reporte final: leídos, válidos únicos, omitidos (fila y motivo), creados, actualizados, errores, total en BD y tiempo
- [x] **Uso:** `npx tsx scripts/import-runners.ts corredores_vbr.csv [--dry-run]` — en producción exportar `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (o `DATABASE_URL=libsql://…`). Compatible con los 4.000 corredores iniciales y los lotes futuros
- [x] Eliminado `prisma/import-runners.ts` (legacy): su rama UPDATE sobrescribía los campos con los valores del CSV **incluso vacíos** → riesgo de borrado de datos históricos

### 🏠 Páginas públicas
- [x] `/` — Landing page (Hero, Features, Events, Services, Contact)
  - [x] Tipografía **Figtree** global (estilo Active Network) — commit `faf9474`
  - [x] Sección **¿Por Qué Elegirnos?** como **ficha técnica de cronometraje** negro/rojo — commit `f6dad5d`: fondo `#0B0B0F` con retícula blueprint, cabecera mono con punto pulsante, 6 tarjetas oscuras con iconos técnicos y pies de spec monospace. **Diferenciación visual deliberada** vs Próximos Eventos (claro, foto, contadores)
  - [x] **Commit `847abda`**: countdown dinámico al próximo evento real de BD, copy del monitor live (QR + LED + certificado), aliados gestionables con `src/config/partners.ts`
- [x] `/eventos` — Listado público con filtros y buscador + hero multi-disciplina (`0bfe73a`)
- [x] `/eventos/[slug]` — Detalle de evento
  - [x] **Cupos disponibles en vivo** — `registrationCount` real con barra (`0b1b979`)
  - [x] Enlace "Ver lista de inscritos (N)" (`0b1b979`)
  - [x] **Consulta "¿Ya te inscribiste?"** — cédula → estado + **dorsal + caja de retiro** (`71b6595`, `BibLookupWidget` + `GET /api/events/[slug]/mi-inscripcion`, rate-limited, sin PII)
- [x] `/eventos/[slug]/inscritos` — Lista pública por evento (stats, buscador, imprimir, sin PII; con **columna Caja** para aprobados)
- [x] **Sección Monitor Live** (`/#monitor-live`) — foto real del monitor, bisel, badge EN VIVO, 4 beneficios y CTAs — `1b9a1e4`
- [x] `/eventos/[slug]/inscribirse` — **Wizard de 3 pasos estilo Hipereventos** (`0f7fcdc`) + **gate de sesión** (2026-11-27)
  - **Paso 1 Datos del Corredor:** tipo (para mí/otro), autocompletado por cédula desde `Runner` (`/api/runners/lookup`) **y ahora prellenado instantáneo con la sesión** (banner con nombre), identidad, contacto, estado/ciudad y contacto de emergencia
  - **Paso 2 Categoría y Talla:** club/team, **categoría asignada automáticamente y bloqueada** por fecha de nacimiento + género, talla de franela
  - **Paso 3 Pago:** **monto y tasa BCV congelados**, **cuentas de destino configurables por evento** (Pago Móvil/Transferencia/Zelle/Binance/Divisas, solo en este paso), referencia única por evento, comprobante comprimido (≤3MB) y waiver
  - Recibo final imprimible; el dorsal se muestra como "se asigna al aprobar"
- [x] `/tienda` — Tienda de productos · `/resultados` — Redirige a resultados externos

### 🔐 Panel Admin (`/admin/*`)
- [x] Login con contraseña + middleware de auth + guard server-side
- [x] **Gestión de eventos** (CRUD completo): banners, kit, premios, reglas, patrocinadores; **tamaño de caja física** (bloques 100/150), **editor de cuentas de pago** (`Event.paymentAccounts`), **categorías con lotes de dorsales** (`Category.bibStart/bibEnd` + auto-cálculo correlativo Élite primero + validación de solapamientos) — `1d796da`
- [x] **Gestión de inscripciones REDISEÑADA** (`1a6313b`): pendientes por defecto, acciones masivas, rechazo con motivo obligatorio (correo automático), aprobación con dorsal+caja al instante, bandeja **"Pagos sin Ficha"** con conciliación y aprobación 1-clic, **"Inscripción rápida en sitio / WhatsApp"** (⚡ APPROVED con dorsal+caja), vista detalle completa
- [x] **Exportación Excel general** (28 columnas incl. Caja y Motivo de rechazo) y **ChuckScore** (solo APROBADOS, por dorsal, con Kit Box)

### ⚙️ Motor de dorsales (`d739ff1`, corregido `75eb592`)
- [x] **ORDEN CANÓNICO**: números más bajos → **Élite**, luego **Juvenil**, resto de menor a mayor edad; un corredor SOLO recibe números de SU lote — jamás el #1 de otra categoría
- [x] **Margen de reserva +10 por categoría** (`RESERVA_PRESENCIAL=10` en `src/lib/bib-lots.ts`)
- [x] **Lote explícito** (`Category.bibStart/bibEnd`) estricto; **sin lote → lote IMPLÍCITO** con el mismo orden; lote lleno → error claro, nunca invade
- [x] **Asignación atómica** (`src/lib/bib-assignment.ts`) con reintentos ante concurrencia
- [x] **Bulk de categorías = UPSERT** que preserva IDs → `Registration.categoryId` no se rompe
- [x] **APLICADO EN PRODUCCIÓN**: CAMPAÑA ADMIRABLE con 16 lotes; 3 inscripciones re-asignadas (616/493/575)
- [x] **PENDING/REJECTED nunca queman dorsales** + índice único parcial `(eventId, bibNumber)` + referencia de pago única por evento + estados únicos PENDING/APPROVED/REJECTED + modelo `PaymentRecord`
- [x] Test unitario 21/21 (`scripts/test-bib-lots.ts`)

### 🔔 Notificaciones al corredor (`b0aeace` + `f9bb411` + `8ad440b`)
- [x] **Correo al APROBAR** (dorsal destacado + caja + categoría + datos del evento) y **al RECHAZAR** (motivo + pasos para corregir) — jamás bloquean la operación; `emailSent/emailSentTo/emailError` en la respuesta admin
- [x] **Botón WhatsApp en /admin** (`src/lib/notify.ts`): por fila APPROVED, en detalle y en inscripción rápida — `wa.me` con mensaje armado (normaliza teléfonos VE)
- [x] **Consulta pública sin PII** (`GET /api/events/[slug]/mi-inscripcion`): solo nombre/categoría/estado/dorsal/caja/talla (+ motivo SOLO si REJECTED); rate-limited
- [x] **⚠️ CONFIGURACIÓN PENDIENTE DEL USUARIO (5 min)**: cargar `RESEND_API_KEY` (y opcional `FROM_EMAIL` con dominio verificado) en Vercel → Environment Variables. Sin la key TODO funciona; solo se saltan los correos (`emailSkipped`)

### 🧹 Limpieza y seguridad (`71b6595`)
- [x] Eliminado código muerto con fuga PII (`/api/registrations/lookup`, dialogs legacy, `/api/register*`, `/api/eligibility`)
- [x] `GET /api/registrations` exige auth; serialización BigInt segura en `/api/events` (`467052e`)

### 🗄️ Base de datos
- [x] Turso configurado; migración automática al primer request (`src/lib/db.ts`: CREATE TABLE IF NOT EXISTS + ALTER TABLE + índices, cada statement con catch propio)
- [x] **Tabla `User` nueva (2026-11-27)** con vínculo 1:1 a Runner — se crea sola en Turso al primer request tras el deploy
- [x] 9 eventos existentes + persistencia garantizada

---

## 📁 ARQUITECTURA DE ARCHIVOS CLAVE

```
/home/z/my-project/vzlabike-and-run/
├── PROYECTO-ESTADO.md             # ← ESTE ARCHIVO (también en el repo)
├── SESSION-RESUME.md              # Prompt de reanudación (también en el repo)
├── prisma/schema.prisma           # Runner + User(nuevo) + Event + Category(+bibStart/End) + Registration(+rejectReason/bibBoxLabel) + PaymentRecord + Product
├── scripts/import-runners.ts      # ⭐ Importación incremental CSV por cédula (lotes 500, upsert merge sin borrar)
├── src/lib/db.ts                  # Prisma factory (Turso→file→/tmp) + DDL + EXPECTED_COLUMNS + índices únicos (+ tabla User)
├── src/lib/db-init.ts             # Init explícito alternativo (mismo DDL con User)
├── src/lib/user-auth.ts           # ⭐ Sesiones de atleta (scrypt, token AUTH_SECRET, cookie vbr_user_token, guards)
├── src/lib/cedula.ts              # ⭐ normalizeCedula compartida (importación/registro/cuentas)
├── src/lib/bib-assignment.ts      # ⭐ Asignación atómica de dorsales
├── src/lib/bib-lots.ts            # ⭐ Orden canónico + RESERVA_PRESENCIAL=10
├── src/lib/payment-accounts.ts    # ⭐ Cuentas de pago + normalizePaymentRef + bibBoxLabel
├── src/lib/email.ts               # ⭐ Correos Resend (pre-registro/aprobación/rechazo)
├── src/lib/notify.ts              # ⭐ WhatsApp aprobación (wa.me)
├── src/middleware.ts              # Auth middleware /admin/*
├── src/app/
│   ├── page.tsx                   # Landing (+ EventsSection con CTA Inscribirme)
│   ├── iniciar-sesion/            # ⭐ Login por correo o cédula + ?redirect= anti open-redirect
│   ├── registrarse/               # ⭐ Cuenta por cédula + vista previa "¡Historial encontrado!"
│   ├── mi-perfil/                 # ⭐ Menú lateral: Personal/Médica/Emergencia/Mis Inscripciones
│   ├── (main)/eventos/[slug]/
│   │   ├── EventDetailPage.tsx    # Detalle + BibLookupWidget
│   │   ├── inscribirse/page.tsx   # ⭐ GATE server: exige sesión con redirect() + ?redirect=
│   │   ├── inscribirse/InscribirseClient.tsx  # ⭐ Carga /api/auth/me y pasa sessionRunner al wizard
│   │   └── inscritos/             # Lista pública (+ Caja)
│   ├── admin/(protected)/…        # Panel admin completo
│   └── api/
│       ├── auth/                  # ⭐ registrarse · iniciar-sesion (correo o cédula) · cerrar-sesion · me(GET/PATCH) · mis-inscripciones
│       ├── events/[slug]/…        # register · mi-inscripcion · participantes · categories
│       ├── runners/lookup         # Autocompletado por cédula (usado por registro y wizard)
│       └── admin/…                # registrations (PATCH/bulk/quick) · payments · export
├── src/components/
│   ├── Header.tsx                 # ⭐ Botones de sesión (desktop+móvil) con estado real
│   ├── EventCard.tsx              # ⭐ CTA "Inscribirme"
│   └── registration/RegistrationWizard.tsx  # ⭐ prop sessionRunner (prellenado con sesión)
└── download/
    ├── plantilla-corredores-vbr.csv   # Plantilla oficial 17 columnas del importador
    └── STAGING-SETUP.md               # Guía staging
```

---

## 📊 ESTADO DE LA BASE DE DATOS (Turso)

- **Tablas:** Event (40 cols), Registration (35 cols), Runner, **User (nuevo 2026-11-27: email/passwordHash/nombre/role/runnerId únicos)**, Category (8 cols), PaymentRecord (14 cols), Product, ProductOrder
- **Eventos:** 9 totales (8 seed/demo + MISS restaurado)
- **Inscripciones reales:** 3 (FELIPI MORENO bib 616, NATHALIE MORENO bib 493, FUNDACION VENEZUELABIKE bib 575 — APPROVED, evento LA RUTA DE LA CAMPAÑA ADMIRABLE; verificado 2026-11-25)
- **⚠️ Pendiente usuario:** re-subir la imagen del evento MISS desde el panel (perdida en el incidente 2026-11-10)

---

## 🧪 RESULTADOS DE PRUEBAS (2026-11-27 — reconstrucción final, navegador real + curl sobre build de producción local)

| Prueba | Resultado |
|--------|-----------|
| Build de producción completo sin errores de TS | ✅ |
| `/registrarse`, `/iniciar-sesion`, `/mi-perfil`, `/eventos` → 200 | ✅ |
| Header sin sesión: botones Iniciar Sesión + Registrarse (desktop y móvil) | ✅ |
| Gate: `/eventos/{slug}/inscribirse` sin sesión → navegador aterriza en `/iniciar-sesion?redirect=%2Feventos%2F…` | ✅ |
| Registro con cédula histórica `V-12.345.678` → banner "¡Historial encontrado! JUAN PÉREZ" | ✅ |
| Registro enviado → auto-login → /mi-perfil con ficha pre-llenada (JUAN PÉREZ) + badge "Cédula verificada · V12345678" | ✅ |
| Mis Inscripciones: estado vacío amable ("Todavía no te has inscrito…") | ✅ |
| Cerrar sesión → home; header vuelve a Iniciar Sesión/Registrarse | ✅ |
| Login por CÉDULA `V-12.345.678` → ok (resuelve vía Runner vinculado) | ✅ |
| Login por EMAIL → ok; contraseña mala → error genérico | ✅ |
| Tras login con redirect pendiente → vuelve SOLO a la inscripción del evento | ✅ |
| Wizard pre-llenado con sesión: nombres, email histórico y emergencia de la ficha | ✅ |
| "Para otra persona" disponible (inscribir a un tercero) | ✅ |
| Importador: 1ª carga crea; 2ª carga idéntica NO duplica (2 creados → 0 creados/2 actualizados) | ✅ |
| Importador merge sin borrar: CSV parcial con teléfono nuevo actualiza teléfono y CONSERVA alergias "Penicilina" y club vacíos en CSV | ✅ |
| Importador --dry-run: preview sin escribir BD | ✅ |
| Privacidad: `/api/auth/me` sin sesión → 401; cookie httpOnly; roles user/admin no intercambiables | ✅ |

### Producción (E2E históricos, datos de prueba eliminados al final)
| Prueba | Resultado |
|--------|-----------|
| Wizard: registro → PENDING sin dorsal; ref duplicada → 400 | ✅ |
| Aprobar → dorsal + Caja; rechazo con motivo → libera dorsal + correo | ✅ |
| mi-inscripcion público: aprobado ve dorsal+caja; rechazado ve motivo; sin PII | ✅ |
| ChuckScore/Excel 200; /api/registrations sin auth → 401 | ✅ |
| Conciliación por referencia (66-0123 ↔ 660123) | ✅ |

---

## ⚠️ ERRORES PENDIENTES / ISSUES CONOCIDOS

| # | Issue | Estado | Nota |
|---|-------|--------|------|
| 1-18 | (históricos 1–18) | ✅ Resueltos | Detalle en SESSION-RESUME.md |
| 19 | `src/app/api/debug/route.ts` puede exponer info | **Baja prioridad** | Solo accesible con auth |
| 20 | PUT/DELETE admin usan interpolación de strings con escape `''` | ⚠️ Aceptable | Refactorizar si el adaptador soporta params |
| 23 | Correo al aprobar/rechazar | ✅ Resuelto (`b0aeace`+`f9bb411`) | Falta SOLO acción del usuario: cargar `RESEND_API_KEY` en Vercel |
| 24 | **PUSH de la reconstrucción** (2 sesiones perdidas por reciclado del sandbox sin credenciales) | ✅ **RESUELTO 2026-11-27** | El usuario proveyó un token de push; commits `178db28…6061dbe` + docs puestos en `main`. Tras el deploy, Turso crea la tabla `User` al primer request |
| 25 | **Lotería de eventos en portada** — reporte del usuario "Próximos Eventos sin eventos" | ✅ Resuelto | El evento activo se creó el 25-nov (después del reporte); `/api/events` devuelve 1 evento y la portada lo renderiza (verificado con navegador). La sección muestra cards con CTA Inscribirme |
| 26 | `AUTH_SECRET` en Vercel | ⚠️ Recomendado (no bloqueante) | Sin él las sesiones de atleta comparten secreto con el admin (roles separados, seguro); cargar `AUTH_SECRET` aísla los sistemas |

---

## 🔄 HISTORIAL DE COMMITS (git log)

```
6061dbe fix(auth): getDb() explicito en registro y login (init/DDL garantizado tambien en dev) y en getSessionUser
docs    PROYECTO-ESTADO.md + SESSION-RESUME.md incluidos en el repo (persistencia de contexto)
b71a487 feat(import): importador incremental scripts/import-runners.ts - upsert por cedula normalizada en lotes de 500 con merge sin borrar datos validos
d5d7e92 refactor(auth): login tambien por cedula, AUTH_SECRET dedicado con fallbacks, lib/cedula.ts, guard anti open-redirect, importador acepta delimitador ; (elimina prisma/import-runners.ts legacy)
d66a34b feat(header): botones Iniciar Sesion/Registrarse en cabecera y menu movil, chip Mi Perfil + Cerrar sesion, CTA Inscribirme en tarjetas
bbea7c6 feat(inscripcion): acceso obligatorio al inscribirse - gate server con redirect al login y wizard prellenado con la ficha del Runner vinculado
033f471 feat(usuarios): paginas /iniciar-sesion, /registrarse y /mi-perfil (redirect ?redirect=, vista previa de historial, panel con pestañas)
178db28 feat(auth): cuentas de comunidad - modelo User vinculado a Runner por cedula (scrypt + cookie 30d) y APIs registrarse/iniciar-sesion/cerrar-sesion/me/mis-inscripciones
847abda feat(home): conteo +500 eventos, countdown dinamico al proximo evento real, monitor live QR+LED+certificado y aliados gestionables
9060377 36bf27aa-… (accidental: solo db/custom.db)
b2555c8 docs: estado y session-resume actualizados a f6dad5d
f6dad5d feat(diseno): 'Por que elegirnos' como ficha tecnica de cronometraje (negro/rojo)
3026a0d docs: estado y session-resume a 8ad440b (correo de rechazo verificado)
8ad440b fix(email): reportar el error real de Resend (SDK v6 devuelve error)
f9bb411 feat(rechazo): correo automatico al rechazar (motivo + pasos)
3cbb3b0 docs: estado y session-resume a b0aeace
b0aeace feat(notificaciones): correo al aprobar + WhatsApp en panel + PII verificado
3410b9e docs · 75eb592 fix(dorsales) orden canonico · 040a3ea docs regla de oro URLs · cb25c17 fix(admin) filtro pagos
```

---

## 📥 IMPORTACIÓN — CÓMO CARGAR LOS 4.000 CORREDORES Y LOTES FUTUROS

1. Descargar la plantilla: `download/plantilla-corredores-vbr.csv` (17 columnas, ejemplo incluido)
2. Llenarla con los datos del Excel histórico (UTF-8; obligatorios: `CEDULA`, `NOMBRE`, `APELLIDO`)
3. Local: `npx tsx scripts/import-runners.ts corredores_vbr.csv --dry-run` (revisar reporte) y sin `--dry-run` para importar
4. En producción (Turso): `TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npx tsx scripts/import-runners.ts corredores_vbr.csv`
5. Lotes futuros: repetir con el mismo CSV o nuevos; **nunca duplica** y **nunca borra** datos válidos
