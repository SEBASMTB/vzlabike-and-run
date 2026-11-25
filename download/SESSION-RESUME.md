# 🔄 SESSION-RESUME.md — Prompt para nuevas sesiones

> **Copia y pega este prompt al inicio de una nueva sesión para retomar el trabajo sin perder contexto.**

---

## 📋 PROMPT DE RESUMEN Y ESTADO ACTUAL

```
Estoy trabajando en el proyecto VzlaBike and Run, una plataforma de cronometraje deportivo en Next.js 16 + Prisma + Turso.

== ESTADO DEL PROYECTO ==
- Repo GitHub: https://github.com/SEBASMTB/vzlabike-and-run
- Deploy Vercel: https://vzlabike-and-run.vercel.app
- Admin: https://vzlabike-and-run.vercel.app/admin/login (pass: vzlabike2024)
- Base de datos: Turso (libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io)
- Estado del repo: Limpio, todo commiteado y pusheado

== ARCHIVO DE ESTADO COMPLETO ==
Lee el archivo /home/z/my-project/download/PROYECTO-ESTADO.md para ver:
- Funciones operativas
- Errores pendientes
- Arquitectura de archivos
- Historial de commits
- Siguiente paso inmediato

== LO QUE ESTAMOS HACIENDO AHORA ==
**CUPOS EN VIVO + EXCEL + LISTA PÚBLICA** (commit `0b1b979`, deployado y verificado en producción 2026-11-25):

Pedido del usuario (con captura del evento mostrando "Cupos disponibles: 500 de 500"):
1. "Cuando inscribo en un evento no me hace el descuento de los cupos; he inscrito dos personas y no hace el descuento" → CAUSA: la página de detalle forzaba `registrationCount: 0` y el API no devolvía el conteo. FIX: `/api/events/[slug]` expone `registrationCount` real, `/api/events` suma COUNT por evento, el cliente usa el valor real. **Producción: LA RUTA DE LA CAMPAÑA ADMIRABLE muestra "498 de 500" y "Participantes 2 / 500".**
2. "En el panel administrativo debo tener la opción de descargar en Excel" → NUEVO `GET /api/admin/export/inscripciones` (ExcelJS, 26 columnas: dorsal, cédula, nombre, género, f. nacimiento, categoría, equipo, talla franela, camiseta, email, teléfono, estado, ciudad, emergencia con parentesco, método/referencia, montos USD/Bs, tasa BCV, evento, fecha, estado, waiver). Respeta los filtros activos del panel (evento/estado/categoría/búsqueda); botón "Exportar Excel (.xlsx)" siempre visible. Además: el filtro por categoría AHORA SÍ filtra (la API ignoraba categoryId) y la exportación ChuckScore estaba ROTA (500 por `include: { category: true }` — la relación es `categoryRef`) → reescrita con raw SQL + JOINs, verificada en producción.
3. "Tener la opción de un listado por evento para publicar" → LISTA PÚBLICA `/eventos/[slug]/inscritos` reescrita sobre el nuevo endpoint `GET /api/events/[slug]/participantes` (dorsal, nombre, categoría, equipo, ciudad, estado Confirmado/Pendiente; SIN cédula ni fecha de nacimiento ni contactos; REJECTED ocultas). Hero con 4 stats, buscador, botón imprimir, CTA de inscripción. Enlace "Ver lista de inscritos (N)" en la página del evento y botón "Lista pública" en el panel. **Producción: https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable/inscritos**

Notas técnicas del commit `0b1b979`:
- Se eliminó la duplicidad de rutas: la página vieja `src/app/eventos/[slug]/inscritos/page.tsx` (sin grupo) chocaba con la nueva en `(main)` → se reemplazó el contenido de la original y se borró el duplicado.
- La DB local quedó sincronizada con `prisma db push` (runnerId nullable) — producción no se tocó.
- Las 2 inscripciones reales en producción (bib 2 FUNDACION VENEZUELABIKE y bib 3 NATHALIE MORENO) están ahora APPROVED/Confirmado.

== TAREA ANTERIOR (COMPLETADA) ==
**EXPERIENCIA DE INSCRIPCIÓN 2.0** (commit `ee345c3`, verificado en producción 2026-11-25):

Pedido del usuario (con captura del recibo de NATHALIE MORENO):
1. "En este recibo que salga TODO: categoría, talla de franela, todo" → RECIBO COMPLETO en 4 secciones con dorsal provisional, desglose USD+Bs+tasa BCV y botón Imprimir.
2. "Al colocar la fecha de nacimiento automáticamente se despliegue la categoría según la edad, NO queremos darle a elegir" → PASO 3 SIN SELECTOR: card bloqueada "Asignada automáticamente" recalculada al vuelo (edad+género); aviso claro si no hay categoría compatible.
3. "Si ese corredor vuelve a inscribirse sus datos queden guardados para no llenar un formulario nuevamente" → `GET /api/runners/lookup?cedula=` precarga el perfil (nombres, contacto, ciudad, club, talla, emergencia) al escribir la cédula, con banner "¡Bienvenido(a) de vuelta!".
4. "Darle una opción para modificar los datos por si cambia teléfono, dirección, etc." → los campos precargados quedan SIEMPRE editables; al inscribir, el upsert del Runner actualiza el perfil con lo nuevo (y ahora también guarda talla de franela + contacto de emergencia).

Verificación:
- E2E API local: e2e-registro-categorias 15/15 PASS + e2e-runners-lookup.mjs 9/9 PASS (nuevo).
- Recorrido visual completo local (scripts/browser-e2e.sh): banner → prefill → categoría bloqueada ("Sub-Máster Varones 30-39, Asignada automáticamente") → recibo con 13/13 campos.
- Producción: lookup encuentra a NATHALIE MORENO (9479255, con y sin prefijo V-); wizard real muestra el banner y precarga Mérida/VzlaBike and Run Team; el resumen muestra la categoría auto-asignada.

Reporte anterior: flujo de inscripción roto (fecha off-by-one, categorías 500, sin persistencia) → RESUELTO en `1fde98d`/`260114f`.

Causas raíz encontradas y corregidas:
- **Fecha off-by-one**: se guardaba medianoche UTC y se mostraba con zona local (UTC-4). Ahora: `src/lib/date-utils.ts` formatea SIEMPRE en UTC y date-only se guarda al mediodía UTC (POST/PUT eventos). Barrido UTC en ~12 archivos (EventCard, wizard, OrderSummary, waiver, emails, admin…).
- **Categorías 500**: endpoint público leía `openCategories` (campo INEXISTENTE en el esquema) → PrismaClientValidationError. Reescrito: lee tabla `Category` (modelo Prisma) y si el evento no tiene categorías definidas sirve automáticamente las estándar del deporte (nunca bloquea la inscripción).
- **Registro roto en Prisma**: el modelo `Registration` no tenía el campo `category` (texto) que existe en la BD, y exigía `runnerId`/`categoryId` → todo `registration.create` fallaba. Ahora: campo agregado al esquema, runnerId/categoryId opcionales, `categoryId` se resuelve por nombre al inscribir.
- **Columna `hasShirt` faltante** en DDL/migraciones (P2022 en producción): añadida a db.ts y db-init.ts. Tabla `Runner` añadida al DDL (flujo FASE-2).
- **Wizard**: auto-asigna la categoría según edad+género (badge "Asignada", el atleta puede cambiarla); MTB valida legacy JSON con reglas Élite/100 Kilos/Recreativo, BD/estándar con validación genérica.
- Limpieza: eliminado `CategoryManager.tsx` huérfano (usaba tabla raw inexistente); ruta admin de categorías migrada al modelo `Category`.
- Script E2E reutilizable: `scripts/e2e-registro-categorias.mjs` (16 checks).

**ITERACIÓN 2 (`260114f`, 2026-11-25)** — el usuario mandó captura mostrando "14/02/2027 → Edad calculada: -1 años" (año mal escrito; el date input del navegador convierte "27" en 2027). Corregido:
- **Validación EN VIVO de fecha de nacimiento**: error visible al instante bajo "Edad calculada" ("La fecha no puede ser futura — verifica el año", mín. 5 años, máx. 100), borde rojo, `max=hoy` en el input; mensajes unificados en `validateStep`.
- **Validación server-side espejo**: `POST /api/events/[slug]/register` rechaza fechas futuras/ imposibles con 400 (acepta DD/MM/YYYY o ISO).
- **Persistencia completa en BD**: la Registration guarda estado, ciudad, contacto de emergencia + parentesco, `totalAmount`/`totalAmountBs`/`bcvRate`, comprobante (`paymentProofUrl`) y `registrationType`; **upsert de Runner por cédula** con `runnerId` vinculado + `categoryId` resuelto.
- **FileUpload comprime imágenes** en el navegador (máx 1600px JPEG q0.82, solo >400KB; PDFs topados en 3MB) y guard del endpoint 1.5MB→4MB — evita 413 del límite serverless (~4.5MB).

**VERIFICACIÓN EN PRODUCCIÓN (2026-11-25)**: evento `la-ruta-de-la-campana-admirable` → header "domingo, 14 de febrero de 2027"; 16 categorías desde BD (`source: db`); wizard paso 3 con "Tu edad: 57 años", 8 elegibles y **Máster C Masculino (50-59) auto-asignada**; POST de prueba HTTP 201 con `runnerId`+`categoryId`+montos persistidos; fecha futura → 400. ⚠️ Quedó 1 inscripción de prueba en producción (PRUEBA VERIFICACION-VBR, cédula 99000001, bib 1) — borrarla desde el panel admin.

== SIGUIENTE PASO ==
1. Panel admin ágil (fase 2): vista pendientes por defecto, motivo de rechazo, email al aprobar/rechazar, acciones masivas, export solo aprobados
2. Feedback pendiente de la sección Monitor Live (`1b9a1e4`)
3. (Resuelto en `0b1b979`): cupos en vivo, Excel general con todos los campos, lista pública por evento sin PII, ChuckScore reparado, filtro por categoría del panel
4. (Resuelto en `ee345c3`): recibo completo, categoría automática bloqueada, datos precargados por cédula y edición de perfil
5. (Resuelto en `1fde98d`): unificación de categorías — fuente única modelo Prisma `Category`
6. PII restante: `/api/registrations/lookup` sin auth devuelve email/teléfono/DOB; `GET /api/registrations` vuelca paymentRef

== PROTOCOLO DE TRABAJO ==
1. Cada cambio → commit atómico + git push origin main
2. Vercel sincroniza automáticamente
3. Actualizar download/PROYECTO-ESTADO.md tras cada cambio
4. Nunca dejar cambios sin commitear

Empieza leyendo PROYECTO-ESTADO.md y dime qué encuentras.
```

