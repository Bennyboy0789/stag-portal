import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import { PostEditor } from "../post-editor";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await verifySession();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/blog"
        className="text-xs text-muted hover:text-foreground"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-2 mb-6 text-lg font-semibold">New post</h1>
      <Card>
        <CardContent>
          <PostEditor />
        </CardContent>
      </Card>
    </div>
  );
}
