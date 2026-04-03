"use client";

import type { BlockInstance } from "@/lib/cms/blocks";
import type { CmsBlogPreviewData } from "@/lib/cms/previewData";

import { BlockSurface } from "./BlockSurface";
import {
  BlogPostFeedContent,
  selectPreviewBlogPostFeedItems,
} from "./BlogPostFeedBlockContent";

function PreviewState({
  block,
  title,
  description,
}: {
  block: BlockInstance<"blogPostFeed">;
  title: string;
  description: string;
}) {
  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4.5rem", bottom: "4.5rem" }}
      contentClassName="space-y-6"
    >
      {() => (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </BlockSurface>
  );
}

export function BlogPostFeedPreview({
  block,
  locale,
  previewData,
  loading,
  error,
}: {
  block: BlockInstance<"blogPostFeed">;
  locale: "en" | "ar";
  previewData: CmsBlogPreviewData | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <PreviewState
        block={block}
        title="Loading blog preview"
        description="Fetching sample editorial content for this block."
      />
    );
  }

  if (error) {
    return (
      <PreviewState
        block={block}
        title="Blog preview unavailable"
        description={error}
      />
    );
  }

  if (!previewData) {
    return (
      <PreviewState
        block={block}
        title="Blog preview unavailable"
        description="Open the page-level preview to render this block with live editorial data."
      />
    );
  }

  const context = previewData.blogContext
    ? { blog: previewData.blogContext }
    : undefined;
  const posts = selectPreviewBlogPostFeedItems({
    block,
    context,
    posts: previewData.posts,
  });

  return (
    <BlogPostFeedContent
      block={block}
      posts={posts}
      context={context}
      locale={locale}
    />
  );
}
