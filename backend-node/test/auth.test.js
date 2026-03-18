import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";

function uniquePath() {
  return `./test-db-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`;
}

test("POST /api/auth/login devuelve token con credenciales válidas", async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.DB_PATH = uniquePath();

  const { migrate, default: db } = await import("../db.js");
  const { createApp } = await import("../app.js");
  migrate();

  const email = "admin@lrv.test";
  const password = "Admin123!";
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (email, hashed_password, role) VALUES (?,?,?)").run(
    email,
    hashed,
    "admin",
  );

  const app = createApp();
  const res = await request(app).post("/api/auth/login").send({ username: email, password });

  assert.equal(res.status, 200);
  assert.ok(res.body?.access_token);
  assert.equal(res.body?.token_type, "bearer");
});
