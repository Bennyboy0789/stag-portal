import "server-only";
import { getDb, nowIso } from "../db";
import type { Post, PostStatus } from "../types";

export function listPosts(status?: PostStatus): Post[] {
  const db = getDb();
  if (status) {
    return db
      .prepare(
        `SELECT * FROM posts WHERE status = ?
         ORDER BY COALESCE(published_at, created_at) DESC`
      )
      .all(status) as Post[];
  }
  return db
    .prepare("SELECT * FROM posts ORDER BY created_at DESC")
    .all() as Post[];
}

export function getPost(id: string): Post | null {
  return (
    (getDb().prepare("SELECT * FROM posts WHERE id = ?").get(id) as
      | Post
      | undefined) ?? null
  );
}

export function getPostBySlug(slug: string): Post | null {
  return (
    (getDb().prepare("SELECT * FROM posts WHERE slug = ?").get(slug) as
      | Post
      | undefined) ?? null
  );
}

export function slugExists(slug: string, excludeId?: string): boolean {
  const row = excludeId
    ? getDb()
        .prepare("SELECT 1 FROM posts WHERE slug = ? AND id != ?")
        .get(slug, excludeId)
    : getDb().prepare("SELECT 1 FROM posts WHERE slug = ?").get(slug);
  return row !== undefined;
}

export function createPost(input: {
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
}): Post {
  const id = crypto.randomUUID();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO posts (id, title, slug, content, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.title,
      input.slug,
      input.content,
      input.status,
      input.status === "published" ? now : null,
      now,
      now
    );
  return getPost(id)!;
}

export function updatePost(
  id: string,
  input: {
    title: string;
    slug: string;
    content: string;
    status: PostStatus;
  }
): void {
  const existing = getPost(id);
  if (!existing) return;
  const now = nowIso();
  // Keep the original publish date on re-publish; stamp on first publish.
  const publishedAt =
    input.status === "published" ? (existing.published_at ?? now) : null;
  getDb()
    .prepare(
      `UPDATE posts
       SET title = ?, slug = ?, content = ?, status = ?, published_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(input.title, input.slug, input.content, input.status, publishedAt, now, id);
}

export function deletePost(id: string): void {
  getDb().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

export function postCounts(): { published: number; draft: number } {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM posts GROUP BY status")
    .all() as Array<{ status: PostStatus; n: number }>;
  const counts = { published: 0, draft: 0 };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}
