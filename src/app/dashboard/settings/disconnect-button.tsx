"use client";

import { disconnectGscAction } from "@/app/actions/gsc";
import { Button } from "@/components/ui/button";

export function DisconnectButton() {
  return (
    <form
      action={disconnectGscAction}
      onSubmit={(event) => {
        if (
          !confirm(
            "Disconnect Search Console? Cached analytics data will be cleared."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        Disconnect
      </Button>
    </form>
  );
}
