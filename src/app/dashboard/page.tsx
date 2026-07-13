import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { leadCounts, recentLeads, wonRevenue } from "@/lib/data/leads";
import { ticketStatusCounts } from "@/lib/data/tickets";
import { getCachedSnapshot, isConnected } from "@/lib/data/gsc";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge, StageBadge } from "@/components/ui/badge";
import { cn, formatMoney, timeAgo } from "@/lib/utils";

export const metadata = { title: "Overview" };

function Stat({
  label,
  value,
  href,
  hint,
  accentHint,
}: {
  label: string;
  value: string | number;
  href: string;
  hint?: string;
  accentHint?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:border-border-strong">
        <CardContent className="p-4 md:p-5">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && (
            <p
              className={cn(
                "mt-0.5 text-[11px]",
                accentHint ? "text-accent group-hover:underline" : "text-muted"
              )}
            >
              {hint}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  await verifySession();

  const counts = leadCounts();
  const totalLeads = counts.new + counts.contacted + counts.won + counts.lost;
  const revenue = wonRevenue();
  const tickets = ticketStatusCounts();
  const openTickets = tickets.open + tickets.in_progress;
  const gscConnected = isConnected();
  const gsc = gscConnected ? getCachedSnapshot("30d") : null;
  const recent = recentLeads(6);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-lg font-semibold">Overview</h1>
      <p className="mb-6 text-sm text-muted">
        What&apos;s happening across your site.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="New leads"
          value={counts.new}
          hint={`${totalLeads} total`}
          href="/dashboard/leads"
        />
        <Stat
          label="Leads won"
          value={counts.won}
          hint={
            revenue > 0
              ? `${formatMoney(revenue)} won`
              : `${counts.contacted} in progress`
          }
          href="/dashboard/leads"
        />
        <Stat
          label="Search clicks (30d)"
          value={gsc ? Math.round(gsc.snapshot.totals.clicks) : "—"}
          hint={gscConnected ? undefined : "Connect Search Console →"}
          accentHint={!gscConnected}
          href="/dashboard/analytics"
        />
        <Stat
          label="Open tickets"
          value={openTickets}
          hint={
            openTickets === 0
              ? "All clear"
              : `${tickets.in_progress} in progress`
          }
          href="/dashboard/tickets"
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent leads</h2>
          <Link
            href="/dashboard/leads"
            className="text-xs text-accent hover:underline"
          >
            View board →
          </Link>
        </div>
        <Card>
          {recent.length === 0 ? (
            <CardContent className="text-sm text-muted">
              No leads yet. They&apos;ll appear here as soon as your website
              form captures one — or{" "}
              <Link
                href="/dashboard/leads/new"
                className="text-accent hover:underline"
              >
                add one manually
              </Link>
              .
            </CardContent>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {lead.email || lead.phone || "No contact info"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <SourceBadge source={lead.source} />
                      <StageBadge stage={lead.stage} />
                      <span className="hidden text-xs text-muted sm:inline">
                        {timeAgo(lead.created_at)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
