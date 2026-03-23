import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";

test("POST /api/auth/login devuelve token con credenciales válidas", async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  if (!process.env.DATABASE_URL) {
    console.warn("[test] Omitido: definí DATABASE_URL para tests de integración.");
    return;
  }

  const { migrate, run, get } = await import("../db.js");
  const { createApp } = await import("../app.js");
  await migrate();

  const email = `admin-${Date.now()}@lrv.test`;
  const password = "Admin123!";
  const hashed = bcrypt.hashSync(password, 10);
  await run("INSERT INTO users (email, hashed_password, role) VALUES (?,?,?) RETURNING id", email, hashed, "admin");

  const app = createApp();
  const res = await request(app).post("/api/auth/login").send({ username: email, password });

  assert.equal(res.status, 200);
  assert.ok(res.body?.access_token);
  assert.equal(res.body?.token_type, "bearer");
});
