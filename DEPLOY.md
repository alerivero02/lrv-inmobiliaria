# Deploy — LRV

Stack: **Vite (frontend)** + **Node/Express (backend)** + **PostgreSQL** + **uploads en disco**.

## Railway (recomendado)

### Cómo encaja todo (importante)

En Railway tenés **servicios separados** en el mismo proyecto:

| Servicio | Rol |
|----------|-----|
| **Postgres** | Corre la base; las variables `DATABASE_URL`, `PGHOST`, etc. viven **solo** en este servicio. |
| **lrv-inmobiliaria** (Docker) | Corre `node server.js` + estáticos; es el que debe **ver** `DATABASE_URL` en tiempo de ejecución. |

**Git** solo alimenta el build del servicio de la app. **No** “copia” la base de datos: el plugin Postgres es otro servicio que vos agregás al canvas y mantenés conectado por variables.

### Pasos

1. **Crear proyecto** y conectar el repositorio (servicio con `Dockerfile` en la raíz, ver `railway.toml`).
2. **Añadir PostgreSQL**: `+ New` → **Database** → **PostgreSQL**. Esperá a que quede **Online**.
3. **Enlazar la base a la app** (sin esto la API no usa Postgres):
   - Abrí el servicio **lrv-inmobiliaria** (el de tu repo), pestaña **Variables**.
   - **New variable** → **Add reference** (o “Reference”).
   - Elegí el servicio **Postgres** y la variable **`DATABASE_URL`**.
   - Guardá con el nombre **`DATABASE_URL`** (exactamente así; muchas librerías la buscan por ese nombre).
   - Sintaxis alternativa manual: `${{NombreDelServicioPostgres.DATABASE_URL}}` (el nombre es el que muestra el recuadro del servicio en el canvas, p. ej. `Postgres`).
4. **Variables obligatorias / recomendadas** en el servicio **de la app** (no en Postgres salvo que el propio Postgres las pida):
   - `JWT_SECRET` — obligatorio, cadena larga y aleatoria.
   - `NODE_ENV=production`
   - `TRUST_PROXY=1` — detrás del proxy de Railway.
   - `FRONTEND_URL` — URL pública del sitio (ej. `https://www.lrvinmobiliaria.com`) para enlaces en correos (invitaciones / olvidé contraseña).
   - `CORS_ORIGINS` — si el navegador llama desde otro origen, lista separada por comas; si API y web van en el **mismo dominio** (un solo Docker sirve `/` y `/api`), podés dejarlo vacío o poner tu dominio.
   - `HOST` — URL pública del servicio para URLs absolutas de `/uploads` si las usás.
   - **No** definas `PGSSLMODE=disable` en Railway: el Postgres de Railway usa SSL; dejarlo en disable puede romper la conexión.
5. **Build**: el `Dockerfile` compila Vite con `VITE_API_URL=/api` (mismo host). Si necesitás otro valor en build, configurá variable **`VITE_API_URL`** también en **Build Variables** / Docker ARG según Railway.
6. **Arranque**: en los **Deploy logs** del servicio app deberías ver `✅ Conectado a PostgreSQL (DATABASE_URL presente)`. Si ves el aviso de **SQLite en producción**, falta o falla la referencia a `DATABASE_URL`.
7. **Seed** (primera vez): en un shell one-off del contenedor de la app: `node scripts/seed.js` (o `npm run seed` desde `/app/backend-node`). Definí antes `ADMIN_EMAIL` / `ADMIN_PASSWORD` si no querés los defaults del script.
8. **Correo (SMTP + `FRONTEND_URL`)**: necesario para invitaciones y “olvidé mi contraseña”.

### Panel “Database” de Railway

La pestaña **Database** del servicio Postgres a veces queda en “Attempting to connect…” por la UI o por carga; **no** implica que tu app esté mal configurada. Lo que importa es que el **servicio de la app** tenga `DATABASE_URL` referenciada y que los logs de deploy muestren PostgreSQL como arriba.

### Postgres solo en local

En tu máquina, sin SSL: `PGSSLMODE=disable` en `.env` del backend. **No** uses eso en Railway.

## VPS (alternativa)

Este proyecto es **Vite (frontend)** + **Node/Express (backend)** + **PostgreSQL** + **uploads en disco**.

## Requisitos del VPS
- Ubuntu 22.04/24.04
- 1–2GB RAM
- Dominio apuntando al VPS

## Estructura recomendada en el servidor
- `/var/www/lrv/frontend` (repo o build)
- `/var/www/lrv/backend` (backend-node)
- Persistencia:
  - PostgreSQL (cadena `DATABASE_URL`)
  - `/var/www/lrv/backend/uploads/`

## 1) Backend (Node)
1. Copiá `backend-node/` al servidor en `/var/www/lrv/backend`.
2. En `/var/www/lrv/backend/.env` configurar:
   - `PORT=4000`
   - `JWT_SECRET=...` (obligatorio)
   - `DATABASE_URL=postgresql://...`
   - `HOST=https://TU_DOMINIO`
   - `CORS_ORIGINS=https://TU_DOMINIO`
   - (si usás proxy) `TRUST_PROXY=1`
3. Instalar dependencias:
   - `npm ci --omit=dev` (o `npm install --omit=dev`)
4. Seed (opcional, solo primera vez / entornos controlados):
   - `npm run seed`

### Systemd
1. Copiá `[backend-node/lrv-backend.service](backend-node/lrv-backend.service)` a:
   - `/etc/systemd/system/lrv-backend.service`
2. Habilitar y arrancar:
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now lrv-backend`
3. Ver logs:
   - `sudo journalctl -u lrv-backend -f`

## 2) Frontend (Vite)
1. En tu máquina o en el VPS:
   - `npm ci`
   - `npm run build`
2. Copiá `dist/` a:
   - `/var/www/lrv/frontend/dist`
3. Configurar `VITE_API_URL` (build-time) antes del build:
   - Mismo dominio que el API: `VITE_API_URL=/api`
   - Dominio distinto: `VITE_API_URL=https://api.TU_DOMINIO/api`

## 3) HTTPS + reverse proxy (Caddy)
1. Instalar Caddy.
2. Copiá el `Caddyfile` del repo (`[Caddyfile](Caddyfile)`) y reemplazá:
   - `example.com` → tu dominio
   - `root` → `/var/www/lrv/frontend/dist`
3. Reiniciar Caddy.

## Backups mínimos (recomendado)
- DB: volcados de PostgreSQL (`pg_dump`)
- Uploads: `uploads/`

Con bajo presupuesto, lo más simple es un cron diario que comprima y suba a un storage externo (S3 compatible / Google Drive / etc.).

