import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveBlogUiText } from "@/lib/blog/localization";
import type {
  LocalizedBlogAuthor,
  LocalizedBlogCategory,
  LocalizedBlogTag,
} from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";

import { BlockSurface } from "./BlockSurface";

export type BlogTaxonomyGridItem =
  | LocalizedBlogCategory
  | LocalizedBlogTag
  | LocalizedBlogAuthor;

export function selectPreviewBlogTaxonomyItems(input: {
  block: BlockInstance<"blogTaxonomyGrid">;
  items: {
    categories: LocalizedBlogCategory[];
    tags: LocalizedBlogTag[];
    authors: LocalizedBlogAuthor[];
  };
}) {
  const items =
    input.block.taxonomy === "categories"
      ? input.items.categories
      : input.block.taxonomy === "tags"
        ? input.items.tags
        : input.items.authors;

  return items.slice(0, input.block.limit);
}

export function BlogTaxonomyGridContent({
  block,
  items,
  locale,
}: {
  block: BlockInstance<"blogTaxonomyGrid">;
  items: BlogTaxonomyGridItem[];
  locale: "en" | "ar";
}) {
  const ctaLabel = resolveBlogUiText(
    "taxonomyCtaLabel",
    locale,
    block.ctaLabel,
  );
  const emptyStateHeading = resolveBlogUiText(
    "taxonomyEmptyStateHeading",
    locale,
    block.emptyStateHeading,
  );
  const emptyStateDescription = resolveBlogUiText(
    "taxonomyEmptyStateDescription",
    locale,
    block.emptyStateDescription,
  );

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-8"
    >
      {() => (
        <>
          {block.eyebrow || block.heading || block.description ? (
            <div className="mx-auto max-w-3xl text-center">
              {block.eyebrow ? (
                <Badge variant="outline" className="mb-4">
                  {block.eyebrow}
                </Badge>
              ) : null}
              {block.heading ? (
                <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                  {block.heading}
                </h2>
              ) : null}
              {block.description ? (
                <p className="mt-3 text-base text-muted-foreground md:text-lg">
                  {block.description}
                </p>
              ) : null}
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {emptyStateHeading}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {emptyStateDescription}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const isAuthor = block.taxonomy === "authors";
                const bodyText =
                  "bio" in item
                    ? item.bio
                    : "description" in item
                      ? item.description
                      : null;
                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      {isAuthor && "avatar" in item && item.avatar ? (
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          width={72}
                          height={72}
                          className="rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-foreground">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {item.name}
                        </h3>
                        {bodyText ? (
                          <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                            {bodyText}
                          </p>
                        ) : null}
                        <div className="mt-5">
                          <Button asChild variant="outline">
                            <Link href={item.path}>{ctaLabel}</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </BlockSurface>
  );
}
