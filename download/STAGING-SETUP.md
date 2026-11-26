# 🧪 Guía de Despliegue en Staging — VzlaBike and Run®

> Subdominio de pruebas conectado a una base de datos Turso SEPARADA.
> Objetivo: probar cambios reales (wizard, dorsales, conciliación) sin tocar
> jamás la producción de https://vzlabike-and-run.vercel.app.
> Última actualización: 2026-11-25

---

## Arquitectura

```
Producción                          Staging
──────────────────────────────      ──────────────────────────────
Vercel: venezuelabike-9338s-projects/vzlabike-and-run
URL: vzlabike-and-run.vercel.app    URL: staging.vzlabikeandrun.com
Turso: vzlabikeandrun (prod)        Turso: vzlabikeandrun-staging (aislada)
Branch: main                        Branch: main (o rama staging/*)
```

Ambos proyectos comparten el MISMO repo de GitHub. Vercel no permite dos
proyectos del mismo repo con el mismo dominio, pero sí con dominios distintos.

---

## Paso 1 — Crear la base de datos Turso de staging

```bash
# 1. Crear la BD aislada en la misma org (plan Free admite varias BD)
turso db create vzlabikeandrun-staging --location aws-us-west-2

# 2. Obtener la URL y crear el token
turso db show vzlabikeandrun-staging --url
turso db tokens create vzlabikeandrun-staging

# 3. (Opcional) Sembrar el esquema: se auto-crea en el primer request
#    gracias a src/lib/db.ts (CREATE TABLE IF NOT EXISTS + ALTER TABLE).
#    NO necesitas correr migraciones manuales.
```

> ⚠️ La BD de staging NUNCA se sincroniza con producción. Si quieres datos
> reales para probar, exporta solo lo necesario (p. ej. un evento) con un
> script, nunca la tabla Runner completa (PII).

---

## Paso 2 — Crear el proyecto de Vercel para staging

1. Vercel → **Add New… → Project** → importa el repo `SEBASMTB/vzlabike-and-run`.
2. **Nombre del proyecto:** `vzlabike-and-run-staging`
   (el team es el mismo: `venezuelabike-9338s-projects`).
3. **Environment Variables** (solo Production del nuevo proyecto):
   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | URL de `vzlabikeandrun-staging` (Paso 1) |
   | `TURSO_AUTH_TOKEN` | token de staging (Paso 1) |
4. Deploy. Vercel ejecutará el mismo build (Next.js 16).

> Importante: los valores deben ser los de STAGING. Si ves tráfico de
> inscripciones reales en la BD de staging, detente: apuntas a producción.

---

## Paso 3 — Subdominio y dominio en Vercel

En el **nuevo proyecto** de Vercel:

1. Settings → **Domains** → agrega `staging.vzlabikeandrun.com`.
2. Vercel te dará los registros DNS. En tu proveedor del dominio
   `vzlabikeandrun.com` crea:
   ```
   Tipo: CNAME
   Nombre: staging
   Valor: cname.vercel-dns.com
   TTL: 3600
   ```
3. Espera la propagación (5–30 min). Vercel emite SSL automático (Let's Encrypt).

**Alternativa sin dominio propio:** usa el dominio gratuito de Vercel
(`vzlabike-and-run-staging.vercel.app`) — cero configuración DNS.

---

## Paso 4 — Flujo de trabajo recomendado

1. Los cambios funcionales se suben SIEMPRE a `main` (producción de GitHub).
2. Para probar un cambio arriesgado en staging **antes** de que salga a
   producción, en el proyecto de staging configura:
   - Settings → Git → **Production Branch:** `staging`
   - Y en el proyecto de producción deja `main`.
3. Flujo:
   ```bash
   git checkout -b staging && git push origin staging   # staging se despliega
   # …pruebas en staging.vzlabikeandrun.com…
   git checkout main && git merge staging && git push   # producción
   ```
4. **Regla de oro:** ningún push directo a `main` de código sin probar si
   toca el flujo de inscripción/pagos — pasa primero por staging.

---

## Paso 5 — Qué probar en cada sesión de staging

- [ ] Wizard de 3 pasos completo con un evento creado en la BD de staging
- [ ] Configurar cuentas de pago del evento y verificar que solo aparecen en el Paso 3
- [ ] Lotes de dorsales: auto-calcular, aprobar varios en lote, verificar correlativos
- [ ] Conciliación: registrar pago sin ficha → inscribirse con esa referencia → aprobar en 1 clic
- [ ] Rechazo con motivo y liberación de dorsal
- [ ] Exportaciones Excel (general y ChuckScore con caja física)
- [ ] Consulta pública de dorsal/caja del corredor

---

## Coste

| Recurso | Plan | Coste |
|---------|------|-------|
| Vercel proyecto extra | Hobby (por proyecto) | $0 |
| Turso BD extra | Free (500 BD, 9 GB) | $0 |
| Subdominio | — | $0 |

---

## Checklist de verificación final

```bash
# Salud del staging (marca de versión)
curl https://staging.vzlabikeandrun.com/api/health

# La BD de staging arranca vacía: 0 eventos al inicio
curl https://staging.vzlabikeandrun.com/api/events
```

Si `api/health` responde y `/api/events` devuelve `[]` (o los eventos que
hayas creado en staging), el entorno está listo.
