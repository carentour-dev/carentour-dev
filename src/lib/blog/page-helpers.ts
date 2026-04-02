import type { CmsPage } from "@/lib/cms/server";
import { normalizeBlocks, type BlockInstance } from "@/lib/cms/blocks";

export function resolveBlogPageBlocks(cmsPage: CmsPage | null) {
  return normalizeBlocks(cmsPage?.content ?? []);
}

export function extractBlogAiSummary(
  blocks: BlockInstance[],
  extraParts: Array<string | null | undefined> = [],
) {
  const blockParts = blocks.flatMap((block) => {
    switch (block.type) {
      case "hero":
      case "aboutHero":
        return [
          "heading" in block ? block.heading : null,
          "description" in block ? block.description : null,
        ];
      case "storyNarrative":
        return [block.heading, block.lead, ...(block.paragraphs ?? [])];
      case "richText":
        return [block.markdown];
      case "callToAction":
        return [block.heading, block.description];
      case "blogPostFeed":
        return [block.heading, block.description, block.relatedHeading];
      case "blogTaxonomyGrid":
        return [block.heading, block.description];
      case "blogAuthorSummary":
        return [block.heading, block.description];
      default:
        return [];
    }
  });

  return [...extraParts, ...blockParts]
    .filter((value): value is string =>
      Boolean(value && value.trim().length > 0),
    )
    .join(" ")
    .trim();
}
