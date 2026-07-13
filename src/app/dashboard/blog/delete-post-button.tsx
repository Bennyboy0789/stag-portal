"use client";

import { deletePostAction } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";

export function DeletePostButton({ id }: { id: string }) {
  return (
    <form
      action={deletePostAction}
      onSubmit={(event) => {
        if (!confirm("Delete this post? This can't be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" size="sm">
        Delete post
      </Button>
    </form>
  );
}
