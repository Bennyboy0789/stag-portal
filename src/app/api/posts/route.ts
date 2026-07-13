import type { NextRequest } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { getPostBySlug, listPosts } from "@/lib/data/posts";
import type { Post } from "@/lib/types";

// Public endpoint: the client's website fetches published posts from here.
// Only published posts are ever exposed; drafts require the dashboard.

function publicPost(post: Post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    published_at: post.published_at,
    updated_at: post.updated_at,
  };
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const headers = { ...corsHeaders(request), "Content-Type": "application/json" };
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const post = getPostBySlug(slug);
    if (!post || post.status !== "published") {
      return Response.json({ error: "Not found" }, { status: 404, headers });
    }
    return Response.json({ post: publicPost(post) }, { headers });
  }

  // Only published posts are exposed regardless of the status param;
  // it's accepted for spec compatibility (?status=published).
  const posts = listPosts("published").map(publicPost);
  return Response.json({ posts }, { headers });
}
