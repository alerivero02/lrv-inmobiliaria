/**
 * seed.js — Crea el admin y propiedades demo si no existen.
 * Requiere DATABASE_URL (PostgreSQL).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { migrate, get, run } from "../db.js";

await migrate();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lrventaser@gmail.com";
/** Contraseña inicial genérica: cambiala desde el panel (Cambiar contraseña) tras el primer acceso. */
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

const countRow = await get("SELECT COUNT(*)::int AS n FROM listings");
const count = countRow?.n ?? 0;

if (count === 0) {
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
      area_sqm: 180,
      rooms: 4,
      price: 12500000,
      currency: "ARS",
      has_garage: 1,
      has_garden: 1,
      has_pool: 0,
      extras_note: "Aire acondicionado, calefacción central, cochera cubierta",
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
      area_sqm: 55,
      rooms: 2,
      price: 85000,
      currency: "ARS",
      has_garage: 0,
      has_garden: 0,
      has_pool: 0,
      extras_note: "Incluye expensas, calefacción central",
    },
    {
      title: "Terreno en Chilecito — consultar precio",
      description:
        "Lote amplio en barrio en desarrollo, todos los servicios. Ideal para construir vivienda o invertir.",
      property_type: "terreno",
      status: "active",
      operation: "venta",
      city: "Chilecito",
      address: "Barrio Nuevo Norte",
      area_sqm: 300,
      rooms: null,
      price: null,
      currency: "ARS",
      has_garage: 0,
      has_garden: 0,
      has_pool: 0,
      extras_note: null,
    },
  ];

  for (const d of demos) {
    await run(
      `
    INSERT INTO listings
    (title,description,property_type,status,operation,
     city,address,area_sqm,rooms,price,currency,
     has_garage,has_garden,has_pool,extras_note,images)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'[]')
    RETURNING id
  `,
      d.title,
      d.description,
      d.property_type,
      d.status,
      d.operation,
      d.city,
      d.address,
      d.area_sqm,
      d.rooms ?? null,
      d.price ?? null,
      d.currency,
      d.has_garage,
      d.has_garden,
      d.has_pool,
      d.extras_note ?? null,
    );
  }
  console.log(`✅  ${demos.length} propiedades demo creadas`);
} else {
  console.log(`ℹ️   Ya existen ${count} propiedad(es), no se agregaron demos`);
}

console.log("\n🚀  Seed completado. Iniciá el servidor con:  npm start\n");
process.exit(0);
