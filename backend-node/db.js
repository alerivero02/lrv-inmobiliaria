/**
 * db.js — SQLite via node:sqlite (built-in Node 22.5+, estable en Node 24)
 * No requiere dependencias externas ni compilación.
 */
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "lrv.db");

const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function migrate() {
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
  // Migrations for existing databases
  try {
    db.exec("ALTER TABLE listings ADD COLUMN commission_buyer  REAL DEFAULT 3.0");
  } catch {}
  try {
    db.exec("ALTER TABLE listings ADD COLUMN commission_seller REAL DEFAULT 3.0");
  } catch {}
  // Backfill NULL commissions on rows that existed before the column was added
  db.exec("UPDATE listings SET commission_buyer  = 3.0 WHERE commission_buyer  IS NULL");
  db.exec("UPDATE listings SET commission_seller = 3.0 WHERE commission_seller IS NULL");
  // Normalize legacy Spanish status values in visits
  db.exec("UPDATE visits SET status = 'pending'   WHERE status IN ('pendiente')");
  db.exec("UPDATE visits SET status = 'confirmed' WHERE status IN ('confirmada')");
  db.exec("UPDATE visits SET status = 'rejected'  WHERE status IN ('rechazada')");
  db.exec("UPDATE visits SET status = 'cancelled' WHERE status IN ('cancelada')");
  // Normalize legacy Spanish type values in transactions
  db.exec("UPDATE transactions SET type = 'income'  WHERE type = 'ingreso'");
  db.exec("UPDATE transactions SET type = 'expense' WHERE type = 'egreso'");
  console.log(`✅  Base de datos lista → ${DB_PATH}`);
}

export default db;
