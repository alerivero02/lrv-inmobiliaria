# Deploy — LRV

Stack: **Vite (frontend)** + **Node/Express (backend)** + **PostgreSQL** + **uploads en disco**.

## Railway (recomendado)

1. Crear proyecto en [Railway](https://railway.app) y conectar este repositorio.
2. Añadir el plugin **PostgreSQL**; Railway expone `DATABASE_URL` automáticamente.
3. Variables del servicio que ejecuta el backend (ver `Dockerfile` en la raíz):
   - `JWT_SECRET` — obligatorio, cadena larga y aleatoria.
   - `HOST` — URL pública del servicio (ej. `https://xxx.up.railway.app`) para enlaces de imágenes en `/uploads`.
   - `CORS_ORIGINS` — si el front está en otro dominio, lista separada por comas; con un solo servicio Docker que sirve API + `dist`, suele bastar el mismo origen.
   - `TRUST_PROXY=1` — detrás del proxy de Railway.
4. Build: el `Dockerfile` en la raíz compila el frontend (`npm run build` con `VITE_API_URL=/api`) y copia `dist/` junto al backend; arranque con `SERVE_STATIC=1` y `FRONTEND_DIST=/app/dist` (ya definidos en la imagen).
5. Tras el primer deploy: ejecutar una vez `npm run seed` en un shell del contenedor o job one-off (crea admin y demos si la base está vacía). Ajustá `ADMIN_EMAIL` / `ADMIN_PASSWORD` por variables de entorno antes del seed en producción.
6. Postgres local sin SSL: `PGSSLMODE=disable` en `.env` del backend.

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

