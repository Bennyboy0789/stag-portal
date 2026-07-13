import { cn } from "@/lib/utils";
import type { LeadSource, LeadStage, TicketPriority, TicketStatus } from "@/lib/types";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        className
      )}
      {...props}
    />
  );
}

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  won: "Won",
  lost: "Lost",
};

const STAGE_STYLES: Record<LeadStage, string> = {
  new: "bg-info/15 text-info",
  contacted: "bg-accent/15 text-accent",
  won: "bg-success/15 text-success",
  lost: "bg-danger/15 text-danger",
};

export function StageBadge({ stage }: { stage: LeadStage }) {
  return <Badge className={STAGE_STYLES[stage]}>{STAGE_LABELS[stage]}</Badge>;
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website_form: "Website form",
  phone_call: "Phone call",
  gbp: "Google Business",
  manual: "Manual",
};

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <Badge className="bg-surface-2 text-muted border border-border">
      {SOURCE_LABELS[source]}
    </Badge>
  );
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-accent/15 text-accent",
  high: "bg-danger/15 text-danger",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge className={PRIORITY_STYLES[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-info/15 text-info",
  in_progress: "bg-accent/15 text-accent",
  resolved: "bg-success/15 text-success",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={TICKET_STATUS_STYLES[status]}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
