import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import listingsRouter from "./routes/listings.js";
import { getUploadsDir } from "./uploadsDir.js";
import visitsRouter from "./routes/visits.js";
import transactionsRouter from "./routes/transactions.js";
import dashboardRouter from "./routes/dashboard.js";
import notificationsRouter from "./routes/notifications.js";

export function createApp() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const UPLOADS_DIR = getUploadsDir();

  // Crear carpeta de uploads si no existe
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const app = express();

  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

  const trustProxy = process.env.TRUST_PROXY === "1";
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // sirve /uploads; ajustar si se endurece más adelante
      frameguard: { action: "deny" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: trustProxy ? { maxAge: 15552000, includeSubDomains: true } : false,
      // Helmet por defecto: img-src 'self' data: — bloquea HTTPS externo (CDN, fotos absolutas) y blob:
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "blob:", "https:"],
        },
      },
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
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const usersApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth/login", loginLimiter);
  app.use(
    "/api/auth/forgot-password",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: Number(process.env.FORGOT_PASSWORD_HOURLY_LIMIT) || 8,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersApiLimiter, usersRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/visits", visitsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/notifications", notificationsRouter);

  app.get("/api/health", async (_req, res) => {
    let uploadsWritable = false;
    try {
      const testFile = path.join(UPLOADS_DIR, `.health-${Date.now()}`);
      await fs.promises.writeFile(testFile, "ok", "utf8");
      await fs.promises.unlink(testFile);
      uploadsWritable = true;
    } catch {
      uploadsWritable = false;
    }
    return res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uploads_writable: uploadsWritable,
    });
  });

  const distStatic = process.env.FRONTEND_DIST
    ? path.resolve(process.env.FRONTEND_DIST)
    : path.join(__dirname, "..", "dist");
  const serveStatic = process.env.SERVE_STATIC === "1" && fs.existsSync(distStatic);

  if (!serveStatic) {
    app.get("/", (_req, res) =>
      res.json({
        ok: true,
        service: "lrv-backend",
        health: "/api/health",
        timestamp: new Date().toISOString(),
      }),
    );
  } else {
    app.use(express.static(distStatic));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ detail: "Ruta no encontrada" });
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        return res.status(404).json({ detail: "Ruta no encontrada" });
      }
      return res.sendFile(path.join(distStatic, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  if (!serveStatic) {
    app.use((_req, res) => res.status(404).json({ detail: "Ruta no encontrada" }));
  }

  // Error handler centralizado
  app.use((err, _req, res, _next) => {
    const msg = typeof err?.message === "string" ? err.message : "Error interno";
    const status = msg.startsWith("CORS:") ? 403 : 500;
    if (status === 500) console.error("[error]", err);
    return res.status(status).json({ detail: msg });
  });

  return app;
}
