import Link from "next/link";
import { verifySession } from "@/lib/dal";
import {
  GSC_RANGES,
  getCachedSnapshot,
  getConnection,
  type GscRange,
} from "@/lib/data/gsc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";
import { ClicksChart } from "./clicks-chart";
import { RefreshButton } from "./refresh-button";

export const metadata = { title: "Analytics" };

const RANGE_LABELS: Record<GscRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

function ConnectPrompt() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <svg
          className="h-10 w-10 text-accent"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 5v22h22" />
          <path d="M10 20l5-6 4 3 7-9" />
          <circle cx="26" cy="8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        <p className="text-sm font-medium">
          Connect Search Console to see your traffic
        </p>
        <p className="max-w-sm text-xs text-muted">
          See how many people find you on Google, which searches bring them
          in, and which pages do the heavy lifting.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-2 inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-black transition-colors hover:bg-accent-strong"
        >
          Go to settings
        </Link>
      </CardContent>
    </Card>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; clicks: number; impressions: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {rows.length === 0 ? (
          <p className="text-xs text-muted">No data for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">&nbsp;</th>
                <th className="pb-2 text-right font-medium">Clicks</th>
                <th className="pb-2 text-right font-medium">Impr.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td
                    className="max-w-0 truncate py-2 pr-3 text-foreground/90"
                    title={row.label}
                  >
                    {row.label}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {Math.round(row.clicks).toLocaleString()}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">
                    {Math.round(row.impressions).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage(
  props: PageProps<"/dashboard/analytics">
) {
  await verifySession();

  const searchParams = await props.searchParams;
  const rawRange = Array.isArray(searchParams.range)
    ? searchParams.range[0]
    : searchParams.range;
  const range: GscRange = GSC_RANGES.includes(rawRange as GscRange)
    ? (rawRange as GscRange)
    : "30d";

  const connection = getConnection();
  const connected = Boolean(connection?.refresh_token);
  const hasSite = Boolean(connection?.site_url);
  const cached = connected && hasSite ? getCachedSnapshot(range) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Traffic analytics</h1>
          <p className="text-sm text-muted">
            Google Search performance
            {connection?.site_url ? ` for ${connection.site_url}` : ""}.
          </p>
        </div>

        {connected && hasSite && (
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              {GSC_RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/dashboard/analytics?range=${r}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs transition-colors",
                    r === range
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {RANGE_LABELS[r]}
                </Link>
              ))}
            </div>
            <RefreshButton />
          </div>
        )}
      </div>

      {!connected ? (
        <ConnectPrompt />
      ) : !hasSite ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Almost there — pick which Search Console property to track in{" "}
            <Link href="/dashboard/settings" className="text-accent hover:underline">
              settings
            </Link>
            .
          </CardContent>
        </Card>
      ) : !cached ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted">
            <p>No data pulled yet. Hit refresh to fetch from Google.</p>
            <RefreshButton />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Total clicks"
              value={Math.round(cached.snapshot.totals.clicks).toLocaleString()}
            />
            <MetricTile
              label="Impressions"
              value={Math.round(
                cached.snapshot.totals.impressions
              ).toLocaleString()}
            />
            <MetricTile
              label="Avg. CTR"
              value={`${(cached.snapshot.totals.ctr * 100).toFixed(1)}%`}
            />
            <MetricTile
              label="Avg. position"
              value={cached.snapshot.totals.position.toFixed(1)}
            />
          </div>

          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Clicks · last {RANGE_LABELS[range]}</CardTitle>
            </CardHeader>
            <CardContent>
              <ClicksChart data={cached.snapshot.byDate} />
            </CardContent>
          </Card>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TopList
              title="Top search queries"
              rows={cached.snapshot.topQueries.map((q) => ({
                label: q.query,
                clicks: q.clicks,
                impressions: q.impressions,
              }))}
            />
            <TopList
              title="Top pages"
              rows={cached.snapshot.topPages.map((p) => ({
                label: p.page.replace(/^https?:\/\/[^/]+/, "") || p.page,
                clicks: p.clicks,
                impressions: p.impressions,
              }))}
            />
          </div>

          <p className="mt-4 text-right text-[11px] text-muted">
            Last synced {formatDateTime(cached.fetchedAt)}
          </p>
        </>
      )}
    </div>
  );
}
