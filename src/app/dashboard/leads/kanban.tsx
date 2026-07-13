"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { moveLeadAction } from "@/app/actions/leads";
import { SourceBadge, STAGE_LABELS } from "@/components/ui/badge";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { cn, formatMoney, timeAgo } from "@/lib/utils";

const STAGE_ACCENTS: Record<LeadStage, string> = {
  new: "bg-info",
  contacted: "bg-accent",
  won: "bg-success",
  lost: "bg-danger",
};

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="7" cy="5" r="1.5" />
      <circle cx="13" cy="5" r="1.5" />
      <circle cx="7" cy="10" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="7" cy="15" r="1.5" />
      <circle cx="13" cy="15" r="1.5" />
    </svg>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg border border-border bg-surface-2",
        isDragging && "z-50 relative opacity-90 shadow-xl border-accent/50"
      )}
    >
      <div className="flex">
        <button
          {...listeners}
          {...attributes}
          className="flex cursor-grab touch-none items-center rounded-l-lg px-2.5 text-muted/80 hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag ${lead.name}`}
        >
          <GripIcon />
        </button>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="min-w-0 flex-1 py-2.5 pr-3 pl-0.5"
        >
          <p className="truncate text-sm font-medium">{lead.name}</p>
          {(lead.email || lead.phone) && (
            <p className="truncate text-xs text-muted">
              {lead.email || lead.phone}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <SourceBadge source={lead.source} />
            {lead.value !== null && (
              <span className="text-[11px] font-medium text-foreground/80 tabular-nums">
                {formatMoney(lead.value)}
              </span>
            )}
            <span className="text-[11px] text-muted">
              {timeAgo(lead.created_at)}
            </span>
            {lead.notes && (
              <svg
                className="h-3 w-3 text-muted"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-label="Has notes"
                role="img"
              >
                <path d="M3.5 3h9M3.5 6.5h9M3.5 10h6" />
              </svg>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

function Column({ stage, leads }: { stage: LeadStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      data-stage={stage}
      className={cn(
        "flex min-h-40 w-72 shrink-0 flex-col rounded-xl border bg-surface p-3 transition-colors md:w-auto md:min-w-0 md:flex-1",
        isOver ? "border-accent/50 bg-accent-soft/30" : "border-border"
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("h-2 w-2 rounded-full", STAGE_ACCENTS[stage])} />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {STAGE_LABELS[stage]}
        </h2>
        <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted tabular-nums">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-xs",
              isOver
                ? "border-accent/60 text-accent"
                : "border-border text-muted/60"
            )}
          >
            {isOver ? "Drop to move here" : "No leads yet"}
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [prevInitial, setPrevInitial] = useState(initialLeads);
  const [, startTransition] = useTransition();

  // Adopt fresh server data after revalidation (adjust-state-during-render).
  if (prevInitial !== initialLeads) {
    setPrevInitial(initialLeads);
    setLeads(initialLeads);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const target = event.over?.id as LeadStage | undefined;
    if (!target || !LEAD_STAGES.includes(target)) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === target) return;

    const previous = leads;
    setLeads((current) =>
      current.map((l) => (l.id === leadId ? { ...l, stage: target } : l))
    );
    startTransition(async () => {
      const result = await moveLeadAction(leadId, target).catch(() => ({
        ok: false,
      }));
      if (!result.ok) setLeads(previous);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
        {LEAD_STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            leads={leads.filter((lead) => lead.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
