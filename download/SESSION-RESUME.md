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
Sección "¿Por Qué Elegirnos?" con fotografías deportivas reales v3 (commit `11eeb78`, deployado y verificado en producción):
- 6 fotos realistas en `public/features/{experiencia,creatividad,tecnologia,precision,adaptabilidad,compromiso}.webp` (896x512, 32-101KB, colores naturales)
- Escenas alineadas al texto: meta de maratón, salida con confeti, oficial + reloj LED + portátil, foto-finish con conos, triatleta saliendo del agua, voluntaria colocando medalla
- **SIN logos** (el usuario pidió quitar el chip del logo en `11eeb78`)
- Generador: `scripts/gen-features-foto.mjs` (SDK z-ai, 1344x768) → masters `scripts/foto-*.png`
- Pendiente de feedback del usuario sobre esta versión v3

== SIGUIENTE PASO ==
1. Esperar feedback del usuario sobre las fotos v3 (si quiere cambiar una escena específica: editar su prompt en `scripts/gen-features-foto.mjs`, borrar ese master `scripts/foto-<nombre>.png` y correr `node scripts/gen-features-foto.mjs`)
2. Rediseño del flujo de inscripción/pagos (4 fases presentadas al usuario, esperando OK antes de implementar - ver PROPUESTA en PROYECTO-ESTADO.md)
3. Unificación del sistema de categorías (Prisma Category vs raw SQL EventCategory)

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
| GitHub repo | https://github.com/SEBASMTB/vzlabike-and-run |
| Vercel dashboard | https://vercel.com/venezuelabike-9338s-projects/vzlabike-and-run |
| Turso dashboard | https://app.turso.tech/vbrresult |
| API health | https://vzlabike-and-run.vercel.app/api/health |
