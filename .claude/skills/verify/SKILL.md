---
name: verify
description: Build, run, and end-to-end verify the Stag portal (Next.js 16 + SQLite). Use when confirming changes work in the running app.
---

# Verifying the Stag portal

## Build & run

```powershell
npm run build                 # Turbopack; typecheck included (~5s)
Remove-Item -Recurse -Force .\data   # optional: pristine DB (it recreates itself)
npm run create-user -- client@acmeplumbing.com "TestPortal!234"
npm run start                 # prod server on :3000 (run in background)
```

`.env.local` needs at least `JWT_SECRET` (any string in dev), plus
`CLIENT_NAME` / `CLIENT_DOMAIN` / `APP_URL` for branding, CORS and OAuth.

## API smoke (curl)

Seed a captured lead / probe the public surface:

```powershell
# PowerShell mangles inline JSON quotes — put the body in a file and use --data "@file"
curl.exe -s -X POST http://localhost:3000/api/leads/capture -H "Content-Type: application/json" -H "Origin: https://acmeplumbing.com" --data "@lead.json"
curl.exe -s http://localhost:3000/api/posts
curl.exe -s http://localhost:3000/api/cron/sync            # 401 without bearer
```

## Browser E2E

`node scripts/e2e-smoke.mjs` — drives login → kanban drag → manual lead with
deal value → revenue stat → blog publish with markdown preview → public API →
CSV export (authed + anonymous) → tickets → settings → password change
(25 steps, screenshots beside the script). Uses system Edge:
`chromium.launch({ channel: "msedge" })`, no browser download. Playwright is
a devDependency.

Reset the DB + restart the server before a full run: the login rate limiter
(5/15min, in-memory) and leftover rows otherwise bleed into assertions.

### Gotchas learned the hard way

- **Never click `button[type=submit]` unscoped on dashboard pages** — the
  sidebar's "Sign out" button matches first and logs the session out (the
  cookie vanishes and every later step 307s to `/`). Click by accessible
  name: `page.getByRole("button", { name: "Add lead" })`.
- `[role="alert"]` also matches Next's empty route announcer — use
  `p[role="alert"]` for form errors.
- React 19 resets uncontrolled form fields after a server-action round-trip —
  refill *all* fields before resubmitting a form.
- `text=/api/...` in a Playwright selector parses as a regex (leading `/`);
  use `getByText("/api/...")`.
- Playwright can't see Cookie/Set-Cookie headers via `request.headers()` in
  headless Edge — assert on `context().cookies()` (the jar) instead.
- The kanban columns expose `data-stage="new|contacted|won|lost"`; drag by
  the card's grip `button[aria-label="Drag <name>"]` with `page.mouse`.
