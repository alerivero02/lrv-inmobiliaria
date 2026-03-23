/**
 * PostgreSQL cuando existe DATABASE_URL (Railway, Docker, etc.).
 * SQLite (node:sqlite) si no hay DATABASE_URL — desarrollo local sin Postgres.
 */
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isPostgres = Boolean(process.env.DATABASE_URL?.trim());

export function sqlToPg(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

let pool;
let sqliteDb;

function getPool() {
  if (!pool) {
    const conn = process.env.DATABASE_URL;
    if (!conn) throw new Error("getPool() sin DATABASE_URL");
    pool = new Pool({
      connectionString: conn,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function getSqliteDb() {
  if (!sqliteDb) {
    const DB_PATH = process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.join(__dirname, "lrv.db");
    sqliteDb = new DatabaseSync(DB_PATH);
    sqliteDb.exec("PRAGMA journal_mode = WAL");
    sqliteDb.exec("PRAGMA foreign_keys = ON");
  }
  return sqliteDb;
}

export async function get(sql, ...params) {
  if (isPostgres) {
    const r = await getPool().query(sqlToPg(sql), params);
    return r.rows[0];
  }
  return getSqliteDb().prepare(sql).get(...params);
}

export async function all(sql, ...params) {
  if (isPostgres) {
    const r = await getPool().query(sqlToPg(sql), params);
    return r.rows;
  }
  return getSqliteDb().prepare(sql).all(...params);
}

export async function run(sql, ...params) {
  if (isPostgres) {
    const r = await getPool().query(sqlToPg(sql), params);
    const id = r.rows[0]?.id;
    return {
      changes: r.rowCount ?? 0,
      lastInsertRowid: id != null ? Number(id) : null,
    };
  }
  const db = getSqliteDb();
  const stmt = db.prepare(sql);
  if (/RETURNING\s+id/i.test(sql)) {
    const row = stmt.get(...params);
    return {
      changes: 1,
      lastInsertRowid: row?.id != null ? Number(row.id) : null,
    };
  }
  const info = stmt.run(...params);
  return {
    changes: info.changes,
    lastInsertRowid: Number(info.lastInsertRowid),
  };
}

export async function migratePg() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      email           TEXT    UNIQUE NOT NULL,
      hashed_password TEXT    NOT NULL,
      role            TEXT    DEFAULT 'admin',
      created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id              SERIAL PRIMARY KEY,
      title           TEXT    NOT NULL,
      description     TEXT,
      property_type   TEXT    DEFAULT 'casa',
      status          TEXT    DEFAULT 'active',
      operation       TEXT    DEFAULT 'venta',
      documentation   TEXT,
      address         TEXT,
      city            TEXT,
      province        TEXT    DEFAULT 'La Rioja',
      lat             DOUBLE PRECISION,
      lng             DOUBLE PRECISION,
      location_manual TEXT,
      rooms           INTEGER,
      area_sqm        DOUBLE PRECISION DEFAULT 0,
      price           DOUBLE PRECISION,
      currency        TEXT    DEFAULT 'ARS',
      has_garage      INTEGER DEFAULT 0,
      has_garden      INTEGER DEFAULT 0,
      has_pool        INTEGER DEFAULT 0,
      extras_note     TEXT,
      images          TEXT    DEFAULT '[]',
      view_count        INTEGER DEFAULT 0,
      consult_count     INTEGER DEFAULT 0,
      commission_buyer  DOUBLE PRECISION DEFAULT 3.0,
      commission_seller DOUBLE PRECISION DEFAULT 3.0,
      created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visits (
      id             SERIAL PRIMARY KEY,
      listing_id     INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      name           TEXT    NOT NULL,
      email          TEXT,
      phone          TEXT,
      message        TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      status         TEXT    DEFAULT 'pending',
      created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          SERIAL PRIMARY KEY,
      description TEXT    NOT NULL,
      amount      DOUBLE PRECISION NOT NULL,
      type        TEXT    NOT NULL,
      category    TEXT,
      date        TEXT,
      notes       TEXT,
      listing_id  INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await p.query(`
    DO $$ BEGIN
      ALTER TABLE listings ADD COLUMN commission_buyer DOUBLE PRECISION DEFAULT 3.0;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `);
  await p.query(`
    DO $$ BEGIN
      ALTER TABLE listings ADD COLUMN commission_seller DOUBLE PRECISION DEFAULT 3.0;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `);

  await p.query(`
    UPDATE listings SET commission_buyer = 3.0 WHERE commission_buyer IS NULL;
    UPDATE listings SET commission_seller = 3.0 WHERE commission_seller IS NULL;
    UPDATE visits SET status = 'pending'   WHERE status IN ('pendiente');
    UPDATE visits SET status = 'confirmed' WHERE status IN ('confirmada');
    UPDATE visits SET status = 'rejected'  WHERE status IN ('rechazada');
    UPDATE visits SET status = 'cancelled' WHERE status IN ('cancelada');
    UPDATE transactions SET type = 'income'  WHERE type = 'ingreso';
    UPDATE transactions SET type = 'expense' WHERE type = 'egreso';
  `);

  console.log("✅  Base de datos PostgreSQL lista");
}

function migrateSqlite() {
  const db = getSqliteDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT    UNIQUE NOT NULL,
      hashed_password TEXT    NOT NULL,
      role            TEXT    DEFAULT 'admin',
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT    NOT NULL,
      description     TEXT,
      property_type   TEXT    DEFAULT 'casa',
      status          TEXT    DEFAULT 'active',
      operation       TEXT    DEFAULT 'venta',
      documentation   TEXT,
      address         TEXT,
      city            TEXT,
      province        TEXT    DEFAULT 'La Rioja',
      lat             REAL,
      lng             REAL,
      location_manual TEXT,
      rooms           INTEGER,
      area_sqm        REAL    DEFAULT 0,
      price           REAL,
      currency        TEXT    DEFAULT 'ARS',
      has_garage      INTEGER DEFAULT 0,
      has_garden      INTEGER DEFAULT 0,
      has_pool        INTEGER DEFAULT 0,
      extras_note     TEXT,
      images          TEXT    DEFAULT '[]',
      view_count        INTEGER DEFAULT 0,
      consult_count     INTEGER DEFAULT 0,
      commission_buyer  REAL    DEFAULT 3.0,
      commission_seller REAL    DEFAULT 3.0,
      created_at        TEXT    DEFAULT (datetime('now')),
      updated_at        TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visits (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id     INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      name           TEXT    NOT NULL,
      email          TEXT,
      phone          TEXT,
      message        TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      status         TEXT    DEFAULT 'pending',
      created_at     TEXT    DEFAULT (datetime('now')),
      updated_at     TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      type        TEXT    NOT NULL,
      category    TEXT,
      date        TEXT,
      notes       TEXT,
      listing_id  INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );
  `);
  try {
    db.exec("ALTER TABLE listings ADD COLUMN commission_buyer  REAL DEFAULT 3.0");
  } catch {}
  try {
    db.exec("ALTER TABLE listings ADD COLUMN commission_seller REAL DEFAULT 3.0");
  } catch {}
  db.exec("UPDATE listings SET commission_buyer  = 3.0 WHERE commission_buyer  IS NULL");
  db.exec("UPDATE listings SET commission_seller = 3.0 WHERE commission_seller IS NULL");
  db.exec("UPDATE visits SET status = 'pending'   WHERE status IN ('pendiente')");
  db.exec("UPDATE visits SET status = 'confirmed' WHERE status IN ('confirmada')");
  db.exec("UPDATE visits SET status = 'rejected'  WHERE status IN ('rechazada')");
  db.exec("UPDATE visits SET status = 'cancelled' WHERE status IN ('cancelada')");
  db.exec("UPDATE transactions SET type = 'income'  WHERE type = 'ingreso'");
  db.exec("UPDATE transactions SET type = 'expense' WHERE type = 'egreso'");
  console.log("✅  Base de datos SQLite lista →", process.env.DB_PATH || path.join(__dirname, "lrv.db"));
}

export async function migrate() {
  if (isPostgres) await migratePg();
  else migrateSqlite();
}

const db = {
  prepare(sql) {
    return {
      get: (...params) => get(sql, ...params),
      all: (...params) => all(sql, ...params),
      run: (...params) => run(sql, ...params),
    };
  },
};

export default db;
