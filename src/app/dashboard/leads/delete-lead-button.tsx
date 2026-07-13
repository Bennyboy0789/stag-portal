"use client";

import { deleteLeadAction } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";

export function DeleteLeadButton({ id }: { id: string }) {
  return (
    <form
      action={deleteLeadAction}
      onSubmit={(event) => {
        if (!confirm("Delete this lead? This can't be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" size="sm">
        Delete lead
      </Button>
    </form>
  );
}
