"use client";

import type { BlockInstance } from "@/lib/cms/blocks";
import type { CmsBlogPreviewData } from "@/lib/cms/previewData";

import { BlockSurface } from "./BlockSurface";
import {
  BlogTaxonomyGridContent,
  selectPreviewBlogTaxonomyItems,
} from "./BlogTaxonomyGridBlockContent";

function PreviewState({
  block,
  title,
  description,
}: {
  block: BlockInstance<"blogTaxonomyGrid">;
  title: string;
  description: string;
}) {
  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
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

export function BlogTaxonomyGridPreview({
  block,
  locale,
  previewData,
  loading,
  error,
}: {
  block: BlockInstance<"blogTaxonomyGrid">;
  locale: "en" | "ar";
  previewData: CmsBlogPreviewData | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <PreviewState
        block={block}
        title="Loading taxonomy preview"
        description="Fetching sample archive data for this block."
      />
    );
  }

  if (error) {
    return (
      <PreviewState
        block={block}
        title="Taxonomy preview unavailable"
        description={error}
      />
    );
  }

  if (!previewData) {
    return (
      <PreviewState
        block={block}
        title="Taxonomy preview unavailable"
        description="Open the page-level preview to render this block with live editorial data."
      />
    );
  }

  const items = selectPreviewBlogTaxonomyItems({
    block,
    items: previewData.taxonomy,
  });

  return (
    <BlogTaxonomyGridContent block={block} items={items} locale={locale} />
  );
}
