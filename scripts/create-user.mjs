#!/usr/bin/env node
// Create (or reset the password of) the single portal user.
// Usage: npm run create-user -- <email> <password>
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run create-user -- <email> <password>");
  process.exit(1);
}

const dbPath = process.env.DATABASE_URL ?? "./data/portal.db";
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

const normalized = email.toLowerCase().trim();
const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);

if (existing) {
  db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(hash, normalized);
  console.log(`Updated password for ${normalized}`);
} else {
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(
    randomUUID(),
    normalized,
    hash
  );
  console.log(`Created portal user ${normalized}`);
}
