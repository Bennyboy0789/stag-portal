"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type PasswordFormState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function PasswordForm() {
  const [state, action, pending] = useActionState<
    PasswordFormState | undefined,
    FormData
  >(changePasswordAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-success" role="status">
          Password updated.
        </p>
      )}
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
