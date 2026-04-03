import { listLocalizedBlogTaxonomy } from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";

import { BlogTaxonomyGridContent } from "./BlogTaxonomyGridBlockContent";

export async function BlogTaxonomyGridBlock({
  block,
  locale,
}: {
  block: BlockInstance<"blogTaxonomyGrid">;
  locale: "en" | "ar";
}) {
  const items = await listLocalizedBlogTaxonomy({
    locale,
    type: block.taxonomy,
    publishedOnly: true,
  });

  return (
    <BlogTaxonomyGridContent
      block={block}
      items={items.slice(0, block.limit)}
      locale={locale}
    />
  );
}
