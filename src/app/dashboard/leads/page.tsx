import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { listLeads } from "@/lib/data/leads";
import { KanbanBoard } from "./kanban";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  await verifySession();
  const leads = listLeads();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm text-muted">
            Drag cards between stages, or open a lead to edit it and change
            its stage.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/api/leads/export"
            download
            className="inline-flex h-11 md:h-10 items-center rounded-lg border border-border bg-surface-2 px-4 text-sm text-foreground transition-colors hover:border-border-strong"
          >
            Export CSV
          </a>
          <Link
            href="/dashboard/leads/new"
            className="inline-flex h-11 md:h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-black transition-colors hover:bg-accent-strong"
          >
            + New lead
          </Link>
        </div>
      </div>
      <KanbanBoard initialLeads={leads} />
    </div>
  );
}
