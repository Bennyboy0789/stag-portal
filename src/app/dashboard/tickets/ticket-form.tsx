"use client";

import { useActionState } from "react";
import { createTicketAction, type TicketFormState } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PRIORITY_LABELS } from "@/components/ui/badge";
import { TICKET_PRIORITIES } from "@/lib/types";

export function TicketForm() {
  const [state, action, pending] = useActionState<
    TicketFormState | undefined,
    FormData
  >(createTicketAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="e.g. Contact form isn't sending"
          required
        />
        <FieldError errors={state?.errors?.subject} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          placeholder="What's happening? Include the page URL and any steps to reproduce."
        />
        <FieldError errors={state?.errors?.description} />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select id="priority" name="priority" defaultValue="medium">
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
        <FieldError errors={state?.errors?.priority} />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit ticket"}
        </Button>
      </div>
    </form>
  );
}
