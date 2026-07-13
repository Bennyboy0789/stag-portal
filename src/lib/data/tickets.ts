import "server-only";
import { getDb, nowIso } from "../db";
import type { Ticket, TicketPriority, TicketStatus } from "../types";

export function listTickets(): Ticket[] {
  return getDb()
    .prepare(
      `SELECT * FROM tickets
       ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
                created_at DESC`
    )
    .all() as Ticket[];
}

export function getTicket(id: string): Ticket | null {
  return (
    (getDb().prepare("SELECT * FROM tickets WHERE id = ?").get(id) as
      | Ticket
      | undefined) ?? null
  );
}

export function createTicket(input: {
  subject: string;
  description?: string | null;
  priority: TicketPriority;
}): Ticket {
  const id = crypto.randomUUID();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO tickets (id, subject, description, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'open', ?, ?)`
    )
    .run(id, input.subject, input.description ?? null, input.priority, now, now);
  return getTicket(id)!;
}

export function updateTicketStatus(id: string, status: TicketStatus): void {
  getDb()
    .prepare("UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, nowIso(), id);
}

export function openTicketCount(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM tickets WHERE status != 'resolved'")
    .get() as { n: number };
  return row.n;
}

export function ticketStatusCounts(): Record<TicketStatus, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM tickets GROUP BY status")
    .all() as Array<{ status: TicketStatus; n: number }>;
  const counts: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
  };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}
