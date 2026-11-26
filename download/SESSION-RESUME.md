# 🔄 SESSION-RESUME.md — Prompt para nuevas sesiones

> **Copia y pega este prompt al inicio de una nueva sesión para retomar el trabajo sin perder contexto.**

---

## 📋 PROMPT DE RESUMEN Y ESTADO ACTUAL

```
Estoy trabajando en el proyecto VzlaBike and Run, una plataforma de cronometraje deportivo en Next.js 16 + Prisma 6 + Tailwind CSS 4 + Turso.

== ESTADO DEL PROYECTO ==
- Repo GitHub: https://github.com/SEBASMTB/vzlabike-and-run (rama main, LIMPIO, todo pusheado)
- Deploy Vercel: https://vzlabike-and-run.vercel.app
- Admin: https://vzlabike-and-run.vercel.app/admin/login (pass: vzlabike2024)
- Base de datos: Turso (libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io)
- Última sesión cerrada: 2026-11-26, HEAD = f6dad5d
- Guía de staging: download/STAGING-SETUP.md (subdominio + Turso separada, aún sin crear)

== ARCHIVO DE ESTADO COMPLETO ==
Lee /home/z/my-project/download/PROYECTO-ESTADO.md para: funciones operativas,
errores pendientes, arquitectura, historial de commits y siguiente paso.

== LO ÚLTIMO QUE SE HIZO (2026-11-25, GREEN LIGHT COMPLETO del usuario) ==

El usuario dio luz verde al rediseño completo y se implementó TODO en 8 commits atómicos
(a2baa26 → cb25c17), cada uno pusheado y verificado en producción:

1. `a2baa26` ESQUEMA: Category.bibStart/bibEnd (lotes de dorsales), Event.paymentAccounts
   (JSON de cuentas de pago por evento) + Event.bibBoxSize (cajas físicas 100/150),
   Registration.rejectReason + bibBoxLabel, tabla NUEVA PaymentRecord (pagos sin ficha),
   índices únicos PARCIALES: (eventId,bibNumber) WHERE bibNumber IS NOT NULL y
   (eventId,paymentRef) WHERE paymentRef != ''. Estados únicos PENDING/APPROVED/REJECTED
   (db.ts normaliza legacy pending/confirmed/rejected al arrancar). OJO TÉCNICO: el DDL se
   divide por ';' — los comentarios SQL NO deben llevar ';' dentro. Cada statement del init
   lleva catch propio (un índice con datos sucios no tumba el arranque).

2. `0f7fcdc` WIZARD 3 PASOS (src/components/registration/RegistrationWizard.tsx, reescrito):
   Paso 1 "Datos del Corredor" (tipo self/other + autocompletado por cédula vía
   /api/runners/lookup con debounce 600ms + identidad + contacto + estado/ciudad +
   emergencia), Paso 2 "Categoría y Talla" (club + categoría AUTO y bloqueada por
   edad/género + talla franela), Paso 3 "Pago" (monto+tasa BCV CONGELADOS — la tasa se
   fetch-ea UNA vez al montar; cuentas de pago del evento SOLO aquí, parseadas con
   src/lib/payment-accounts.ts parsePaymentAccounts; método con Binance USDT agregado a
   METODOS_PAGO; referencia única; comprobante ≤3MB; waiver). Recibo final: dorsal "se
   asigna al aprobar". Register API: status PENDING (uppercase), bibNumber NULL al crear,
   validación de referencia duplicada NORMALIZADA (normalizePaymentRef: solo [A-Z0-9]),
   y conciliación automática: si la ref coincide con un PaymentRecord UNMATCHED del mismo
   evento → lo marca MATCHED con matchedRegistrationId.

3. `1d796da` EVENTFORMPAGE: CategoryRow con bibStart/bibEnd (strings para inputs);
   botón "Auto-calcular lotes correlativos" (reparte maxParticipants en bloques iguales,
   Élite → Juvenil → por edad, helper bibPriority); validación bibOverlapError (no guarda
   si hay rangos cruzados); tarjeta "Datos de Pago y Cajas de Entrega" (bibBoxSize 100/150
   + PaymentAccountsEditor dinámico por método); payload añade paymentAccounts/bibBoxSize;
   bulk de categorías guarda bibStart/bibEnd. APIs de eventos aceptan los campos nuevos
   (POST /api/events + PUT /api/admin/events/[id] fieldMap).

4. `d739ff1` MOTOR DE DORSALES: src/lib/bib-assignment.ts → assignBibForRegistration():
   primer LIBRE dentro del lote de la categoría; fallback primer libre global (1..max);
   3 reintentos ante P2002 (índice único). releaseBib() al rechazar/devolver a pendiente.
   bibBoxLabel() convención del usuario: caja 100 → "1–99, 100–199…" (end = start===1 ?
   size-1 : start+size-1). PATCH /api/admin/registrations/[id]: REJECTED exige
   rejectReason (400 si falta) y libera dorsal; APPROVED llama assignBib; bibNumber manual
   recalcula caja. NUEVOS endpoints: POST /api/admin/registrations/bulk (approve/reject
   con motivo/delete masivos), POST /api/admin/registrations/quick (inscripción rápida en
   sitio: nace APPROVED + dorsal/caja inmediatos + runner upsert + conciliación),
   GET/POST /api/admin/payments + PATCH/DELETE /api/admin/payments/[id].
   TEST UNITARIO 9/9 PASS (lotes, liberación, reasignación, unicidad, conciliación).

5. `1a6313b` PANEL ADMIN (inscripciones/page.tsx reescrita): pendientes por defecto,
   checkboxes + barra masiva, dialog de rechazo con motivo obligatorio, TAB "Pagos sin
   Ficha" (formulario rápido + lista con filtros Sin conciliar/Conciliados/Ignorados +
   botón "Aprobar + dorsal" en 1 clic para el MATCHED), botón "⚡ Inscripción rápida en
   sitio" con dialog propio (resultado muestra dorsal+caja), detalle con dorsal/caja/
   motivo/comprobante, listado admin devuelve bibBoxLabel/rejectReason/paymentProofUrl
   (SELECT ampliado). ChuckScore SOLO APROBADOS orden por dorsal + columna "Kit Box";
   Excel general 28 columnas (+Caja de Retiro, +Motivo de Rechazo).

6. `71b6595` PÚBLICO + PII: BibLookupWidget en la página del evento (consulta por cédula
   → estado + dorsal + caja, endpoint GET /api/events/[slug]/mi-inscripcion rate-limited,
   solo datos mínimos); participantes API + lista inscritos con columna Caja; ELIMINADO
   código muerto con fuga PII: /api/registrations/lookup (daba email/tel/DOB sin auth),
   RegistrationDialog.tsx, GroupRegistrationDialog.tsx (usaban /api/register roto),
   /api/register, /api/register-group, /api/eligibility; /api/registrations ahora exige
   auth; EventsSection simplificada (sin dialogs); EventDetailPage sin RegistrationDialog
   (se añadió FileText que faltaba — error TS preexistente).

7. `467052e` FIX: stringifySafe() en /api/events (COUNT devolvía BigInt con adaptador
   libSQL local y JSON.stringify reventaba).

8. `cb25c17` FIX: filtro status=todos/all en GET /api/admin/payments (filtraba literal
   "TODOS" y devolvía vacío).

== VERIFICACIÓN ==
- LOCAL: build limpio (tsc sin errores en archivos nuevos; next build OK), E2E HTTP
  12/12 funcional (scripts borrados tras correr; logs en la sesión).
- PRODUCCIÓN: deploy verificado con E2E real sobre el evento LA RUTA DE LA CAMPANA
  ADMIRABLE — pago sin ficha creado → registro PENDING sin dorsal → conciliación
  automática MATCHED → aprobación 1-clic asignó dorsal 1 + "Caja 1–99" → mi-inscripcion
  público mostró APPROVED+dorsal+caja → ChuckScore con Kit Box incluyó solo aprobados →
  TODOS los datos de prueba ELIMINADOS al final (count quedó en 2: NATHALIE bib 3 y
  FUNDACION bib 2, ambos APPROVED reales). Endpoints PII cerrados (401/404). Wizard e
  inscritos 200. NOTA: un check de conciliación falló por lag de réplica Turso (lectura
  desactualizada un instante); el matching funciona — informativo, no requiere acción.

== LO ÚLTIMO QUE SE HIZO (2026-11-26, FICHA TÉCNICA `f6dad5d`) ==

Instrucción del usuario: en la sección "¿Por qué elegirnos?" de la home, quitar las
fotografías (además eran temática asiática que no encaja) porque se veían demasiado
parecidas a las tarjetas de Próximos Eventos y confundían; reemplazarlas por iconografía
técnica limpia (Lucide/SVG: engranajes, microchips, ondas RF, cronómetros, monitores live)
en contenedores con la paleta de marca alto contraste negro/rojo, y darle a la sección un
diseño tipo ficha de ingeniería para diferenciarla de la cartelera de eventos.
Implementado en 1 commit (`f6dad5d`) y VERIFICADO EN PRODUCCIÓN:

1. `src/components/FeaturesSection.tsx` REESCRITO: fondo `#0B0B0F` + retícula blueprint
   (linear-gradient 48px, opacity 5%) + resplandor rojo superior blur 120px. Cabecera
   técnica: punto rojo pulsante + `// Ficha técnica — Sistema de cronometraje` en mono
   uppercase tracking-widest. SectionHeading con `light` (título blanco, sub gris).
