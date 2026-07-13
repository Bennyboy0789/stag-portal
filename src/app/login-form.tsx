"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
