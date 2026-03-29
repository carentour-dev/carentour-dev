import type { BlockInstance } from "@/lib/cms/blocks";
import { getFaqsWithFallbackCached } from "@/lib/faq/queries";
import { BlockSurface } from "./BlockSurface";
import { FaqDirectoryContent } from "./FaqDirectoryContent";

export async function FaqDirectoryBlock({
  block,
}: {
  block: BlockInstance<"faqDirectory">;
}) {
  const faqResult = await getFaqsWithFallbackCached();

  if (!faqResult.faqs.length) {
    return null;
  }

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
          navigationHeading={block.navigationHeading}
          showSearch={block.showSearch}
          showCategoryDescriptions={block.showCategoryDescriptions}
          showSourceBadge={block.showSourceBadge}
          searchPlaceholder={block.searchPlaceholder}
          emptyStateHeading={block.emptyStateHeading}
          emptyStateDescription={block.emptyStateDescription}
          clearSearchLabel={block.clearSearchLabel}
          faqs={faqResult.faqs}
          categories={faqResult.categories}
          source={faqResult.source}
        />
      )}
    </BlockSurface>
  );
}
