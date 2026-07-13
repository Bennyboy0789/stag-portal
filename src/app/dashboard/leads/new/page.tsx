import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "../lead-form";

export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  await verifySession();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/leads"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to board
      </Link>
      <h1 className="mt-2 text-lg font-semibold">Add a lead</h1>
      <p className="mb-6 text-sm text-muted">
        For phone calls, Google Business Profile enquiries, or anything that
        didn&apos;t come through the website form.
      </p>
      <Card>
        <CardContent>
          <LeadForm />
        </CardContent>
      </Card>
    </div>
  );
}
