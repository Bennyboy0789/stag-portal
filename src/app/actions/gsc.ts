"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import {
  disconnect,
  saveSiteUrl,
  syncAllRanges,
} from "@/lib/data/gsc";

export async function selectSiteAction(formData: FormData): Promise<void> {
  await verifySession();

  const site = z.string().min(1).safeParse(formData.get("site_url"));
  if (!site.success) return;

  saveSiteUrl(site.data);
  try {
    await syncAllRanges();
  } catch (error) {
    // Site saved; data can be pulled later via Refresh.
    console.error("Initial Search Console sync failed:", error);
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}

export interface RefreshState {
  error?: string;
  refreshedAt?: string;
}

// Invoked via useActionState; the (state, formData) args aren't needed.
export async function refreshGscAction(): Promise<RefreshState> {
  await verifySession();

  try {
    await syncAllRanges();
  } catch (error) {
    console.error("Search Console refresh failed:", error);
    return {
      error:
        "Couldn't refresh data from Google. Try reconnecting Search Console in Settings.",
    };
  }
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { refreshedAt: new Date().toISOString() };
}

export async function disconnectGscAction(): Promise<void> {
  await verifySession();
  disconnect();
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}
