"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import { createTicket, updateTicketStatus } from "@/lib/data/tickets";
import { notifyTicketCreated } from "@/lib/data/discord";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/types";

const TicketSchema = z.object({
  subject: z.string().trim().min(1, { error: "Subject is required." }).max(300),
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => (v === "" ? null : v)),
  priority: z.enum(TICKET_PRIORITIES),
});

export interface TicketFormState {
  errors?: Partial<Record<"subject" | "description" | "priority", string[]>>;
}

export async function createTicketAction(
  _prev: TicketFormState | undefined,
  formData: FormData
): Promise<TicketFormState> {
  await verifySession();

  const parsed = TicketSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error)
        .fieldErrors as TicketFormState["errors"],
    };
  }

  const ticket = createTicket(parsed.data);
  await notifyTicketCreated(ticket);

  revalidatePath("/dashboard/tickets");
  redirect(`/dashboard/tickets/${ticket.id}`);
}

export async function updateTicketStatusAction(
  formData: FormData
): Promise<void> {
  await verifySession();

  const id = formData.get("id");
  const status = z.enum(TICKET_STATUSES).safeParse(formData.get("status"));
  if (typeof id === "string" && id && status.success) {
    updateTicketStatus(id, status.data);
    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${id}`);
  }
}
