import "server-only";
import { getDb, nowIso } from "../db";
import { decryptSecret, encryptSecret } from "../crypto";
import { env } from "../env";
import type { GscSnapshot, SearchConsoleRow } from "../types";

export const GSC_RANGES = ["7d", "30d", "90d"] as const;
export type GscRange = (typeof GSC_RANGES)[number];
const RANGE_DAYS: Record<GscRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://www.googleapis.com/webmasters/v3";

export function oauthRedirectUri(): string {
  return `${env.appUrl}/api/auth/google/callback`;
}

// --- Connection state -------------------------------------------------------

export function getConnection(): SearchConsoleRow | null {
  return (
    (getDb().prepare("SELECT * FROM search_console WHERE id = 1").get() as
      | SearchConsoleRow
      | undefined) ?? null
  );
}

export function isConnected(): boolean {
  const row = getConnection();
  return Boolean(row?.refresh_token);
}

export function saveRefreshToken(refreshToken: string): void {
  getDb()
    .prepare(
      `INSERT INTO search_console (id, refresh_token, connected_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET refresh_token = excluded.refresh_token,
                                     connected_at = excluded.connected_at`
    )
    .run(encryptSecret(refreshToken), nowIso());
}

export function saveSiteUrl(siteUrl: string): void {
  getDb()
    .prepare("UPDATE search_console SET site_url = ? WHERE id = 1")
    .run(siteUrl);
}

export function disconnect(): void {
  const db = getDb();
  db.prepare("DELETE FROM search_console WHERE id = 1").run();
  db.prepare("DELETE FROM gsc_cache").run();
}

// --- OAuth ------------------------------------------------------------------

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const row = getConnection();
  const refreshToken = row?.refresh_token
    ? decryptSecret(row.refresh_token)
    : null;
  if (!refreshToken) {
    throw new Error("Search Console is not connected");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  refresh_token?: string;
  access_token: string;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: oauthRedirectUri(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Google code exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// --- Search Console API -----------------------------------------------------

export async function listSites(): Promise<string[]> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to list sites: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>;
  };
  return (data.siteEntry ?? [])
    .filter((site) => site.permissionLevel !== "siteUnverifiedUser")
    .map((site) => site.siteUrl)
    .sort();
}

interface QueryRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function searchAnalyticsQuery(
  siteUrl: string,
  body: Record<string, unknown>
): Promise<QueryRow[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`Search analytics query failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { rows?: QueryRow[] };
  return data.rows ?? [];
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchSnapshot(
  siteUrl: string,
  range: GscRange
): Promise<GscSnapshot> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // GSC data lags ~1 day
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (RANGE_DAYS[range] - 1));
  const startDate = dateString(start);
  const endDate = dateString(end);

  const [byDate, totals, topQueries, topPages] = await Promise.all([
    searchAnalyticsQuery(siteUrl, {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 100,
    }),
    searchAnalyticsQuery(siteUrl, { startDate, endDate }),
    searchAnalyticsQuery(siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 5,
    }),
    searchAnalyticsQuery(siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 5,
    }),
  ]);

  const total = totals[0];
  return {
    totals: {
      clicks: total?.clicks ?? 0,
      impressions: total?.impressions ?? 0,
      ctr: total?.ctr ?? 0,
      position: total?.position ?? 0,
    },
    byDate: byDate.map((row) => ({
      date: row.keys?.[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    topQueries: topQueries.map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    topPages: topPages.map((row) => ({
      page: row.keys?.[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
    })),
  };
}

// --- Cache / sync -----------------------------------------------------------

export function getCachedSnapshot(
  range: GscRange
): { snapshot: GscSnapshot; fetchedAt: string } | null {
  const row = getDb()
    .prepare("SELECT data, fetched_at FROM gsc_cache WHERE range = ?")
    .get(range) as { data: string; fetched_at: string } | undefined;
  if (!row) return null;
  try {
    return { snapshot: JSON.parse(row.data), fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

/** Fetch all ranges from Google and store them in the local cache. */
export async function syncAllRanges(): Promise<void> {
  const connection = getConnection();
  if (!connection?.refresh_token || !connection.site_url) {
    throw new Error("Search Console is not connected or no site selected");
  }

  const db = getDb();
  for (const range of GSC_RANGES) {
    const snapshot = await fetchSnapshot(connection.site_url, range);
    db.prepare(
      `INSERT INTO gsc_cache (range, data, fetched_at) VALUES (?, ?, ?)
       ON CONFLICT(range) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at`
    ).run(range, JSON.stringify(snapshot), nowIso());
  }
  db.prepare("UPDATE search_console SET last_sync = ? WHERE id = 1").run(
    nowIso()
  );
}