---

## 📝 CÓMO USAR ESTE ARCHIVO

1. **Al inicio de una nueva sesión:** copia el prompt de arriba y pégalo en el chat
2. **Al final de cada sesión:** actualiza este archivo con:
   - La tarea que estabas haciendo
   - En qué archivo te quedaste
   - Cuál es el siguiente paso

---

## 🔧 COMANDOS ÚTILES PARA EMPEZAR

```bash
# Ver estado del proyecto
cd /home/z/my-project
git status
git log --oneline -5

# Levantar servidor local
bun run dev

# Probar conexión a Turso
node scripts/migrate-turso.js

# Crear evento demo
python3 scripts/fix-demo-event.py

# Hacer commit y push
git add .
git commit -m "feat: Descripción del cambio"
git push origin main
```

---

## 🌐 URLS IMPORTANTES

| Servicio | URL |
|----------|-----|
| Sitio público | https://vzlabike-and-run.vercel.app |
| Admin login | https://vzlabike-and-run.vercel.app/admin/login |
| Eventos públicos | https://vzlabike-and-run.vercel.app/eventos |
| Lista pública de inscritos (ejemplo) | https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable/inscritos |
| GitHub repo | https://github.com/SEBASMTB/vzlabike-and-run |
| Vercel dashboard | https://vercel.com/venezuelabike-9338s-projects/vzlabike-and-run |
| Turso dashboard | https://app.turso.tech/vbrresult |
| API health | https://vzlabike-and-run.vercel.app/api/health |
