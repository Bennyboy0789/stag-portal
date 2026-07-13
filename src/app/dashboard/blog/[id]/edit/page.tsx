import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getPost } from "@/lib/data/posts";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { PostEditor } from "../../post-editor";
import { DeletePostButton } from "../../delete-post-button";

export const metadata = { title: "Edit post" };

export default async function EditPostPage(
  props: PageProps<"/dashboard/blog/[id]/edit">
) {
  await verifySession();
  const { id } = await props.params;
  const post = getPost(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/blog"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-2 mb-6 text-lg font-semibold">Edit post</h1>
      <Card>
        <CardContent>
          <PostEditor post={post} />
        </CardContent>
      </Card>
      <div className="mt-6 flex items-center justify-between text-xs text-muted">
        <div>
          <p>Created {formatDateTime(post.created_at)}</p>
          <p>Updated {formatDateTime(post.updated_at)}</p>
        </div>
        <DeletePostButton id={post.id} />
      </div>
    </div>
  );
}
