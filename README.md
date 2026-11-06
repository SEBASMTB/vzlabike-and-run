# 🚴 VzlaBike and Run® — Plataforma de Cronometraje Deportivo

Sistema completo de organización de eventos deportivos (carreras, MTB, triatlones) con panel admin, inscripciones, tienda y exportación Excel.

## 🌐 URLs

- **Sitio público:** https://vzlabike-and-run.vercel.app
- **Admin:** https://vzlabike-and-run.vercel.app/admin/login (pass: `vzlabike2024`)
- **GitHub:** https://github.com/SEBASMTB/vzlabike-and-run

## 🛠️ Stack

- **Frontend:** Next.js 16 (App Router) + React + TypeScript
- **Backend:** Next.js API Routes + Prisma ORM 6
- **DB:** Turso (libSQL distribuido)
- **UI:** Tailwind CSS 4 + shadcn/ui + Framer Motion
- **Deploy:** Vercel (auto-deploy desde GitHub)

## 📋 Documentación interna

| Archivo | Contenido |
|---------|-----------|
| `download/PROYECTO-ESTADO.md` | Estado técnico completo: funciones operativas, errores pendientes, siguiente paso |
| `download/SESSION-RESUME.md` | Prompt para copiar-pegar al iniciar nueva sesión |
| `download/INVENTARIO-PROYECTO.md` | Inventario de rutas, APIs, componentes |
| `download/TURSO-SETUP.md` | Guía de configuración de Turso |

## ⚙️ Setup local

```bash
# Instalar dependencias
bun install

# Configurar .env (ver TURSO-SETUP.md)
# DATABASE_URL=libsql://...
# TURSO_AUTH_TOKEN=...

# Migrar BD
node scripts/migrate-turso.js

# Levantar dev server
bun run dev
```

## 🔄 Protocolo de trabajo

1. **Commits atómicos:** cada cambio funcional → `git add . && git commit && git push`
2. **Vercel auto-sync:** cada push dispara un redeploy automático
3. **Documentar:** actualizar `PROYECTO-ESTADO.md` tras cada cambio
4. **Nunca dejar cambios sin commitear**

## 🗄️ Base de datos (Turso)

- **Org:** `vbrresult` (Free plan)
- **DB:** `vzlabikeandrun`
- **URL:** `libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io`
- **Tablas:** Event (38 cols), Registration, Product, ProductOrder, Runner, Category

Ver `download/TURSO-SETUP.md` para configurar desde cero.
