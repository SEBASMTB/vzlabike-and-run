# 🔄 SESSION-RESUME.md — Prompt para nuevas sesiones

> **Copia y pega este prompt al inicio de una nueva sesión para retomar el trabajo sin perder contexto.**

---

## 📋 PROMPT DE RESUMEN Y ESTADO ACTUAL

```
Estoy trabajando en el proyecto VzlaBike and Run, una plataforma de cronometraje deportivo
en Next.js 16 + Prisma 6 + Tailwind CSS 4 + Turso.

== ESTADO DEL PROYECTO ==
- Repo GitHub: https://github.com/SEBASMTB/vzlabike-and-run (rama main) — clone con
  `git clone https://github.com/SEBASMTB/vzlabike-and-run` y lee PROYECTO-ESTADO.md
  (ESTE ARCHIVO AHORA VIVE EN EL REPO, raíz del proyecto).
- ✅ 2026-11-27: PUSH REALIZADO. El flujo de comunidad está en producción:
  cuentas de atleta + /mi-perfil + gate de inscripción + header con sesión +
  importador incremental. Commits: 178db28 (auth) · 033f471 (páginas) · bbea7c6
  (gate+wizard) · d66a34b (header) · b71a487 (importador) · d5d7e92 (refactor) ·
  6061dbe (fix getDb) · docs incluidos en el repo.
- ⚠️ HISTORIA (para no repetir errores): 2 sesiones previas implementaron lo mismo
  pero se PERDIÓ por reciclado del sandbox SIN push. Esta reconstrucción final está
  verificada E2E con navegador real y PUESTA EN main.
- Deploy Vercel: https://vzlabike-and-run.vercel.app
- Admin: https://vzlabike-and-run.vercel.app/admin/login (pass: vzlabike2024)
- Base de datos: Turso (libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io)
- Sandbox sin credenciales GitHub: para push el usuario debe pasar un token
  (usarlo SOLO en el comando git push y recomendar rotarlo; jamás escribirlo en archivos).

== ARCHIVO DE ESTADO COMPLETO ==
Lee PROYECTO-ESTADO.md (raíz del repo) para: funciones operativas, pendientes,
arquitectura, tests, historial de commits y cómo cargar corredores.

== LO ÚLTIMO QUE SE HIZO (2026-11-27 — FLUJO DE COMUNIDAD DE PUNTA A PUNTA) ==

El usuario reportó en producción: /registrarse 404, sin botones de sesión en navbar/portada,
"Próximos Eventos" sin eventos. Se implementó y verificó:

1. AUTH DE ATLETAS (178db28): modelo User (email único, passwordHash scrypt con sal +
   constant-time, nombre, role, runnerId @unique → vínculo 1:1 con Runner; la CÉDULA vive
   solo en Runner). DDL CREATE IF NOT EXISTS + índices añadidos a db.ts Y db-init.ts →
   Turso crea la tabla sola al primer request (sin migración manual). APIs rate-limited:
   POST /api/auth/registrarse (cédula obligatoria → busca Runner, vincula, cookie inmediata;
   409 email/cédula duplicadas), POST /api/auth/iniciar-sesion (correo O cédula — la cédula
   resuelve vía runner.cedula; error genérico), POST /api/auth/cerrar-sesion,
   GET|PATCH /api/auth/me (ficha propia + edición por secciones + vincular cédula si no hay
   vínculo), GET /api/auth/mis-inscripciones (runnerId o cédula en filas legacy
   recipientCedula/idNumber; agrupa PENDING/APPROVED/REJECTED con dorsal+caja+motivo).
   Cookie vbr_user_token httpOnly SameSite=Lax secure-prod 30 días; token firmado con
   AUTH_SECRET || TOKEN_SECRET || fallback dev (roles user/admin NO intercambiables).
   getDb() explícito en rutas que tocan BD antes de la sesión (6061dbe) y en getSessionUser.

2. PÁGINAS DE USUARIO (033f471): src/app/{iniciar-sesion,registrarse,mi-perfil}/page.tsx
   (top-level, con Header/Footer propios). /registrarse: cédula con vista previa en vivo
   vía /api/runners/lookup → banner verde "¡Historial encontrado!"; ?redirect= validado
   ANTI OPEN-REDIRECT (solo rutas internas). /mi-perfil: menú lateral (tarjeta iniciales +
   badge "Cédula verificada"), Información Personal (cédula read-only), Información Médica
   (grupo sanguíneo + alergias), Contacto de Emergencia, Mis Inscripciones agrupadas
   (Pendientes / Aprobadas con dorsal grande + caja / Rechazadas con motivo), banner
   "Vincula tu cédula" si la cuenta no tiene Runner.

3. GATE + WIZARD (bbea7c6): /eventos/[slug]/inscribirse/page.tsx (server) llama
   getSessionUserFromServer() y redirige con redirect() de next/navigation (Next 16
   NO soporta meta-refresh/NextResponse en gate de server component) a
   /iniciar-sesion?redirect=/eventos/[slug]/inscribirse. Tras login/registro el usuario
   VUELVE SOLO al wizard. RegistrationWizard recibió prop sessionRunner (opcional):
   si hay sesión con Runner vinculado, el Paso 1 nace prellenado con banner verde;
   "Para otra persona" sigue disponible (inscribir a un tercero).

