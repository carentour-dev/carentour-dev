import { AuthorCard } from "@/components/blog/AuthorCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlockInstance } from "@/lib/cms/blocks";
import { resolveBlogUiText } from "@/lib/blog/localization";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import { BlockSurface } from "./BlockSurface";

type BlogAuthorSummaryContext = {
  blog?: BlogBlockContextEntity | null;
};

export function BlogAuthorSummaryBlock({
  block,
  context,
  locale,
}: {
  block: BlockInstance<"blogAuthorSummary">;
  context?: BlogAuthorSummaryContext;
  locale: "en" | "ar";
}) {
  const author =
    context?.blog?.type === "author"
      ? context.blog.author
      : context?.blog?.type === "post"
        ? context.blog.post.author
        : null;
  const heading = resolveBlogUiText(
    "authorSummaryHeading",
    locale,
    block.heading,
  );
  const archiveLinkLabel = resolveBlogUiText(
    "authorArchiveLinkLabel",
    locale,
    block.archiveLinkLabel,
  );
  const emptyStateHeading = resolveBlogUiText(
    "authorSummaryEmptyStateHeading",
    locale,
    block.emptyStateHeading,
  );
  const emptyStateDescription = resolveBlogUiText(
    "authorSummaryEmptyStateDescription",
    locale,
    block.emptyStateDescription,
  );

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "2rem", bottom: "2rem" }}
      contentClassName="space-y-6"
    >
      {() =>
        author ? (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="space-y-2">
              <Badge variant="outline">{heading}</Badge>
              {block.description ? (
                <p className="text-sm text-muted-foreground">
                  {block.description}
                </p>
              ) : null}
            </div>
            <AuthorCard author={author} />
            {block.showArchiveLink ? (
              <div>
                <Button asChild variant="outline">
                  <a href={author.path}>{archiveLinkLabel}</a>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {emptyStateHeading}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {emptyStateDescription}
            </p>
          </div>
        )
      }
    </BlockSurface>
  );
}