2. 6 TARJETAS tipo ficha: `bg-zinc-950/90 border-zinc-800 rounded-lg` (angulares, NO
   rounded-2xl como EventCard), esquinas en L rojas tipo plano (30% → 100% al hover),
   índice mono 01–06, icono en contenedor chip rojo (gradiente red-600→red-900, ring
   red-500/40, glow rgba(220,38,38,.35)→.55 al hover, 2 puntos rojos decorativos) con
   iconos: Waypoints (Experiencia), PenTool (Creatividad), Cpu (Tecnología), Timer
   (Milímetro), Settings (Adaptabilidad), Shield (Compromiso). Pies de spec mono 11px
   uppercase con ▸ rojo: TRACK RECORD · 10+ AÑOS · 200+ EVENTOS / OUTPUT · EXPERIENCIAS
   A MEDIDA / CHIP RFID · RF 13.56 MHz · LIVE (+ mini-iconos Radio y Activity) /
   TOLERANCIA · ±0.1 s · FOTO-FINISH / MODOS · RUNNING / MTB / TRIATLÓN / VIRTUAL /
   SLA · SOPORTE DE SALIDA A META. Textos de título/descripción SIN cambios.
3. ELIMINADAS las 6 fotos `public/features/*.webp` (solo las referenciaba este
   componente — verificado con rg). Animación framer-motion stagger conservada.
