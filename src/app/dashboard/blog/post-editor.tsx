"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { savePostAction, type PostFormState } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import type { Post } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";

const UNSAVED_MESSAGE =
  "You have unsaved changes to this post. Leave and discard them?";

// Escape raw HTML before parsing so the preview only ever renders markdown
// syntax — a pasted <script> shows as text instead of executing.
function renderMarkdown(source: string): string {
  const escaped = source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return marked.parse(escaped, { async: false, gfm: true, breaks: true });
}

export function PostEditor({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState<
    PostFormState | undefined,
    FormData
  >(savePostAction, undefined);
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [published, setPublished] = useState(post?.status === "published");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function showPreview() {
    setPreviewHtml(renderMarkdown(contentRef.current?.value ?? ""));
    setTab("preview");
  }

  // Guard against losing a half-written post: warn on tab close/reload and
  // confirm before in-app navigation while the form is dirty.
  const dirtyRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = UNSAVED_MESSAGE;
    };
    const onClickCapture = (event: MouseEvent) => {
      if (!dirtyRef.current) return;
      const anchor = (event.target as HTMLElement).closest?.("a[href]");
      if (!anchor || formRef.current?.contains(anchor)) return;
      if (!confirm(UNSAVED_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        dirtyRef.current = false;
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  // A failed save (validation errors) leaves the content unsaved.
  useEffect(() => {
    if (state?.errors || state?.message) dirtyRef.current = true;
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      onChange={() => (dirtyRef.current = true)}
      onSubmit={() => (dirtyRef.current = false)}
      className="flex flex-col gap-4"
    >
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={post?.title}
          placeholder="5 signs your water heater is failing"
          required
          onChange={(event) => {
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <FieldError errors={state?.errors?.title} />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value) || event.target.value);
          }}
          placeholder="auto-generated-from-title"
          className="font-mono text-xs"
        />
        <FieldError errors={state?.errors?.slug} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="content" className="mb-0!">
            Content (Markdown)
          </Label>
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={cn(
                "rounded-md px-3 py-1 text-xs transition-colors cursor-pointer",
                tab === "write"
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:text-foreground"
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={showPreview}
              className={cn(
                "rounded-md px-3 py-1 text-xs transition-colors cursor-pointer",
                tab === "preview"
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:text-foreground"
              )}
            >
              Preview
            </button>
          </div>
        </div>
        {/* The textarea stays mounted (hidden) during preview so unsaved
            content and form submission keep working. */}
        <Textarea
          ref={contentRef}
          id="content"
          name="content"
          rows={18}
          defaultValue={post?.content}
          placeholder={"## Heading\n\nWrite your post in markdown…"}
          className={cn(
            "font-mono text-xs leading-relaxed",
            tab === "preview" && "hidden"
          )}
          required
        />
        {tab === "preview" && (
          <div className="min-h-90 rounded-lg border border-border-strong bg-surface-2 px-4 py-3">
            {previewHtml ? (
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-muted">Nothing to preview yet.</p>
            )}
          </div>
        )}
        <FieldError errors={state?.errors?.content} />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-2 p-3">
        <input
          type="checkbox"
          name="status"
          value="published"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <span className="text-sm">
          <span className="font-medium">Published</span>
          <span className="ml-2 text-xs text-muted">
            {published
              ? "Visible on your website"
              : "Draft — only visible here"}
          </span>
        </span>
      </label>

      {state?.message && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : post ? "Save post" : "Create post"}
        </Button>
      </div>
    </form>
  );
}
