import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTicketStatusAction } from "@/app/actions/tickets";
import { verifySession } from "@/lib/dal";
import { getTicket } from "@/lib/data/tickets";
import { Card, CardContent } from "@/components/ui/card";
import {
  PriorityBadge,
  TICKET_STATUS_LABELS,
  TicketStatusBadge,
} from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { TICKET_STATUSES } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Ticket" };

export default async function TicketDetailPage(
  props: PageProps<"/dashboard/tickets/[id]">
) {
  await verifySession();
  const { id } = await props.params;
  const ticket = getTicket(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/tickets"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to tickets
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{ticket.subject}</h1>
        <PriorityBadge priority={ticket.priority} />
        <TicketStatusBadge status={ticket.status} />
      </div>

      <Card>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {ticket.description || "No description provided."}
          </p>
          <div className="mt-4 border-t border-border pt-4 text-xs text-muted">
            <p>Opened {formatDateTime(ticket.created_at)}</p>
            <p>Last update {formatDateTime(ticket.updated_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <form
            action={updateTicketStatusAction}
            className="flex items-end gap-3"
          >
            <input type="hidden" name="id" value={ticket.id} />
            <div className="flex-1">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={ticket.status}>
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TICKET_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              Update
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
