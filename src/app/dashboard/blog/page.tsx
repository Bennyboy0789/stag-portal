import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { listPosts } from "@/lib/data/posts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  await verifySession();
  const posts = listPosts();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Blog</h1>
          <p className="text-sm text-muted">
            Published posts appear on your website automatically.
          </p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex h-11 md:h-10 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-black transition-colors hover:bg-accent-strong"
        >
          + New post
        </Link>
      </div>

      <Card>
        {posts.length === 0 ? (
          <CardContent className="text-sm text-muted">
            No posts yet. Write your first one — it&apos;ll show up on your
            website as soon as you publish.
          </CardContent>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/dashboard/blog/${post.id}/edit`}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="truncate font-mono text-xs text-muted">
                      /{post.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {post.status === "published" ? (
                      <Badge className="bg-success/15 text-success">
                        Published
                      </Badge>
                    ) : (
                      <Badge className="bg-surface-2 text-muted border border-border">
                        Draft
                      </Badge>
                    )}
                    <span className="text-xs text-muted">
                      {formatDate(post.published_at ?? post.created_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
