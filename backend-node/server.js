import "dotenv/config";
import { migrate, isPostgres } from "./db.js";
import { createApp } from "./app.js";

await migrate();

if (process.env.NODE_ENV === "production" && !isPostgres) {
  console.warn(
    "\n⚠️  PRODUCCIÓN: no hay DATABASE_URL → el backend usa SQLite en el disco del contenedor (se pierde al redeploy).\n" +
      "   En Railway: servicio de la app → Variables → agregar REFERENCIA a la variable DATABASE_URL del servicio Postgres.\n",
  );
} else if (isPostgres) {
  console.log("✅  Conectado a PostgreSQL (DATABASE_URL presente)\n");
}

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  const publicBase =
    process.env.FRONTEND_URL?.trim().replace(/\/$/, "") ||
    process.env.HOST?.trim().replace(/\/$/, "") ||
    `http://127.0.0.1:${PORT}`;
  console.log(`\n🚀  LRV Backend → puerto ${PORT}`);
  console.log(`   Health:  ${publicBase}/api/health`);
  console.log(`   Admin:   ${publicBase}/admin/login\n`);
});