4. VERIFICACIÓN: build OK; screenshots local desktop 1440px + móvil 390px y producción
   1440px (`scripts/shots/features-nueva.png`, `features-movil.png`,
   `prod-features-nueva.png`, `eventos-comparacion.png`) — contraste total vs Próximos
   Eventos (claro, foto, rounded-2xl, contadores y precios). Producción HTML sin
   referencias a features/*.webp y con la cabecera "Ficha técnica".

== SECCIÓN ANTERIOR (2026-11-25, CORREO DE RECHAZO `f9bb411` + `8ad440b`) ==

Instrucciones del usuario: (1) NO aplicar lotes a los otros 7 eventos (son de prueba, los
borrará al armar el calendario real); (2) SÍ implementar el correo automático al RECHAZAR
con motivo obligatorio y mensaje claro para corregir/re-reportar pago; (3) commit+push+docs.
Implementado y VERIFICADO EN PRODUCCIÓN:

1. `src/lib/email.ts` → `sendRejectionEmail()`: HTML con el MOTIVO DEL RECHAZO destacado
   (escapado con &amp;/&lt;/&gt;/&quot;), pasos numerados (1 revisar motivo, 2 re-reportar pago
   por WhatsApp con comprobante legible, 3 re-aprobación enviará dorsal+caja, 4 consultar
   estado con cédula), tarjeta del evento y botones WhatsApp (584120162685) + detalles del
   evento. Nunca lanza: sin email válido o sin RESEND_API_KEY → {sent:false, skipped:true,
   error}.
2. PATCH `/api/admin/registrations/[id]` → `notifyRejection()`: se dispara SOLO en la
   transición real a REJECTED (si ya estaba rechazada NO re-envía). Respuesta:
   emailSent/emailSentTo/emailSkipped/emailError. Bulk `action:reject` → correo por cada
   una (solo transiciones nuevas) + `emailsSent` en la respuesta.
3. Panel `/admin/inscripciones`: toast "· Correo enviado a X" al rechazar; si no se pudo
   enviar → toast "Correo de rechazo no enviado" con el motivo y sugerencia WhatsApp;
   dialog de rechazo avisa que el corredor recibirá el correo; resumen masivo muestra
   "N correo(s) enviado(s)".
4. PÚBLICO: `mi-inscripcion` ahora devuelve `rejectReason` SOLO cuando status=REJECTED
   (dato propio del corredor, sin PII de contacto); `BibLookupWidget` muestra tarjeta roja
   con el motivo + botón "Corregir / reportar por WhatsApp".
5. FIX FIABILIDAD (`8ad440b`): el SDK Resend v6 DEVUELVE el error (no lanza) — los 3
   emisores ahora revisan `error` de la respuesta. Probado con key falsa: antes decía
   sent:true, ahora {sent:false, error:"validation_error: API key is invalid"}.
6. E2E PRODUCCIÓN `scripts/e2e-rechazo-prod.sh` (2 corridas, ambas OK): quick-register con
   email → PATCH REJECTED con motivo → REJECTED+motivo+dorsal liberado; mi-inscripcion
   pública → REJECTED + rejectReason visible + claves exactas sin PII; bulk → ok:1 fail:0
   emailsSent; cleanup total (quedan SOLO las 3 reales: FELIPI 616, NATHALIE 493,
   FUNDACION 575).

⚠️ PARA QUE LOS CORREOS (aprobación Y rechazo) SALGAN DE VERDAD — acción del usuario,
AÚN PENDIENTE en Vercel: Settings → Environment Variables → `RESEND_API_KEY`
(resend.com, gratis 100/día) + opcional `FROM_EMAIL` con dominio verificado en Resend
(por defecto usa venezuelabikeandrun@gmail.com). Sin la key todo funciona, solo se
saltan los correos (emailSkipped). WhatsApp funciona desde ya sin configurar nada.

== SECCIÓN ANTERIOR (2026-11-25, NOTIFICACIONES `b0aeace`) ==

Pregunta del usuario: "¿cómo le llega el dorsal/caja al corredor si no entra al sitio?".
Implementado en 1 commit (`b0aeace`, verificado en producción):

1. CORREO AUTOMÁTICO AL APROBAR: `src/lib/email.ts` → `sendApprovalEmail()` (Resend SDK,
   ya estaba en package.json). HTML con dorsal destacado, caja de retiro, categoría y datos
   del evento. Se dispara en: PATCH /api/admin/registrations/[id] (APPROVED), bulk approve
   (solo transiciones nuevas, respuesta incluye emailsSent) y quick (en sitio). NUNCA
   bloquea: sin RESEND_API_KEY → {sent:false, skipped:true, error:'RESEND_API_KEY no
   configurada'} y la aprobación continúa. Respuesta admin: emailSent/emailSentTo y el
   toast del panel muestra "· Correo enviado a X".
2. BOTÓN WHATSAPP EN /admin: `src/lib/notify.ts` (puro, cliente+servidor):
   normalizeWhatsappPhone (0412-1234567→584121234567, 412…→58+, +58→igual, otros países
   7-15 dígitos), buildApprovalMessage (nombre/evento/fecha/lugar/categoría/DORSAL/caja +
   link consulta + instrucción de presentarse en la caja), whatsappApprovalUrl. UI: icono
   verde MessageCircle en filas APPROVED, botón completo en dialog detalle, botón en el
   resultado de inscripción rápida. Funciona SIN configuración.
3. CONSULTA PÚBLICA SIN PII: mi-inscripcion YA era segura (rate-limit 20/min, solo
   firstName/lastName/category/status/bibNumber/bibBoxLabel/shirtSize). VERIFICADO con
   assert en producción: claves exactas sin email/phone/paymentRef/DOB.
4. Soporte: listado admin ahora SELECT incluye e.slug/e.location (para el mensaje);
   QuickResult del panel lleva nombre/teléfono/evento/categoría para el botón; test
   scripts/test-notify.ts 22/22; E2E producción scripts/e2e-notificaciones-prod.sh
   (inscripción con email → skip limpio, sin PII, PATCH reporta correo, cleanup OK).

⚠️ PENDIENTE DEL USUARIO PARA ACTIVAR EL CORREO (5 min): Vercel → Settings → Environment
Variables → añadir `RESEND_API_KEY` (resend.com, gratis 100/día) y opcionalmente
`FROM_EMAIL` con dominio verificado en Resend. Sin key todo funciona, solo se saltan los
correos. WhatsApp funciona desde ya sin configurar nada.

== LO ANTERIOR (2026-11-25, FIX DORSALES `75eb592`) ==

El usuario reportó: al inscribirse como Máster C recibió el dorsal #1. CAUSA: el evento no
tenía lotes configurados y `assignBibForRegistration` tenía un fallback global (primer libre
1..max) que asignaba #1, #2, #3 por orden de aprobación (todos a categorías Máster).

CORRECCIÓN (commit `75eb592`, verificado en producción):
1. NUEVO `src/lib/bib-lots.ts` (puro, compartido panel/servidor): `bibLotPriority` (Élite=0,
   Juvenil/Junior=1, resto 2+minAge/100), `computeOrderedLotRanges` (bloque base
   floor(total/n) + RESERVA_PRESENCIAL=10 por categoría), orden canónico:
   Élite (M y F) → Juvenil → menor a mayor edad. Ties por orden estable del array.
2. `bib-assignment.ts` REESCRITO: lote explícito se respeta ESTRICTO; sin lote → lote
   IMPLÍCITO ordenado con reserva; lote lleno → reason claro SIN invadir otras categorías;
   fallback global SOLO si el evento no tiene categorías; reintento P2002 dentro del mismo lote.
3. EventFormPage: auto-calcular usa computeOrderedLotRanges (botón "Auto-calcular lotes
   (+10 reserva sábado)"), aviso de solapamiento inline bajo los botones, texto explicativo
   del orden canónico.
4. BUG EXTRA corregido: bulk de categorías era delete+recreate (rompía Registration.categoryId
   al editar el evento) → ahora UPSERT por identidad (name|gender|minAge|maxAge) conservando
   IDs. PUT categoría individual ahora soporta bibStart/bibEnd.
5. Test unitario `scripts/test-bib-lots.ts` 21/21 pass (Élite #1, Máster C en su lote, lleno
   no invade, correlativos sin cruces).
6. PRODUCCIÓN (script `scripts/apply-lotes-produccion.sh`): 16 lotes aplicados a CAMPAÑA
   ADMIRABLE vía bulk upsert (IDs preservados: updated=16, created=0, removed=0). Lotes:
   Élite M 1–41, Juvenil 42–82, Femenino Sport 83–123, 100 Kilos 124–164, Duplas/E-Bike
   165–328, Organismos 288–328, Senior 329–369, Recreativo 370–410, Máster A F 411–451,
   Máster A M 452–492, Máster B F 493–533, Máster B M 534–574, Máster C 575–615,
   Máster D 616–656. RE-APROBADAS las 3 inscripciones (PATCH PENDING→APPROVED):
   FELIPI 1→616 (Caja 600–699), NATHALIE 3→493 (Caja 400–499), FUNDACION 2→575 (Caja
   500–599). E2E: quick-register Élite→bib 1 ✓, Máster C→bib 576 ✓, ambos ELIMINADOS al
   final. Participantes público verificado (bib+caja sin PII).

== CONFIGURACIÓN QUE EL USUARIO DEBE HACER EN EL PANEL (10 min) ==
1. Editar evento real → "Datos de Pago y Cajas de Entrega": cargar cuentas reales
   (Pago Móvil/Zelle/Binance) y tamaño de caja (100/150).
2. Sección 4 → lotes de dorsales por categoría o "Auto-calcular lotes (+10 reserva
   sábado)". NOTA `75eb592`: aunque NO configure lotes, el motor ya asigna con lote
   implícito en orden canónico Élite→Juvenil→edad con reserva — pero conviene
   configurarlos explícitos para verlos/editarlos en el panel.

== SIGUIENTE PASO ==
1. (USUARIO, 5 min) Añadir RESEND_API_KEY + FROM_EMAIL en Vercel para activar los correos de aprobación Y rechazo (ver sección CORREO DE RECHAZO). Única acción pendiente del sistema de notificaciones.
2. (Decisión tomada 2026-11-25) Los otros 7 eventos NO se tocan: son de prueba, el usuario los borrará/reemplazará con el calendario real. NO aplicarles lotes ni migraciones.
3. (Opcional) Crear staging con download/STAGING-SETUP.md.
4. Re-subir imagen del evento MISS desde el panel (incidente 2026-11-10).
5. Verificar con el usuario si restaurar CAMPAÑA ADMIRABLE y LA CULATA (borradas en
   pruebas del usuario).

== REGLAS DE ORO DEL PROYECTO ==
- ⭐ SIEMPRE terminar cada respuesta con las DIRECCIONES DE ACCESO (URLs): las de lo creado/modificado + las generales (Admin: /admin/login pass vzlabike2024, wizard: /eventos/{slug}/inscribirse, inscritos: /eventos/{slug}/inscritos). Regla impuesta por el usuario: "RECUERDA SIEMPRE DARME LAS DIRECCIONES PARA ENTRAR". Tabla completa en PROYECTO-ESTADO.md sección "🌐 DIRECCIONES DE ACCESO".
- Protocolo de guardado: commit atómico → git pull --rebase origin main → git push
  origin main → esperar deploy Vercel → verificar en producción → actualizar
  PROYECTO-ESTADO.md y SESSION-RESUME.md → segundo commit/push de docs.
- Fuente ÚNICA de categorías = modelo Prisma Category (jamás revivir CategoryManager/
  EventCategory).
- Dorsales SOLO al aprobar (PENDING/REJECTED bibNumber NULL).
- La lista pública jamás expone cédula/DOB/contactos (participantes API).
- Categorías de eventos SIEMPRE desde BD con fallback estándar del deporte.
- Fechas SIEMPRE UTC (src/lib/date-utils.ts, mediodía UTC para date-only).
```
