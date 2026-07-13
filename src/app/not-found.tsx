import Link from "next/link";
import { StagMark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <StagMark className="h-12 w-12 opacity-60" />
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted">
        That page doesn&apos;t exist — it may have been deleted.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 text-sm text-accent hover:underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
