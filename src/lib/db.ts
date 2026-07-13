import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  value REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_console (
  id INTEGER PRIMARY KEY DEFAULT 1,
  refresh_token TEXT,
  site_url TEXT,
  connected_at TIMESTAMP,
  last_sync TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gsc_cache (
  range TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  fetched_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
`;

function initDb(): Database.Database {
  const dbPath = env.databasePath;
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);

  seedAdminUser(db);
  return db;
}

/** Idempotent column additions for databases created before a feature shipped. */
function migrate(db: Database.Database) {
  const leadColumns = (
    db.prepare("PRAGMA table_info(leads)").all() as Array<{ name: string }>
  ).map((col) => col.name);
  if (!leadColumns.includes("value")) {
    db.exec("ALTER TABLE leads ADD COLUMN value REAL");
  }
}

/**
 * Single-user portal: on first boot, create the portal user from
 * PORTAL_ADMIN_EMAIL / PORTAL_ADMIN_PASSWORD if no user exists yet.
 * (Alternatively run `npm run create-user`.)
 */
function seedAdminUser(db: Database.Database) {
  const email = process.env.PORTAL_ADMIN_EMAIL;
  const password = process.env.PORTAL_ADMIN_PASSWORD;
  if (!email || !password) return;

  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as {
    n: number;
  };
  if (count.n > 0) return;

  db.prepare(
    "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
  ).run(crypto.randomUUID(), email.toLowerCase().trim(), bcrypt.hashSync(password, 10));
}

// Reuse one connection across HMR reloads / route invocations.
const globalForDb = globalThis as unknown as { __stagDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__stagDb) {
    globalForDb.__stagDb = initDb();
  }
  return globalForDb.__stagDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}
