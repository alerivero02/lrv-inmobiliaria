# Equipo de agentes (roles por sección) — Railway + PostgreSQL

Este documento define responsabilidades por “agente” para mantener y desplegar LRV sin solapar tareas.

| Agente | Ámbito | Entregables |
|--------|--------|-------------|
| **Infra / Railway** | Plataforma, variables, Postgres, healthchecks | Servicio Docker o Nixpacks, plugin PostgreSQL, `DATABASE_URL`, `PORT`, `JWT_SECRET`, `TRUST_PROXY=1`, dominio y SSL |
| **Backend API** | Express, rutas, migraciones | `backend-node/db.js`, `routes/*`, CORS, uploads, `HOST` para URLs de imágenes |
| **Datos** | Esquema y seed | Migraciones idempotentes, `npm run seed` solo en entornos controlados |
| **Frontend build** | Vite y API base | `VITE_API_URL=/api` en build de producción (mismo origen que el backend unificado) |
| **Landing / Hero** | Marketing público | `src/components/Hero.*`, secciones en `src/landing/sections/` |
| **QA** | Smoke tests | `/api/health`, login admin, listado público |

Convención: un PR por frente (infra, API o UI) salvo hotfix coordinado.
