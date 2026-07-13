import "server-only";
import { getDb, nowIso } from "../db";
import type { Lead, LeadSource, LeadStage } from "../types";

export function listLeads(): Lead[] {
  return getDb()
    .prepare("SELECT * FROM leads ORDER BY created_at DESC")
    .all() as Lead[];
}

export function getLead(id: string): Lead | null {
  return (
    (getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as
      | Lead
      | undefined) ?? null
  );
}

export function createLead(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  notes?: string | null;
  value?: number | null;
}): Lead {
  const id = crypto.randomUUID();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO leads (id, name, email, phone, source, stage, notes, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`
    )
    .run(
      id,
      input.name,
      input.email ?? null,
      input.phone ?? null,
      input.source,
      input.notes ?? null,
      input.value ?? null,
      now,
      now
    );
  return getLead(id)!;
}

export function updateLeadStage(id: string, stage: LeadStage): void {
  getDb()
    .prepare("UPDATE leads SET stage = ?, updated_at = ? WHERE id = ?")
    .run(stage, nowIso(), id);
}

export function updateLead(
  id: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    source: LeadSource;
    stage: LeadStage;
    notes?: string | null;
    value?: number | null;
  }
): void {
  getDb()
    .prepare(
      `UPDATE leads
       SET name = ?, email = ?, phone = ?, source = ?, stage = ?, notes = ?, value = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.name,
      input.email ?? null,
      input.phone ?? null,
      input.source,
      input.stage,
      input.notes ?? null,
      input.value ?? null,
      nowIso(),
      id
    );
}

export function deleteLead(id: string): void {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
}

export function leadCounts(): Record<LeadStage, number> {
  const rows = getDb()
    .prepare("SELECT stage, COUNT(*) AS n FROM leads GROUP BY stage")
    .all() as Array<{ stage: LeadStage; n: number }>;
  const counts: Record<LeadStage, number> = {
    new: 0,
    contacted: 0,
    won: 0,
    lost: 0,
  };
  for (const row of rows) counts[row.stage] = row.n;
  return counts;
}

export function recentLeads(limit: number): Lead[] {
  return getDb()
    .prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Lead[];
}

/** Total dollar value of leads currently in the Won stage. */
export function wonRevenue(): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(value), 0) AS total FROM leads WHERE stage = 'won'"
    )
    .get() as { total: number };
  return row.total;
}
