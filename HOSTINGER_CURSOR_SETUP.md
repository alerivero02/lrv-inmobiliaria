# Instrucciones Hostinger para Cursor (LRV)

Este documento describe cómo dejar el proyecto **completamente funcional** en Hostinger con:
- Backend Node/Express + SQLite (persistente)
- Frontend React/Vite (SPA)
- Subdominio `admin` que muestre la pantalla `/admin/login`

## 1) Requisitos
- Hostinger Business Web Hosting con Node.js disponible (18.x/20.x/22.x/24.x).
- Un dominio principal, por ejemplo `lrvinmobiliaria.com`.
- El subdominio `admin` debe estar configurado en tu panel (en tu caso, ya existe).

## 2) Estructura recomendada en el servidor
Subir el proyecto (ZIP de “Hostinger” o manualmente) manteniendo:
- `backend-node/` (API Node)
- `dist/` (frontend build)

Variables a definir:
- `backend-node/.env` (obligatorio)
- `VITE_API_URL` **en el build** del frontend (no se aplica en runtime si usás Vite build-time)

## 3) Backend (Node) + SQLite (DB)

### 3.1 Variables de entorno (ejemplo para `backend-node/.env`)
Ajustá estos valores:

```env
PORT=4000
JWT_SECRET=...REEMPLAZAR...
DB_PATH=./lrv.db
HOST=https://lrvinmobiliaria.com
CORS_ORIGINS=https://lrvinmobiliaria.com,https://admin.lrvinmobiliaria.com
TRUST_PROXY=1

# (opcional) optimización de imágenes
IMAGE_FORMAT=webp
IMAGE_MAX_WIDTH=1920
IMAGE_QUALITY=80
```

Notas:
- `DB_PATH` debe apuntar a un archivo **persistente** en tu servidor (el path puede ser relativo dentro de `backend-node/`).
- El backend ejecuta `migrate()` al iniciar, por lo que **crea tablas automáticamente** si no existen.

### 3.2 Instalar y levantar
En `backend-node/`:

```bash
npm ci
npm run start
```

### 3.3 Seed (crear admin demo) - recomendado
Ejecutá una vez:

```bash
node scripts/seed.js
```

Credenciales de ejemplo (si no cambiaste env):
- Email: `admin@lrv.com`
- Password: `Admin123!` (o el que definas en `ADMIN_PASSWORD`)

## 4) Frontend (SPA React/Vite)

El front es una SPA con rutas tipo:
- `/admin/login`
- `/propiedades`
- `/propiedades/:id/solicitar-visita`

Por eso es imprescindible configurar **SPA fallback** para que cualquier ruta devuelva `index.html`.

### 4.1 Build previo (si vas a reconstruir)
Asegurá que en el build:

`VITE_API_URL=https://lrvinmobiliaria.com/api`

Luego subí el `dist/` generado.

## 5) Subdominio `admin` (admin.lrvinmobiliaria.com)

### Opción recomendada (misma SPA)
1. Hacé que el subdominio `admin.lrvinmobiliaria.com` apunte al mismo `dist/` (misma build).
2. Asegurá el SPA fallback para que:
   - Entrar a `/admin/login` desde el navegador no dé 404.

### Redirect de la raíz del subdominio hacia login
En el docroot del subdominio (`dist/` o la carpeta que uses), agregá una regla para redirigir `/` a `/admin/login`.

#### Apache (.htaccess) — ejemplo
Poné un `.htaccess` en la carpeta que sirve `dist/`:

```apache
RewriteEngine On

# Redirect de la raíz a admin login
RedirectMatch 301 ^/$ /admin/login

# SPA fallback: si no existe archivo/carpeta, servir index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

#### Nginx (si aplica)
Usá un `try_files` equivalente para fallback a `index.html`, y un redirect de `/` a `/admin/login`.

## 6) Coherencia CORS
Si usás el frontend desde `admin.lrvinmobiliaria.com`, asegurate que:
- `backend-node/.env` tenga `CORS_ORIGINS` con ambos dominios.

## 7) Checklist final
- [ ] Backend `npm ci` + `npm run start` levantado sin errores.
- [ ] Visitas de `/api/health` devuelven `{ status: "ok" }`.
- [ ] Front carga en `lrvinmobiliaria.com` y abre modales/listado.
- [ ] `admin.lrvinmobiliaria.com` redirige a `/admin/login` y el login funciona.
- [ ] `/propiedades`, modales de más info y agenda funcionan.

