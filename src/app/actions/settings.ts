"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import { getDb, nowIso } from "@/lib/db";
import type { User } from "@/lib/types";

const ChangePasswordSchema = z.object({
  current: z.string().min(1, { error: "Enter your current password." }),
  next: z
    .string()
    .min(8, { error: "New password must be at least 8 characters." })
    .max(200),
});

export interface PasswordFormState {
  error?: string;
  success?: boolean;
}

export async function changePasswordAction(
  _prev: PasswordFormState | undefined,
  formData: FormData
): Promise<PasswordFormState> {
  const session = await verifySession();

  const parsed = ChangePasswordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.userId) as User | undefined;
  if (!user?.password_hash) {
    return { error: "Account not found." };
  }

  const valid = await bcrypt.compare(parsed.data.current, user.password_hash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(await bcrypt.hash(parsed.data.next, 10), user.id);

  console.log(`Password changed for ${user.email} at ${nowIso()}`);
  return { success: true };
}
