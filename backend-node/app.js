import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import listingsRouter from "./routes/listings.js";
import visitsRouter from "./routes/visits.js";
import transactionsRouter from "./routes/transactions.js";
import dashboardRouter from "./routes/dashboard.js";
import notificationsRouter from "./routes/notifications.js";

export function createApp() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const UPLOADS_DIR = path.join(__dirname, "uploads");

  // Crear carpeta de uploads si no existe
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const app = express();

  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: false, // sirve /uploads; ajustar si se endurece más adelante
    }),
  );

  const corsOriginsEnv = process.env.CORS_ORIGINS || "";
  const corsAllowList = corsOriginsEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        // Permitir requests sin Origin (curl/health checks, same-origin, etc.)
        if (!origin) return cb(null, true);
        if (corsAllowList.length === 0) return cb(null, true); // default: abierto (dev)
        if (corsAllowList.includes(origin)) return cb(null, true);
        return cb(new Error("CORS: origen no permitido"));
      },
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth/login", loginLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/visits", visitsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/notifications", notificationsRouter);

  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() }),
  );

  // 404 genérico
  app.use((_req, res) => res.status(404).json({ detail: "Ruta no encontrada" }));

  // Error handler centralizado
  app.use((err, _req, res, _next) => {
    const msg = typeof err?.message === "string" ? err.message : "Error interno";
    const status = msg.startsWith("CORS:") ? 403 : 500;
    if (status === 500) console.error("[error]", err);
    return res.status(status).json({ detail: msg });
  });

  return app;
}
