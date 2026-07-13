"use client";

import { useActionState } from "react";
import {
  createLeadAction,
  updateLeadAction,
  type LeadFormState,
} from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { SOURCE_LABELS, STAGE_LABELS } from "@/components/ui/badge";
import { LEAD_SOURCES, LEAD_STAGES, type Lead } from "@/lib/types";

export function LeadForm({ lead }: { lead?: Lead }) {
  const isEdit = Boolean(lead);
  const [state, action, pending] = useActionState<
    LeadFormState | undefined,
    FormData
  >(isEdit ? updateLeadAction : createLeadAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {lead && <input type="hidden" name="id" value={lead.id} />}

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={lead?.name}
          placeholder="Jane Smith"
          required
        />
        <FieldError errors={state?.errors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={lead?.email ?? ""}
            placeholder="jane@example.com"
          />
          <FieldError errors={state?.errors?.email} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={lead?.phone ?? ""}
            placeholder="(555) 123-4567"
          />
          <FieldError errors={state?.errors?.phone} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="source">Source</Label>
          <Select
            id="source"
            name="source"
            defaultValue={lead?.source ?? "phone_call"}
          >
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </Select>
          <FieldError errors={state?.errors?.source} />
        </div>
        {lead && (
          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select id="stage" name="stage" defaultValue={lead.stage}>
              {LEAD_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="value">Deal value ($)</Label>
          <Input
            id="value"
            name="value"
            type="text"
            inputMode="decimal"
            defaultValue={lead?.value ?? ""}
            placeholder="2400"
          />
          <FieldError errors={state?.errors?.value} />
          <p className="mt-1.5 text-[11px] text-muted">
            Counts toward revenue won while the lead is in the Won stage.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          defaultValue={lead?.notes ?? ""}
          placeholder="Call summary, follow-up reminders, quote details…"
        />
        <FieldError errors={state?.errors?.notes} />
      </div>

      {state?.message && (
        <p
          className={`text-sm ${state.success ? "text-success" : "text-danger"}`}
          role="status"
        >
          {state.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add lead"}
        </Button>
      </div>
    </form>
  );
}
