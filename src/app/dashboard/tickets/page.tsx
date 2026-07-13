import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { listTickets } from "@/lib/data/tickets";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge, TicketStatusBadge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Tickets" };

export default async function TicketsPage() {
  await verifySession();
  const tickets = listTickets();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Maintenance tickets</h1>
          <p className="text-sm text-muted">
            Something broken or needs updating? Let us know here.
          </p>
        </div>
        <Link
          href="/dashboard/tickets/new"
          className="inline-flex h-11 md:h-10 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-black transition-colors hover:bg-accent-strong"
        >
          + New ticket
        </Link>
      </div>

      <Card>
        {tickets.length === 0 ? (
          <CardContent className="text-sm text-muted">
            No tickets yet. If anything on your site needs attention, submit a
            ticket and the Stag team is notified instantly.
          </CardContent>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted">
                      Opened {timeAgo(ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
