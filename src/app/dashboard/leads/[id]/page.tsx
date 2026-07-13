import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getLead } from "@/lib/data/leads";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge, StageBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { LeadForm } from "../lead-form";
import { DeleteLeadButton } from "../delete-lead-button";

export const metadata = { title: "Lead details" };

export default async function LeadDetailPage(
  props: PageProps<"/dashboard/leads/[id]">
) {
  await verifySession();
  const { id } = await props.params;
  const lead = getLead(id);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/leads"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to board
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{lead.name}</h1>
        <StageBadge stage={lead.stage} />
        <SourceBadge source={lead.source} />
      </div>

      <Card>
        <CardContent>
          <LeadForm lead={lead} />
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-xs text-muted">
        <div>
          <p>Created {formatDateTime(lead.created_at)}</p>
          <p>Updated {formatDateTime(lead.updated_at)}</p>
        </div>
        <DeleteLeadButton id={lead.id} />
      </div>
    </div>
  );
}
