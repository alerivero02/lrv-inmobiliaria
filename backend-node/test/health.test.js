import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

test("GET /api/health responde ok", async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  if (!process.env.DATABASE_URL) {
    console.warn("[test] Omitido: definí DATABASE_URL para tests de integración.");
    return;
  }

  const { migrate } = await import("../db.js");
  const { createApp } = await import("../app.js");
  await migrate();
  const app = createApp();

  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});
