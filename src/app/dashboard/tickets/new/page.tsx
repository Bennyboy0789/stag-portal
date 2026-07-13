import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import { TicketForm } from "../ticket-form";

export const metadata = { title: "New ticket" };

export default async function NewTicketPage() {
  await verifySession();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/tickets"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to tickets
      </Link>
      <h1 className="mt-2 text-lg font-semibold">Submit a ticket</h1>
      <p className="mb-6 text-sm text-muted">
        The Stag team gets pinged the moment you hit submit.
      </p>
      <Card>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
