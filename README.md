# LRV

Stack:
- **Frontend**: React + Vite
- **Backend**: Node + Express
- **DB**: PostgreSQL (`DATABASE_URL`)

## Desarrollo
### Frontend
```bash
npm install
npm run dev
```

### Backend
Necesitás PostgreSQL y `DATABASE_URL` en el entorno (o un archivo `.env` en `backend-node`).

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
