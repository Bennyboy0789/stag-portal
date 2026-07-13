import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { StagMark } from "@/components/brand";
import { LoginForm } from "./login-form";

// Reads the users table on every request (setup hint until a user exists),
// so this page must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const userCount = (
    getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }
  ).n;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
            <StagMark className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold">{env.clientName} Portal</h1>
          <p className="mt-1 text-sm text-muted">
            Leads, content &amp; analytics in one place
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          {userCount === 0 ? (
            <div className="text-sm text-muted leading-relaxed">
              <p className="mb-2 font-medium text-foreground">
                No portal user configured yet.
              </p>
              <p>
                Set <code className="text-accent">PORTAL_ADMIN_EMAIL</code> and{" "}
                <code className="text-accent">PORTAL_ADMIN_PASSWORD</code> in
                the environment, or run{" "}
                <code className="text-accent">npm run create-user</code>, then
                reload this page.
              </p>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Powered by{" "}
          <a
            href="https://stagmkt.com"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Stag Marketing
          </a>
        </p>
      </div>
    </main>
  );
}
