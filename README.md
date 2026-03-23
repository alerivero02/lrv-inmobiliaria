# LRV

Stack:
- **Frontend**: React + Vite
- **Backend**: Node + Express
- **DB**: PostgreSQL (`DATABASE_URL`)

## Desarrollo

### Todo junto (recomendado): Postgres + API + Vite

Requisitos: **Docker Desktop** (o Docker Engine) y Node 20+.

```bash
npm install
cd backend-node && npm install && cd ..
npm run dev:all
```

- Postgres local: **puerto 5433** (`docker compose` según `docker-compose.yml`).
- API: **http://localhost:4000** (Vite reenvía `/api` al mismo origen → usá la app en **http://localhost:5173**).
- Primera vez con base vacía: en otra terminal `cd backend-node && npm run seed` (crea admin y demos).

Detener solo el contenedor: `npm run db:down`.

Sin Docker (API con **SQLite** en `backend-node/lrv.db`, mismo proxy `/api`):

```bash
npm run dev:all:sqlite
```

### Solo frontend
```bash
npm install
npm run dev
```
(Sin proxy útil si no levantás el backend; podés definir `VITE_API_URL`.)

### Solo backend
Necesitás PostgreSQL (`DATABASE_URL`) o, sin URL, SQLite en `backend-node/lrv.db`.

```bash
cd backend-node
npm install
npm run dev
```

## Producción / Deploy
Ver `[DEPLOY.md](DEPLOY.md)`.

## Calidad
- Lint: `npm run lint`
- Format: `npm run format`
- Tests backend:
```bash
cd backend-node
npm test
```

# LRV Inmobiliaria - Landing Page

Landing page moderna para la agencia inmobiliaria LRV (La Rioja, Argentina). Desarrollada con React y Vite.

## Características

- **Diseño**: Blanco hueso muy clarito y verde fuerte (paleta del logo)
- **Secciones**: Hero, Nosotros, Servicios (casas, departamentos, terrenos), Propiedades destacadas (carousel), Contacto, Footer
- **Carousel**: Swiper para propiedades destacadas con navegación, paginación y autoplay
- **Responsive**: Adaptado a móvil y desktop
- **Accesibilidad**: Navegación por teclado, ARIA y semántica correcta

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173) en el navegador.

## Build para producción

```bash
npm run build
npm run preview
```

## Estructura

- `src/components/` – Header, Hero, About, Services, PropertyCarousel, Contact, Footer
- `src/index.css` – Variables de diseño (colores, tipografías) y estilos globales
- `public/` – Favicon y assets estáticos

## Próximos pasos

- Reemplazar placeholders de imágenes por fotos reales de propiedades y equipo
- Conectar el formulario de contacto con un backend o servicio de email
- Ajustar textos y datos de contacto según información final de la empresa
