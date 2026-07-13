"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import {
  createLead,
  deleteLead,
  updateLead,
  updateLeadStage,
} from "@/lib/data/leads";
import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/types";

const LeadFieldsSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(200),
  email: z
    .union([z.literal(""), z.email({ error: "Enter a valid email." })])
    .transform((v) => (v === "" ? null : v)),
  phone: z
    .string()
    .trim()
    .max(50)
    .transform((v) => (v === "" ? null : v)),
  source: z.enum(LEAD_SOURCES),
  notes: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => (v === "" ? null : v)),
  value: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(/[$,]/g, ""))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 1e8), {
      error: "Enter a valid dollar amount.",
    }),
});

export interface LeadFormState {
  errors?: Partial<
    Record<"name" | "email" | "phone" | "source" | "notes" | "value", string[]>
  >;
  message?: string;
  success?: boolean;
}

function fieldErrors(error: z.ZodError): LeadFormState["errors"] {
  return z.flattenError(error).fieldErrors as LeadFormState["errors"];
}

export async function createLeadAction(
  _prev: LeadFormState | undefined,
  formData: FormData
): Promise<LeadFormState> {
  await verifySession();

  const parsed = LeadFieldsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    value: formData.get("value") ?? "",
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  createLead(parsed.data);
  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function updateLeadAction(
  _prev: LeadFormState | undefined,
  formData: FormData
): Promise<LeadFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { message: "Missing lead id." };

  const parsed = LeadFieldsSchema.extend({
    stage: z.enum(LEAD_STAGES),
  }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    stage: formData.get("stage"),
    notes: formData.get("notes"),
    value: formData.get("value") ?? "",
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  updateLead(id, parsed.data);
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${id}`);
  return { success: true, message: "Lead saved." };
}

export async function moveLeadAction(
  id: string,
  stage: string
): Promise<{ ok: boolean }> {
  await verifySession();

  const parsedStage = z.enum(LEAD_STAGES).safeParse(stage);
  if (!parsedStage.success || typeof id !== "string" || !id) {
    return { ok: false };
  }

  updateLeadStage(id, parsedStage.data);
  revalidatePath("/dashboard/leads");
  return { ok: true };
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    deleteLead(id);
    revalidatePath("/dashboard/leads");
  }
  redirect("/dashboard/leads");
}
