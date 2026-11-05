# 🔧 Guía: Configurar Base de Datos Persistente en Vercel

## ⚠️ Problema actual

En Vercel, las funciones serverless tienen un sistema de archivos **efímero**.
SQLite local (`file:./db/custom.db`) **NO persiste** entre deploys:
- Los eventos que crees se **perderán** en cada redeploy
- Los datos se resetean en cada cold start de la función

## ✅ Solución: Turso (libSQL distribuido)

Turso es SQLite distribuido, gratuito, y **perfecto para Vercel serverless**.
El proyecto ya tiene `@prisma/adapter-libsql` instalado y el código ya lo soporta.

---

## 📋 Pasos para configurar Turso

### Paso 1: Crear cuenta en Turso
1. Ve a **https://turso.tech**
2. Click **"Sign Up"** (gratis con GitHub)
3. Confirma tu email

### Paso 2: Crear base de datos
1. En el dashboard de Turso, click **"New Database"**
2. Name: `vzlabike` (o el nombre que prefieras)
3. Location: `iad` (Washington DC - mismo datacenter que Vercel East)
4. Click **"Create"**

### Paso 3: Obtener la URL y Token
1. En tu base de datos recién creada, ve a **"Settings"**
2. Copia estos 2 valores:
   - **Database URL**: algo como `libsql://vzlabike-xxxxxx.turso.io`
   - **Auth Token**: una cadena larga de caracteres

### Paso 4: Configurar variables de entorno en Vercel
1. Ve a tu proyecto en **https://vercel.com/venezuelabike-9338s-projects/vzlabike-and-run**
2. Click **Settings** → **Environment Variables**
3. Agrega estas variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `libsql://vzlabike-xxxxxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `tu-token-largo-aqui` |

4. Marca los entornos: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"** para cada una

### Paso 5: Redeploy
1. En Vercel, ve a **Deployments**
2. Click en el último deploy → **"Redeploy"**
3. O simplemente haz un push a GitHub para disparar un nuevo deploy

### Paso 6: Verificar
1. Entra a tu sitio: `https://vzlabike-and-run.vercel.app/admin/login`
2. Crea un evento de prueba
3. Espera un redeploy (o fuerza uno)
4. **El evento debe seguir ahí** ✅

---

## 🔍 Cómo funciona el código

El archivo `src/lib/db.ts` ya detecta automáticamente la configuración:

1. **Si `DATABASE_URL` empieza con `libsql://`** → usa Turso (remoto, persistente) ✅
2. **Si `DATABASE_URL` empieza con `file:`** → usa SQLite local (solo dev)
3. **En producción sin Turso** → cae a `/tmp/vzlabike.db` (efímero, con warning)

## 💰 Costo de Turso

- **Plan Free**: 500 databases, 9GB total, 1 billón reads/mes
- Suficiente para el proyecto VzlaBike and Run
- No requiere tarjeta de crédito

## 🔧 Comandos útiles de Turso (opcional)

```bash
# Instalar CLI de Turso (opcional)
curl -sSfL https://get.tur.so/install.sh | bash

# Crear DB desde terminal
turso db create vzlabike

# Obtener URL
turso db show vzlabike --url

# Obtener token
turso db tokens create vzlabike

# Ejecutar SQL directamente
turso db shell vzlabike
```

---

## ✅ Checklist final

- [ ] Cuenta creada en turso.tech
- [ ] Base de datos `vzlabike` creada
- [ ] URL y Token copiados
- [ ] Variables `DATABASE_URL` y `TURSO_AUTH_TOKEN` configuradas en Vercel
- [ ] Redeploy ejecutado
- [ ] Evento de prueba creado y verificado tras redeploy

Una vez completado, **tus datos persistirán permanentemente** en producción. 🚀
