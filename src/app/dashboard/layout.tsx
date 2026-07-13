import { logout } from "@/app/actions/auth";
import { env } from "@/lib/env";
import { StagMark } from "@/components/brand";
import { NavLinks } from "./nav-links";

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-surface/50 md:p-4 md:sticky md:top-0 md:h-screen">
        <div className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
            <StagMark className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {env.clientName}
            </p>
            <p className="text-[11px] text-muted">Client portal</p>
          </div>
        </div>
        <NavLinks orientation="vertical" />
        <div className="mt-auto border-t border-border pt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="border-b border-border bg-surface/50 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              <StagMark className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">{env.clientName}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
        <NavLinks orientation="horizontal" />
      </header>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
