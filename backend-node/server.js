import "dotenv/config";
import { migrate, isPostgres } from "./db.js";
import { createApp } from "./app.js";
import { getUploadsDir } from "./uploadsDir.js";

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
const uploadsDirResolved = getUploadsDir();

const server = app.listen(PORT, () => {
  const publicBase =
    process.env.FRONTEND_URL?.trim().replace(/\/$/, "") ||
    process.env.HOST?.trim().replace(/\/$/, "") ||
    `http://127.0.0.1:${PORT}`;
  console.log(`\n🚀  LRV Backend → puerto ${PORT}`);
  console.log(`   Health:  ${publicBase}/api/health`);
  console.log(`   Admin:   ${publicBase}/admin/login`);
  console.log(
    `   Uploads: ${uploadsDirResolved} (Railway: volumen persistente montado aquí; ver DEPLOY.md)\n`,
  );
});

function shutdown(signal) {
  console.log(`\n${signal}: cierre ordenado del servidor…`);
  server.close(() => {
    console.log("HTTP cerrado.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Timeout de cierre, saliendo con código 1.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
