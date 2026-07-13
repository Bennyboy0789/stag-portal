"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { createSession, deleteSession } from "@/lib/session";
import type { User } from "@/lib/types";

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Enter your password." }),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const ip = clientIpFrom(await headers());
  if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(parsed.data.email.toLowerCase()) as User | undefined;

  const valid =
    user?.password_hash &&
    (await bcrypt.compare(parsed.data.password, user.password_hash));
  if (!user || !valid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, user.email);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
