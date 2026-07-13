import { isConnected, syncAllRanges } from "@/lib/data/gsc";
import { env } from "@/lib/env";

// Daily Search Console refresh. Point a scheduler (e.g. Vercel Cron or any
// external pinger) at GET /api/cron/sync with `Authorization: Bearer CRON_SECRET`.

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConnected()) {
    return Response.json({ ok: true, skipped: "not_connected" });
  }

  try {
    await syncAllRanges();
    return Response.json({ ok: true, synced_at: new Date().toISOString() });
  } catch (error) {
    console.error("Cron sync failed:", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
