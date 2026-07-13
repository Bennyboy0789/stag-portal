"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import {
  createPost,
  deletePost,
  getPost,
  slugExists,
  updatePost,
} from "@/lib/data/posts";
import { POST_STATUSES } from "@/lib/types";
import { slugify } from "@/lib/utils";

const PostSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required." }).max(300),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, {
      error: "Use lowercase letters, numbers and dashes only.",
    }),
  content: z.string().min(1, { error: "Content can't be empty." }),
  status: z.enum(POST_STATUSES),
});

export interface PostFormState {
  errors?: Partial<Record<"title" | "slug" | "content" | "status", string[]>>;
  message?: string;
}

export async function savePostAction(
  _prev: PostFormState | undefined,
  formData: FormData
): Promise<PostFormState> {
  await verifySession();

  const id = formData.get("id");
  const parsed = PostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content"),
    status: formData.get("status") === "published" ? "published" : "draft",
  });
  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error)
        .fieldErrors as PostFormState["errors"],
    };
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.title);
  if (!slug) {
    return { errors: { slug: ["Slug can't be empty."] } };
  }

  if (typeof id === "string" && id) {
    if (!getPost(id)) return { message: "Post no longer exists." };
    if (slugExists(slug, id)) {
      return { errors: { slug: ["That slug is already in use."] } };
    }
    updatePost(id, { ...data, slug });
  } else {
    if (slugExists(slug)) {
      return { errors: { slug: ["That slug is already in use."] } };
    }
    createPost({ ...data, slug });
  }

  revalidatePath("/dashboard/blog");
  redirect("/dashboard/blog");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    deletePost(id);
    revalidatePath("/dashboard/blog");
  }
  redirect("/dashboard/blog");
}
