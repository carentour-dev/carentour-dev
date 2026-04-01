"use client";

import { useSearchParams } from "next/navigation";
import type { BlockInstance } from "@/lib/cms/blocks";
import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { getDefaultCategories, getFallbackFaqs } from "@/lib/faq/data";
import { BlockSurface } from "./BlockSurface";
import { FaqDirectoryContent } from "./FaqDirectoryContent";

const previewFaqs = getFallbackFaqs().slice(0, 10);
const previewCategories = getDefaultCategories();

export function FaqDirectoryPreview({
  block,
}: {
  block: BlockInstance<"faqDirectory">;
}) {
  const searchParams = useSearchParams();
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );

  return (
    <BlockSurface
      block={block}
      className="overflow-visible border-y border-border/60 bg-background dark:border-slate-200 dark:bg-slate-50"
      defaultPadding={{ top: "5rem", bottom: "5rem" }}
      contentClassName="space-y-10"
    >
      {() => (
        <FaqDirectoryContent
          eyebrow={block.eyebrow}
          heading={block.heading}
          description={block.description}
          layout={block.layout}
          locale={locale}
          navigationHeading={block.navigationHeading}
          showSearch={block.showSearch}
          showCategoryDescriptions={block.showCategoryDescriptions}
          showSourceBadge={false}
          searchPlaceholder={block.searchPlaceholder}
          emptyStateHeading={block.emptyStateHeading}
          emptyStateDescription={block.emptyStateDescription}
          clearSearchLabel={block.clearSearchLabel}
          faqs={previewFaqs}
          categories={previewCategories}
          source="cms"
        />
      )}
    </BlockSurface>
  );
}
