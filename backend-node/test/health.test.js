import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

function uniquePath() {
  return `./test-db-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`;
}

test("GET /api/health responde ok", async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.DB_PATH = uniquePath();

  const { migrate } = await import("../db.js");
  const { createApp } = await import("../app.js");
  migrate();
  const app = createApp();

  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});
