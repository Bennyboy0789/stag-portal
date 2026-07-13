"use client";

import { useActionState } from "react";
import { refreshGscAction, type RefreshState } from "@/app/actions/gsc";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const [state, action, pending] = useActionState<
    RefreshState | undefined,
    FormData
  >(refreshGscAction, undefined);

  return (
    <form action={action} className="flex items-center gap-3">
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Refreshing…" : "↻ Refresh"}
      </Button>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
