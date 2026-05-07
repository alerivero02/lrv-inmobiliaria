import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";

test("PATCH /api/listings/:id no duplica garage_count cuando se desactiva garaje", async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  if (!process.env.DATABASE_URL) {
    console.warn("[test] Omitido: definí DATABASE_URL para tests de integración.");
    return;
  }

  const { migrate, run, get } = await import("../db.js");
  const { createApp } = await import("../app.js");
  await migrate();

  const email = `admin-listings-${Date.now()}@lrv.test`;
  const password = "Admin123!";
  const hashed = bcrypt.hashSync(password, 10);
  await run("INSERT INTO users (email, hashed_password, role) VALUES (?,?,?) RETURNING id", email, hashed, "admin");

  const listingInsert = await run(
    `
    INSERT INTO listings (title, province, price, currency, has_garage, garage_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `,
    `Listing test ${Date.now()}`,
    "La Rioja",
    150000,
    "USD",
    1,
    2,
    "active",
  );
  const listingId = Number(listingInsert.lastInsertRowid);

  const app = createApp();
  const loginRes = await request(app).post("/api/auth/login").send({ username: email, password });
  assert.equal(loginRes.status, 200);
  const token = loginRes.body?.access_token;
  assert.ok(token);

  const patchRes = await request(app)
    .patch(`/api/listings/${listingId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      has_garage: false,
      garage_count: 3,
    });

  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.body?.has_garage, false);
  assert.equal(patchRes.body?.garage_count, null);

  const updated = await get("SELECT has_garage, garage_count FROM listings WHERE id = ?", listingId);
  assert.equal(Boolean(updated?.has_garage), false);
  assert.equal(updated?.garage_count, null);
});
