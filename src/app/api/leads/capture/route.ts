import { z } from "zod";
import { corsHeaders } from "@/lib/cors";
import { createLead } from "@/lib/data/leads";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

// Public endpoint: the client's website contact form POSTs here.
// Auth is intentionally absent; CORS is limited to the client's domain
// and submissions are rate limited per IP.

const CaptureSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().max(5000).optional(),
  source: z.literal("website_form").optional(),
});

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = { ...corsHeaders(request), "Content-Type": "application/json" };

  const ip = clientIpFrom(request.headers);
  if (!rateLimit(`capture:${ip}`, 10, 60 * 1000)) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers }
    );
  }

  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid submission", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400, headers }
    );
  }

  const { name, email, phone, message } = parsed.data;
  const lead = createLead({
    name,
    email: email || null,
    phone: phone || null,
    source: "website_form",
    notes: message ? `From website form:\n${message}` : null,
  });

  return Response.json({ ok: true, id: lead.id }, { status: 201, headers });
}
