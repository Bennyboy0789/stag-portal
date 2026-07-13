import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, readSessionCookie, type SessionPayload } from "./session";

/**
 * Verify the session on every data access. Redirects to the login page
 * when the session is missing or invalid.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await decrypt(await readSessionCookie());
  if (!session) {
    redirect("/");
  }
  return session;
});

/** Like verifySession, but returns null instead of redirecting (for route handlers). */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return decrypt(await readSessionCookie());
});
