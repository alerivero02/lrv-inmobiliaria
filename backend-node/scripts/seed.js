/**
 * seed.js — Crea el admin y propiedades demo si no existen.
 * SQLite (local) o PostgreSQL (DATABASE_URL).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { migrate, get, run } from "../db.js";

await migrate();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lrventaser@gmail.com";
/** Contraseña inicial genérica: cambiala desde el panel tras el primer acceso. */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "LRV_Admin_2026!";

const existing = await get("SELECT id FROM users WHERE email = ?", ADMIN_EMAIL);
if (!existing) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  await run(
    "INSERT INTO users (email, hashed_password, role, email_verified) VALUES (?, ?, 'admin', 1) RETURNING id",
    ADMIN_EMAIL,
    hash,
  );
  console.log(`✅  Admin creado: ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
} else {
  console.log(`ℹ️   Admin ya existe: ${ADMIN_EMAIL}`);
}

const countRow = await get("SELECT CAST(COUNT(*) AS INTEGER) AS n FROM listings");
const count = countRow?.n ?? 0;

const demos = [
  {
    title: "Casa amplia en Zona Sur",
    description:
      "Hermosa casa familiar en zona residencial tranquila. Excelente estado, muy luminosa y bien distribuida. Ideal para familia numerosa. A metros de colegios y comercios.",
    property_type: "casa",
    status: "active",
    operation: "venta",
    city: "La Rioja Capital",
    address: "Av. Rivadavia 1250, Barrio Zona Sur",
    lat: -29.421,
    lng: -66.862,
    area_sqm: 180,
    rooms: 4,
    price: 125000000,
    currency: "ARS",
    has_garage: 1,
    has_garden: 1,
    has_pool: 0,
    featured: 1,
    extras_note: "Aire acondicionado, calefacción central, cochera cubierta",
    images: ["/images/services/casas.webp"],
  },
  {
    title: "Departamento céntrico 2 ambientes",
    description:
      "Moderno departamento en pleno centro. Ideal para profesionales o inversión. Excelente estado, edificio con ascensor y portería.",
    property_type: "departamento",
    status: "active",
    operation: "alquiler",
    city: "La Rioja Capital",
    address: "San Martín 450, Piso 3",
    lat: -29.413,
    lng: -66.856,
    area_sqm: 55,
    rooms: 2,
    price: 285000,
    currency: "ARS",
    has_garage: 0,
    has_garden: 0,
    has_pool: 0,
    has_balcony: 1,
    featured: 1,
    extras_note: "Incluye expensas, calefacción central",
    images: ["/images/services/departamentos.webp"],
  },
  {
    title: "Terreno en Chilecito — consultar precio",
    description:
      "Lote amplio en barrio en desarrollo, todos los servicios. Ideal para construir vivienda o invertir.",
    property_type: "lotes_terrenos",
    investment_tag: null,
    status: "active",
    operation: "venta",
    city: "Chilecito",
    address: "Barrio Nuevo Norte",
    lat: -29.165,
    lng: -67.497,
    area_sqm: 300,
    rooms: null,
    price: null,
    currency: "ARS",
    has_garage: 0,
    has_garden: 0,
    has_pool: 0,
    featured: 0,
    extras_note: null,
    images: ["/images/services/terrenos.webp"],
  },
  {
    title: "Casa con pileta en Barrio Sur",
    description:
      "Residencia de categoría con amplio parque, quincho y pileta. Living comedor integrado, cocina equipada y suite principal con vestidor.",
    property_type: "casa",
    status: "active",
    operation: "venta",
    city: "La Rioja Capital",
    address: "Los Algarrobos 890",
    lat: -29.428,
    lng: -66.851,
    area_sqm: 240,
    rooms: 5,
    price: 198000000,
    currency: "ARS",
    has_garage: 1,
    has_garden: 1,
    has_pool: 1,
    has_quincho: 1,
    garage_count: 2,
    featured: 1,
    extras_note: "Alarma, riego automático, termotanque solar",
    images: ["/images/services/casas.webp", "/images/brand/hero.webp"],
  },
  {
    title: "Departamento 3 ambientes con cochera",
    description:
      "Amplio departamento en edificio moderno. Balcón al frente, cocina separada y dos dormitorios con placard. Cochera fija incluida.",
    property_type: "departamento",
    status: "active",
    operation: "venta",
    city: "La Rioja Capital",
    address: "Av. Facundo Quiroga 2100",
    lat: -29.408,
    lng: -66.848,
    area_sqm: 78,
    rooms: 3,
    price: 92000000,
    currency: "ARS",
    has_garage: 1,
    has_balcony: 1,
    featured: 0,
    extras_note: "Expensas moderadas, sum y laundry",
    images: ["/images/services/departamentos.webp"],
  },
  {
    title: "Lote en esquina — Villa Unión",
    description:
      "Terreno en esquina con excelente exposición. Servicios de luz, agua y gas en la cuadra. Documentación al día.",
    property_type: "lotes_terrenos",
    investment_tag: null,
    status: "active",
    operation: "venta",
    city: "Villa Unión",
    address: "Av. San Martín esq. Sarmiento",
    lat: -29.315,
    lng: -68.225,
    area_sqm: 420,
    rooms: null,
    price: 18500000,
    currency: "ARS",
    featured: 0,
    extras_note: "Escritura inmediata",
    images: ["/images/services/terrenos.webp"],
  },
  {
    title: "Finca productiva en Famatina",
    description:
      "Campo con casa principal, galpón y monte de olivos. Acceso por ruta pavimentada. Oportunidad para producción o descanso.",
    property_type: "lotes_terrenos",
    investment_tag: "finca",
    status: "active",
    operation: "venta",
    city: "Famatina",
    address: "Ruta Provincial 40, Km 12",
    lat: -28.92,
    lng: -67.52,
    area_sqm: 45000,
    rooms: 3,
    price: null,
    currency: "ARS",
    has_garden: 1,
    featured: 0,
    extras_note: "Consultar superficie cultivable y agua",
    images: ["/images/services/fincas.webp"],
  },
  {
    title: "Local comercial sobre peatonal",
    description:
      "Local a la calle con vidriera amplia y depósito trasero. Zona de alto tránsito, ideal gastronomía o retail.",
    property_type: "casa",
    investment_tag: "local_comercial",
    status: "active",
    operation: "alquiler",
    city: "La Rioja Capital",
    address: "Peatonal Mariano Moreno 320",
    lat: -29.414,
    lng: -66.857,
    area_sqm: 95,
    rooms: 1,
    price: 450000,
    currency: "ARS",
    featured: 0,
    extras_note: "Contrato a 24 meses, IVA no incluido",
    images: ["/images/services/departamentos.webp"],
  },
];

if (count === 0) {
  for (const d of demos) {
    await run(
      `
    INSERT INTO listings
    (title,description,property_type,investment_tag,status,operation,
     city,address,province,lat,lng,area_sqm,rooms,price,currency,
     has_garage,has_garden,has_pool,has_balcony,has_quincho,garage_count,featured,extras_note,images)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    RETURNING id
  `,
      d.title,
      d.description,
      d.property_type,
      d.investment_tag ?? null,
      d.status,
      d.operation,
      d.city,
      d.address,
      "La Rioja",
      d.lat ?? null,
      d.lng ?? null,
      d.area_sqm,
      d.rooms ?? null,
      d.price ?? null,
      d.currency,
      d.has_garage ?? 0,
      d.has_garden ?? 0,
      d.has_pool ?? 0,
      d.has_balcony ?? 0,
      d.has_quincho ?? 0,
      d.garage_count ?? null,
      d.featured ?? 0,
      d.extras_note ?? null,
      JSON.stringify(d.images ?? []),
    );
  }
  console.log(`✅  ${demos.length} propiedades demo creadas`);
} else {
  console.log(`ℹ️   Ya existen ${count} propiedad(es), no se agregaron demos`);
}

console.log("\n🚀  Seed completado.");
console.log(`   Admin:  ${ADMIN_EMAIL}`);
console.log(`   Pass:   ${ADMIN_PASSWORD}`);
console.log(`   Panel:  ${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/login\n`);
process.exit(0);
