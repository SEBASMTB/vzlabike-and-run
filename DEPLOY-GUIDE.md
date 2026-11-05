# VzlaBike and Run — Guía de Autoalojamiento

## Requisitos

- **Node.js** 18.17 o superior (recomendado: 20 LTS)
- **npm** 9.0 o superior
- **PostgreSQL** 14+ (recomendado) o MySQL 8+ o SQLite 3+
- Un servidor con al menos 1GB RAM

## Opciones de Hosting Compatible

| Proveedor | Tipo | Nota |
|-----------|------|------|
| DigitalOcean Droplet | VPS | Desde $4/mes |
| AWS EC2 | VPS | Free tier disponible |
| Hostinger VPS | VPS | Desde $3.99/mes |
| Contabo | VPS | Desde $4.50/mes |
| Railways | PaaS | Despliegue automático |
| Render | PaaS | Plan gratuito disponible |

> NOTA: HostGator y Bluehost son hosting compartido (cPanel) y NO soportan aplicaciones Node.js de forma nativa. Necesitarás un VPS.

## Instalación Paso a Paso

### 1. Copiar archivos al servidor

Sube todos los archivos del proyecto a tu servidor (via SFTP, SCP o Git).

### 2. Instalar dependencias

```bash
cd /ruta/al/proyecto
npm install
```

### 3. Configurar base de datos

#### Opción A: PostgreSQL (RECOMENDADO)

```bash
# Crear base de datos
sudo -u postgres psql
CREATE DATABASE vzlabike;
CREATE USER vzlabike_user WITH PASSWORD 'TU_CONTRASEÑA_DB';
GRANT ALL PRIVILEGES ON DATABASE vzlabike TO vzlabike_user;
\q
```

#### Opción B: MySQL

```bash
mysql -u root -p
CREATE DATABASE vzlabike CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vzlabike_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_DB';
GRANT ALL PRIVILEGES ON vzlabike.* TO 'vzlabike_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Edita `.env` con tus datos:

```env
# PostgreSQL
DATABASE_URL="postgresql://vzlabike_user:TU_CONTRASEÑA_DB@localhost:5432/vzlabike"

# MySQL
# DATABASE_URL="mysql://vzlabike_user:TU_CONTRASEÑA_DB@localhost:3306/vzlabike"

# Seguridad (cambia estos valores)
ADMIN_PASSWORD="TU_CONTRASEÑA_ADMIN"
TOKEN_SECRET="CLAVE_SECRETA_MUY_SEGURA_ALEATORIA"

# URL pública
NEXT_PUBLIC_SITE_URL="https://tudominio.com"
```

### 5. Configurar Prisma para tu base de datos

Edita `prisma/schema.prisma`, línea `provider`:

- PostgreSQL: `provider = "postgresql"`
- MySQL: `provider = "mysql"`
- SQLite: `provider = "sqlite"`

### 6. Inicializar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push
```

### 7. Compilar y ejecutar

```bash
# Compilar
npm run build

# Iniciar en producción
npm start
```

El sitio estará disponible en `http://TUSERVIDOR:3000`

### 8. Configurar Nginx (proxy inverso)

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9. Configurar SSL con Certbot (HTTPS gratuito)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 10. Ejecutar como servicio (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start npm --name "vzlabike" -- start

# Guardar para que inicie automáticamente
pm2 save
pm2 startup
```

## Estructura del Proyecto

```
vzlabikeandrun/
├── prisma/
│   └── schema.prisma        # Esquema de base de datos (configurable)
├── public/                   # Imágenes y archivos estáticos
├── src/
│   ├── app/                  # Páginas y API routes (Next.js App Router)
│   ├── components/           # Componentes React reutilizables
│   └── lib/                  # Utilidades (db, auth, categories)
├── .env.example              # Plantilla de variables de entorno
├── package.json              # Dependencias
├── next.config.ts            # Configuración de Next.js
├── tsconfig.json             # Configuración de TypeScript
├── tailwind.config.ts        # Configuración de Tailwind CSS
└── DEPLOY-GUIDE.md           # Esta guía
```

## Comandos Útiles

```bash
npm run dev          # Desarrollo en puerto 3000
npm run build        # Compilar para producción
npm start            # Iniciar en producción
npx prisma studio    # Visor visual de la base de datos
npx prisma db push   # Sincronizar esquema con la DB
npx prisma generate  # Regenerar cliente Prisma
```

## Panel de Administración

Accede a `/admin` para gestionar eventos, inscripciones y productos.

- **URL**: `https://tudominio.com/admin`
- **Contraseña**: La que definiste en `ADMIN_PASSWORD` en `.env`

## Migrar Datos Existentes

Si tienes datos en la base de datos de Turso y quieres migrarlos:

1. Exporta desde Turso: `turso db shell TU_DB` → `.dump`
2. Adapta el SQL dump a PostgreSQL/MySQL (reemplaza tipos SQLite)
3. Importa: `psql -U vzlabike_user -d vzlabike < dump.sql`

## Notas Importantes

- Este proyecto usa **Next.js 16** con App Router — requiere Node.js 18+
- Las imágenes subidas se guardan como base64 en la base de datos
- El resultado de `npm run build` va a la carpeta `.next/`
- Para actualizar: `git pull && npm install && npm run build && pm2 restart vzlabike`
