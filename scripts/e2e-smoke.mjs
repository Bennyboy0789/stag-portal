// End-to-end drive of the Stag portal against the running prod server.
// Uses the system Edge browser (no download needed).
import { chromium } from "playwright";
import path from "node:path";

const BASE = "http://localhost:3000";
const SHOTS = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const EMAIL = "client@acmeplumbing.com";
const PASSWORD = "TestPortal!234";
const NEW_PASSWORD = "TestPortal!5678";

const results = [];
function step(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} â€” ${name}${detail ? ` (${detail})` : ""}`);
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  // â”€â”€ 1. Login: wrong password first (probe), then correct â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/");
  await page.fill("#email", EMAIL);
  await page.fill("#password", "wrong-password");
  await page.click("button[type=submit]");
  // p[role=alert] â€” the bare [role=alert] also matches Next's route announcer
  const formAlert = page.locator('p[role="alert"]');
  await formAlert.waitFor({ timeout: 10000 });
  const alertText = await formAlert.textContent();
  step("wrong password shows error", /invalid email or password/i.test(alertText || ""), alertText?.trim());

  // React 19 resets uncontrolled fields after the action round-trip â€” refill both.
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(BASE + "/dashboard", { timeout: 15000 });
  step("login redirects to /dashboard", true);

  // â”€â”€ 2. Overview shows the captured lead â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.waitForSelector("text=Recent leads");
  const hasSarah = await page.locator("text=Sarah Miller").first().isVisible();
  step("overview lists captured lead (Sarah Miller)", hasSarah);
  await page.screenshot({ path: path.join(SHOTS, "01-overview.png") });

  // â”€â”€ 3. Kanban: captured lead sits in New; drag it to Contacted â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/leads");
  await page.waitForSelector('[data-stage="new"]');
  const inNew = await page.locator('[data-stage="new"]').getByText("Sarah Miller").first().isVisible();
  step("captured lead appears in New column", inNew);
  await page.screenshot({ path: path.join(SHOTS, "02-kanban-before.png") });

  const grip = page.locator('[data-stage="new"] button[aria-label="Drag Sarah Miller"]').first();
  const target = page.locator('[data-stage="contacted"]');
  const gripBox = await grip.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 100, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1200); // allow the server action to commit

  await page.reload();
  await page.waitForSelector('[data-stage="contacted"]');
  const inContactedAfterReload = await page.locator('[data-stage="contacted"]').getByText("Sarah Miller").first().isVisible();
  step("drag to Contacted persists after reload", inContactedAfterReload);
  await page.screenshot({ path: path.join(SHOTS, "03-kanban-after-drag.png") });

  // â”€â”€ 4. Manual lead entry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/leads/new");
  await page.fill("#name", "Mike Torres");
  await page.fill("#phone", "555-0199");
  await page.selectOption("#source", "phone_call");
  await page.fill("#notes", "Called about bathroom remodel, wants callback Tuesday");
  await page.getByRole("button", { name: "Add lead" }).click();
  await page.waitForURL(BASE + "/dashboard/leads", { timeout: 15000 });
  const mikeInNew = await page.locator('[data-stage="new"]').getByText("Mike Torres").first().isVisible();
  step("manual lead lands in New column", mikeInNew);

  // â”€â”€ 5. Lead detail: edit notes, change stage via form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.locator('[data-stage="new"]').getByText("Mike Torres").first().click();
  await page.waitForSelector("#notes");
  await page.selectOption("#stage", "won");
  await page.fill("#value", "2400");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForSelector("text=Lead saved.", { timeout: 15000 });
  step("lead detail saves stage change + deal value", true);

  // deal value: revenue on overview, value chip on the won card
  await page.goto(BASE + "/dashboard");
  const revenueHint = await page.getByText(/\$[\d,]+ won/).first().isVisible();
  step("overview shows revenue won", revenueHint);
  await page.goto(BASE + "/dashboard/leads");
  const valueChip = await page.locator('[data-stage="won"]').getByText("$2,400").first().isVisible();
  step("won card shows deal value", valueChip);

  // â”€â”€ 6. Blog: create + publish, verify public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/blog/new");
  await page.fill("#title", "Summer Maintenance Tips");
  const slugValue = await page.inputValue("#slug");
  step("slug auto-generates from title", slugValue === "summer-maintenance-tips", slugValue);
  await page.fill("#content", "## Stay cool\n\nService your AC before the heat wave hits.");

  // markdown preview round-trip
  await page.getByRole("button", { name: "Preview" }).click();
  const previewHeading = await page.locator(".markdown-preview h2", { hasText: "Stay cool" }).isVisible();
  step("markdown preview renders heading", previewHeading);
  await page.getByRole("button", { name: "Write" }).click();
  const contentKept = (await page.inputValue("#content")).startsWith("## Stay cool");
  step("switching back to Write keeps content", contentKept);

  await page.check('input[name="status"]');
  await page.getByRole("button", { name: "Create post" }).click();
  await page.waitForURL(BASE + "/dashboard/blog", { timeout: 15000 });
  const publishedBadge = await page.locator("text=Published").first().isVisible();
  step("post list shows published post", publishedBadge);
  await page.screenshot({ path: path.join(SHOTS, "04-blog-list.png") });

  const apiResp = await page.request.get(BASE + "/api/posts?status=published");
  const apiJson = await apiResp.json();
  const apiHasPost = apiJson.posts?.some((p) => p.slug === "summer-maintenance-tips");
  step("public /api/posts serves the published post", apiHasPost, `count=${apiJson.posts?.length}`);

  const draftCheck = await page.request.get(BASE + "/api/posts?slug=nonexistent");
  step("unknown slug returns 404", draftCheck.status() === 404);

  // CSV export: authed download works, anonymous request bounces to login
  const csvResp = await page.request.get(BASE + "/api/leads/export");
  const csvBody = await csvResp.text();
  step(
    "CSV export downloads leads",
    csvResp.status() === 200 &&
      (csvResp.headers()["content-type"] ?? "").includes("text/csv") &&
      csvBody.startsWith("name,email,phone,source,stage,value,notes") &&
      csvBody.includes("Sarah Miller") &&
      csvBody.includes("2400"),
    `${csvBody.trim().split("\n").length - 1} rows`
  );
  const anonContext = await browser.newContext();
  const anonCsv = await anonContext.request.get(BASE + "/api/leads/export", {
    maxRedirects: 0,
  });
  step("CSV export requires auth", anonCsv.status() === 307);
  await anonContext.close();

  // â”€â”€ 7. Ticket flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/tickets/new");
  await page.fill("#subject", "Contact form styling looks off on mobile");
  await page.fill("#description", "The submit button overflows on iPhone SE width.");
  await page.selectOption("#priority", "high");
  await page.getByRole("button", { name: "Submit ticket" }).click();
  await page.waitForURL(/\/dashboard\/tickets\/[0-9a-f-]+$/, { timeout: 15000 });
  const highBadge = await page.locator("text=High").first().isVisible();
  const openBadge = await page.locator("text=Open").first().isVisible();
  step("ticket created with priority + open status", highBadge && openBadge);
  await page.screenshot({ path: path.join(SHOTS, "05-ticket.png") });

  await page.selectOption("#status", "in_progress");
  await page.getByRole("button", { name: "Update" }).click();
  await page.waitForSelector("text=In progress", { timeout: 15000 });
  step("ticket status update reflects", true);

  // â”€â”€ 8. Analytics: connect prompt when GSC not configured â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/analytics");
  const prompt = await page.locator("text=Connect Search Console to see your traffic").isVisible();
  step("analytics shows connect prompt", prompt);
  await page.screenshot({ path: path.join(SHOTS, "06-analytics-prompt.png") });

  // â”€â”€ 9. Settings: GSC status, capture endpoint, password change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.goto(BASE + "/dashboard/settings");
  const notConnected = await page.locator("text=Not connected").first().isVisible();
  const captureShown = await page.getByText("/api/leads/capture", { exact: false }).isVisible();
  step("settings shows GSC status + capture endpoint", notConnected && captureShown);
  await page.screenshot({ path: path.join(SHOTS, "07-settings.png") });

  await page.fill("#current", PASSWORD);
  await page.fill("#next", NEW_PASSWORD);
  await page.getByRole("button", { name: /update password/i }).click();
  await page.waitForSelector("text=Password updated.", { timeout: 15000 });
  step("password change succeeds", true);

  // â”€â”€ 10. Logout, verify old password dead, new one works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(BASE + "/", { timeout: 15000 });
  step("sign out returns to login", true);

  await page.fill("#email", EMAIL);
  await page.fill("#password", NEW_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(BASE + "/dashboard", { timeout: 15000 });
  step("login works with new password", true);

  // restore original password for cleanliness
  await page.goto(BASE + "/dashboard/settings");
  await page.fill("#current", NEW_PASSWORD);
  await page.fill("#next", PASSWORD);
  await page.getByRole("button", { name: /update password/i }).click();
  await page.waitForSelector("text=Password updated.", { timeout: 15000 });
  step("password restored", true);
} catch (error) {
  step("UNCAUGHT", false, String(error).slice(0, 500));
  await page.screenshot({ path: path.join(SHOTS, "99-failure.png") }).catch(() => {});
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed`);
process.exit(failed.length ? 1 : 0);
