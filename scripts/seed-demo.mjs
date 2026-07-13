#!/usr/bin/env node
// Seed realistic demo data (leads, posts, tickets) for demos and UX review.
// Usage: node scripts/seed-demo.mjs
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const db = new Database(process.env.DATABASE_URL ?? "./data/portal.db");

// Bootstrap the tables this script writes to, so seeding works on a fresh
// database before the app has ever booted.
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
  source TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'new', notes TEXT, value REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, subject TEXT NOT NULL, description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
const leadCols = db.prepare("PRAGMA table_info(leads)").all().map((c) => c.name);
if (!leadCols.includes("value")) db.exec("ALTER TABLE leads ADD COLUMN value REAL");

const daysAgo = (d, h = 0) =>
  new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();

const leads = [
  ["Jenna Kowalski", "jenna.k@gmail.com", "555-0134", "website_form", "new",
    "From website form:\nHi, my kitchen sink has been draining slowly for a week and now there's a smell. Can someone come take a look?", null, 0, 2],
  ["Marcus Webb", null, "555-0187", "phone_call", "new",
    "Called about a leaking outdoor spigot. Available weekday mornings.", null, 0, 5],
  ["Diane Foster", null, "555-0119", "gbp", "contacted",
    "Found us on Google. Left voicemail 7/10, she called back — scheduling estimate for water softener install.", 3100, 1, 3],
  ["Tom Nguyen", "tom.nguyen@outlook.com", null, "website_form", "contacted",
    "From website form:\nNeed a quote for repiping a 1960s ranch house, ~1400 sq ft.\n\nSent ballpark range, waiting on reply.", 8500, 3, 0],
  ["Rachel Adams", "radams@bluepine.co", "555-0170", "website_form", "won",
    "Water heater replacement — closed $2,400. Install scheduled 7/15.", 2400, 6, 0],
  ["Gary Simmons", null, "555-0142", "phone_call", "lost",
    "Price shopping for drain cleaning, went with a cheaper outfit.", 450, 9, 0],
];

const insertLead = db.prepare(
  `INSERT INTO leads (id, name, email, phone, source, stage, notes, value, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const [name, email, phone, source, stage, notes, value, d, h] of leads) {
  insertLead.run(randomUUID(), name, email, phone, source, stage, notes, value, daysAgo(d, h), daysAgo(d, h));
}

const posts = [
  ["5 Signs Your Water Heater Is Failing", "5-signs-your-water-heater-is-failing", "published", 12,
    "## Don't wait for the cold shower\n\nMost water heaters give plenty of warning before they quit. Here's what to watch for:\n\n1. **Rusty water** from hot taps only\n2. **Rumbling or popping** sounds from sediment buildup\n3. **Water pooling** around the base\n4. **Inconsistent temperature** even after adjusting the thermostat\n5. **Age** — most tanks last 8–12 years\n\nIf you're seeing two or more of these, it's worth a professional look before it becomes an emergency."],
  ["Winterizing Your Pipes: A Checklist", "winterizing-your-pipes-a-checklist", "published", 5,
    "## Before the first freeze\n\n- Disconnect and drain garden hoses\n- Shut off and drain outdoor spigots\n- Insulate pipes in unheated spaces (garage, crawl space)\n- Keep cabinet doors open under sinks on exterior walls during cold snaps\n- Know where your main shutoff valve is\n\nA burst pipe averages $5,000 in damage. An afternoon of prevention is cheaper."],
  ["Tankless vs. Tank Water Heaters: Which Is Right for You?", "tankless-vs-tank-water-heaters", "draft", 1,
    "## The short answer\n\nIt depends on your household size, gas line capacity, and budget. Draft — needs the cost comparison table before publishing."],
];

const insertPost = db.prepare(
  `INSERT INTO posts (id, title, slug, content, status, published_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const [title, slug, status, d, content] of posts) {
  const at = daysAgo(d);
  insertPost.run(randomUUID(), title, slug, content, status, status === "published" ? at : null, at, at);
}

const tickets = [
  ["Homepage hero image looks blurry on mobile", "Noticed on my iPhone 13 — the big photo at the top looks pixelated when the page first loads, then sharpens after a second.", "medium", "open", 0],
  ["Update service area list", "We now cover Maple Grove and Brooklyn Park — can you add those to the service areas page?", "low", "in_progress", 2],
  ["Contact form success message typo", "It says 'We'll be in tuch' after submitting the form.", "low", "resolved", 8],
];

const insertTicket = db.prepare(
  `INSERT INTO tickets (id, subject, description, priority, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
for (const [subject, description, priority, status, d] of tickets) {
  insertTicket.run(randomUUID(), subject, description, priority, status, daysAgo(d), daysAgo(d));
}

console.log(`Seeded ${leads.length} leads, ${posts.length} posts, ${tickets.length} tickets.`);
