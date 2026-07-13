import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { listLeads } from "@/lib/data/leads";

// Authenticated CSV download of all leads (linked from the board header).

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  let text = String(value);
  // Blunt spreadsheet formula injection (cells starting =, +, -, @).
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const header = [
    "name",
    "email",
    "phone",
    "source",
    "stage",
    "value",
    "notes",
    "created_at",
    "updated_at",
  ];
  const rows = listLeads().map((lead) =>
    [
      lead.name,
      lead.email,
      lead.phone,
      lead.source,
      lead.stage,
      lead.value,
      lead.notes,
      lead.created_at,
      lead.updated_at,
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\r\n") + "\r\n";

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
