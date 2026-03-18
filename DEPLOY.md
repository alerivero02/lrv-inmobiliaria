# Deploy (VPS barato) — LRV

Este proyecto es **Vite (frontend)** + **Node/Express (backend)** + **SQLite** + **uploads en disco**.

## Requisitos del VPS
- Ubuntu 22.04/24.04
- 1–2GB RAM
- Dominio apuntando al VPS

## Estructura recomendada en el servidor
- `/var/www/lrv/frontend` (repo o build)
- `/var/www/lrv/backend` (backend-node)
- Persistencia:
  - `/var/www/lrv/backend/lrv.db`
  - `/var/www/lrv/backend/uploads/`

## 1) Backend (Node)
1. Copiá `backend-node/` al servidor en `/var/www/lrv/backend`.
2. En `/var/www/lrv/backend/.env` configurar:
   - `PORT=4000`
   - `JWT_SECRET=...` (obligatorio)
   - `DB_PATH=./lrv.db`
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
   - `VITE_API_URL=https://TU_DOMINIO/api`

## 3) HTTPS + reverse proxy (Caddy)
1. Instalar Caddy.
2. Copiá el `Caddyfile` del repo (`[Caddyfile](Caddyfile)`) y reemplazá:
   - `example.com` → tu dominio
   - `root` → `/var/www/lrv/frontend/dist`
3. Reiniciar Caddy.

## Backups mínimos (recomendado)
- DB: `lrv.db`
- Uploads: `uploads/`

Con bajo presupuesto, lo más simple es un cron diario que comprima y suba a un storage externo (S3 compatible / Google Drive / etc.).