4. HEADER + PORTADA (d66a34b): Header.tsx con sesión real (fetch /api/auth/me): sin sesión
   → Iniciar Sesión + Registrarse (con ?redirect= a la página actual); con sesión → chip
   con nombre + Mi Perfil + Cerrar sesión (desktop y móvil). EventCard CTA ahora dice
   "Inscribirme". La sección "Próximos Eventos" quedó funcionando (el reporte del usuario
   era por falta de eventos: se creó uno el 25-nov y /api/events ya lo devuelve).

5. IMPORTADOR (b71a487): scripts/import-runners.ts — CSV UTF-8 (BOM ok), detecta
   delimitador , o ; ; lotes de 500 con Promise.allSettled; pre-query de existentes por
   lote y MERGE SIN BORRAR (valor no-vacío del CSV gana; vacío conserva el dato vigente);
   upsert por cédula normalizada (src/lib/cedula.ts, V-12.345.678 → V12345678) — jamás
   duplica. Encabezados EXACTOS (plantilla download/plantilla-corredores-vbr.csv):
   CEDULA,NOMBRE,APELLIDO,FECHA_NACIMIENTO,SEXO,EMAIL,TELEFONO,ESTADO,CIUDAD,DIRECCION,
   CLUB,TALLA,GRUPO_SANGUINEO,ALERGIAS,EMERGENCIA_NOMBRE,EMERGENCIA_TELEFONO,
   EMERGENCIA_PARENTESCO (obligatorios CEDULA/NOMBRE/APELLIDO) + alias históricos
   (FECA DE NAC, FECHA NAC, E MAIL, TEAM). --dry-run. Reporte: leídos/únicos/omitidos/
   creados/actualizados/errores/total BD. ELIMINADO prisma/import-runners.ts legacy
   (sobrescribía con vacíos). Uso: npx tsx scripts/import-runners.ts mi.csv [--dry-run];
   en producción exportar TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.

VERIFICACIÓN LOCAL (build producción + navegador real agent-browser + curl):
build limpio; /registrarse /iniciar-sesion /mi-perfil 200; gate sin sesión aterriza en
/iniciar-sesion?redirect=%2Feventos%2F…; registro con V-12.345.678 → banner historial →
auto-login → /mi-perfil con ficha JUAN PÉREZ + "Cédula verificada · V12345678"; logout
restaura botones; login por CÉDULA ok; con redirect pendiente vuelve SOLO al wizard;
wizard prellenado (nombres/email/emergencia de la ficha); importador: crea → re-carga no
duplica (0 creados/2 actualizados) → merge conserva alergias "Penicilina" con CSV parcial;
privacidad: /api/auth/me sin sesión 401.

== PENDIENTES DEL USUARIO (no del código) ==
- Opcional: cargar AUTH_SECRET en Vercel (si no, sesiones comparten secreto con admin,
  seguro pero aislable). - Cargar RESEND_API_KEY para correos (sin key todo funciona).
- Cargar los 4.000 corredores con el importador cuando tenga el CSV final.
- Rotar el token de GitHub que compartió en el chat (buena práctica).

== REGLAS DE ORO ==
1. SIEMPRE terminar la respuesta con TODAS las URLs de acceso (ver PROYECTO-ESTADO.md).
2. Privacidad estricta: ningún endpoint público expone PII de otros corredores.
3. Commits atómicos con mensajes descriptivos + push a main al cierre de cada sesión.
4. Actualizar PROYECTO-ESTADO.md y SESSION-RESUME.md (AHORA en el repo) al final de
   cada sesión y commitearlos para que el contexto nunca se pierda.
```

---

## 📝 NOTAS TÉCNICAS QUE SALVARON TIEMPO (leer antes de tocar auth/gate)

1. **Gate en server component de Next 16**: usar `redirect("/ruta?redirect=…")` de
   `next/navigation` — el HTML llega 200 con payload RSC y el navegador navega solo.
   Un `NextResponse.redirect()` o meta-refresh NO funciona ahí.
2. **`getDb()` explícito** al inicio de las rutas API que consultan BD antes de validar
   sesión: el proxy de `db.ts` solo auto-inicia DDL/seed en producción; en dev hay que
   garantizarlo (pérdida de horas en la reconstrucción anterior).
3. **Prisma generate**: usar el CLI local (`./node_modules/.bin/prisma generate`).
   Un `npx prisma` global (v8) no genera cliente v6 y lanza error confuso de contrato.
4. **Prisma 1:1**: `User.runnerId` DEBE llevar `@unique` o la validación del esquema
   falla con P1012 al generar cliente.
5. **Turbopack build**: el gate vive en chunks `server/chunks/ssr/…` — buscar strings
   del gate ahí, no en `page.js` directo, al auditar builds.
6. **Prueba local de producción**: `NODE_ENV=production DATABASE_URL=file:/tmp/vzlabike.db
   ./node_modules/.bin/next start -p 3100` (db.ts fuerza /tmp en prod local; crear
   esquema antes con `prisma db push` si se quieren datos del importador).
