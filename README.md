# Stag Client Portal

A per-client marketing dashboard deployed alongside the client's website.
One portal instance per client, each with its own SQLite database and env
config. Clients log in to see their **leads**, manage their **blog**, view
**search analytics**, and submit **maintenance tickets**.

Built with Next.js 16 (App Router), SQLite (better-sqlite3), Tailwind CSS v4,
dnd-kit and Recharts. Dark theme, mobile friendly.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in at least JWT_SECRET
npm run create-user -- client@example.com their-password
npm run dev
```

Open http://localhost:3000 and sign in. (Instead of `create-user` you can set
`PORTAL_ADMIN_EMAIL` / `PORTAL_ADMIN_PASSWORD` — the user is seeded on first
boot when the users table is empty.)

The database file is created automatically at `DATABASE_URL`
(default `./data/portal.db`), including schema.

## Features

| Area | Details |
| --- | --- |
| **Leads** | Kanban board (New → Contacted → Won → Lost) with drag & drop, lead details + notes, deal values that roll up into a "revenue won" stat, manual entry for phone/GBP leads, auto-capture from the website form, CSV export |
| **Blog** | Markdown editor with live preview, auto-slugs and draft/publish; published posts served to the public site via API |
| **Analytics** | Google Search Console: clicks, impressions, CTR, position, click trend chart, top queries/pages, 7/30/90-day ranges |
| **Tickets** | Subject/description/priority, status tracking, instant Discord notification to the Stag team |
| **Auth** | Single portal user, bcrypt password, JWT session cookie (7 days), rate-limited login |

## Public API (consumed by the client's website)

```
GET  /api/posts?status=published   → { posts: [...] }   published posts only
GET  /api/posts?slug=my-post       → { post: {...} }    single published post
POST /api/leads/capture            → { ok, id }         contact form submissions
      body: { name, email?, phone?, message?, source?: "website_form" }
```

CORS on both endpoints is restricted to `CLIENT_DOMAIN`. Server-to-server
calls (no Origin header) always work. Example website form handler:

```js
await fetch("https://portal.acmeplumbing.com/api/leads/capture", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, phone, message }),
});
```

## Search Console setup (per client)

1. In Google Cloud Console, create an OAuth client (Web application) with
   redirect URI `{APP_URL}/api/auth/google/callback`; enable the
   **Search Console API**.
2. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `APP_URL`.
3. Client hits **Settings → Connect Search Console**, grants read-only access
   (`webmasters.readonly`), picks the property to track.
4. Data refreshes via the **Refresh** button, or schedule a daily ping to
   `GET /api/cron/sync` with header `Authorization: Bearer {CRON_SECRET}`
   (e.g. Vercel Cron). The refresh token is stored AES-256-GCM encrypted.

## Environment variables

See [.env.example](.env.example) for the full annotated list:
`JWT_SECRET` (required), `CLIENT_NAME`, `CLIENT_DOMAIN`, `APP_URL`,
`DATABASE_URL`, `PORTAL_ADMIN_EMAIL/PASSWORD`, `DISCORD_WEBHOOK_URL`,
`GOOGLE_CLIENT_ID/SECRET`, `CRON_SECRET`.

## Deployment notes

- **One deployment per client** (separate Vercel project or a small VPS),
  domain like `portal.client-domain.com`, env vars set per instance.
- SQLite needs a **persistent writable disk**. On Vercel's serverless
  filesystem this won't persist — either attach a persistent volume
  (Fly.io/Railway/VPS all work out of the box) or swap the data layer to
  Turso (`@libsql/client`); the SQL in `src/lib/data/*` is standard SQLite,
  and swapping means replacing `src/lib/db.ts`'s better-sqlite3 handle.
- The login rate limiter is in-memory (fine for single-instance portals).

## Project layout

```
src/
  proxy.ts               auth redirects (Next 16's middleware)
  lib/                   db, session (jose), DAL, crypto, rate limit, CORS
    data/                leads / posts / tickets / gsc / discord
  app/
    page.tsx             login (portal root)
    actions/             server actions (auth, leads, posts, tickets, gsc, settings)
    api/                 public capture + posts, Google OAuth, cron sync
    dashboard/           overview, leads kanban, blog, analytics, tickets, settings
scripts/create-user.mjs  create/reset the portal user
```
